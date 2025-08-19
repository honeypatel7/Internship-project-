import React, { useState } from "react";
import { format } from "date-fns";
import ReactECharts from "echarts-for-react";
import jsPDF from "jspdf";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle,
  FileImage,
  FileText,
  ChevronDown,
} from "lucide-react";

interface TemperatureRecord {
  timestamp: string;
  temperature: number;
}

interface TemperatureDataTableProps {
  data: Record<string, unknown>;
  reportName: string;
  vehicleNumber: string;
  fromDateTime: string;
  toDateTime: string;
}
const ITEMS_PER_PAGE = 100;
const BATCH_SIZE = 1000;

export function TemperatureDataTable({
  data,
  reportName,
  vehicleNumber,
  fromDateTime,
  toDateTime,
}: TemperatureDataTableProps) {
  const [records, setRecords] = React.useState<TemperatureRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [processedCount, setProcessedCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const chartRef = React.useRef<any>(null);

  React.useEffect(() => {
    setIsLoading(true);
    setIsProcessing(false);
    setError(null);
    setProcessedCount(0);
    setTotalCount(0);

    try {
      if (!data.items?.[0]?.sensors) {
        setRecords([]);
        setTotalPages(0);
        return;
      }

      const sensors = data.items[0].sensors;

      let total = 0;
      Object.values(sensors).forEach((sensor: any) => {
        if (sensor.values) {
          total += Object.keys(sensor.values).length;
        }
      });

      setTotalCount(total);

      if (total > 50000) {
        setError(
          `Large dataset detected (${total.toLocaleString()} records). Please reduce the time range or interval.`
        );
        setIsLoading(false);
        return;
      }

      setIsProcessing(true);

      const processDataInBatches = async () => {
        const allRecords: TemperatureRecord[] = [];
        let processed = 0;

        for (const sensor of Object.values(sensors)) {
          if (!sensor.values) continue;

          const entries = Object.entries(sensor.values);
          for (let i = 0; i < entries.length; i += BATCH_SIZE) {
            const batch = entries.slice(i, i + BATCH_SIZE);

            const batchRecords = batch.reduce(
              (acc: TemperatureRecord[], [_, value]: [string, any]) => {
                if (value.t && value.v !== undefined) {
                  acc.push({
                    timestamp: value.t,
                    temperature: parseFloat(value.v),
                  });
                }
                return acc;
              },
              []
            );

            allRecords.push(...batchRecords);
            processed += batch.length;
            setProcessedCount(processed);
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        const sortedRecords = allRecords.sort(
          (a, b) => Number(a.timestamp) - Number(b.timestamp)
        );

        setRecords(sortedRecords);
        setTotalPages(Math.ceil(sortedRecords.length / ITEMS_PER_PAGE));
        setCurrentPage(0);
        setIsProcessing(false);
      };

      processDataInBatches();
    } catch (err) {
      setError(
        `Failed to process temperature data: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      console.error("Error processing temperature data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  const paginatedRecords = React.useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return records.slice(start, start + ITEMS_PER_PAGE);
  }, [records, currentPage]);

  const formatDate = (timestamp: string): string => {
    try {
      const date = new Date(Number(timestamp) * 1000 - 19800000);
      if (isNaN(date.getTime())) throw new Error("Invalid timestamp");
      return format(date, "dd-MM-yyyy HH:mm:ss");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      const tableTop = document.getElementById("temperature-table-top");
      if (tableTop) {
        tableTop.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const chartOptions = React.useMemo(() => {
    if (records.length === 0) return {};

    const sorted = [...records].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp)
    );

    return {
      title: {
        text: "Temperature Report",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const point = params[0];
          const unixTimestamp = point.data[0] / 1000; // convert ms back to seconds
          const formatted = formatDate(String(unixTimestamp));
          return `${formatted}<br/>Temperature: ${point.data[1]} °C`;
        },
      },
      xAxis: {
        type: "time",
        name: "Date & Time",

        axisLabel: {
          formatter: (value: number) => {
            return formatDate(String(value / 1000)); // Your existing formatter
          },
          rotate: 30,
          interval: 0, //  Force showing all labels
          fontSize: 10,
          color: "#333",
        },
        axisTick: {
          alignWithLabel: true,
        },
        splitNumber: 20, //  Suggests how many intervals to create
        minInterval: 1000 * 60, //  Prevents ECharts from merging ticks (optional: 1 min)
      },

      yAxis: {
        type: "value",
        name: "Temperature (°C)",
        interval: 5,
        axisLabel: {
          formatter: "{value} °C",
        },
      },

      series: [
        {
          name: "Temperature",
          type: "line",
          smooth: true,
          showSymbol: false, //  show dots
          symbolSize: 4, // size of dots
          sampling: "lttb", // helps with large datasets

          data: sorted.map((record) => [
            Number(record.timestamp) * 1000 - 19800000,
            record.temperature,
          ]),

          itemStyle: {
            color: "#3b82f6", // dot color
          },

          lineStyle: {
            color: "#3b82f6", // line color
            width: 2,
          },

          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(59, 130, 246, 0.4)", // top color
                },
                {
                  offset: 1,
                  color: "rgba(59, 130, 246, 0)", // fade to transparent
                },
              ],
              global: false,
            },
          },
        },
      ],
    };
  }, [records]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading temperature data...</span>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="flex items-center mb-4">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
          <span className="text-gray-600">Processing temperature data...</span>
        </div>
        <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(processedCount / totalCount) * 100}%` }}
          />
        </div>
        <div className="text-sm text-gray-500 mt-2">
          {processedCount.toLocaleString()} of {totalCount.toLocaleString()}{" "}
          records
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">API URL:</div>
          <div className="text-sm font-mono break-all text-gray-600">
            {`https://track.onepointgps.com${data?.url}` || "No URL available"}
          </div>
        </div>
        <div className="text-center text-gray-500 py-4">
          No temperature data available
        </div>
      </div>
    );
  }

  const formatDateTime = (datetimeStr) => {
    const date = new Date(datetimeStr);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const yyyy = date.getFullYear();

    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  };
  {
    /* Export JPG*/
  }
  const exportToJPG = () => {
    const echartsInstance = chartRef.current?.getEchartsInstance();
    if (!echartsInstance) return;

    const chartDataURL = echartsInstance.getDataURL({
      type: "jpeg",
      pixelRatio: 4,
      backgroundColor: "#ffffff",
    });

    const scale = 2;
    const baseWidth = 1123;
    const baseHeight = 794;
    const width = baseWidth * scale;
    const height = baseHeight * scale;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    const margin = 20;

    const logoImg = new Image();
    logoImg.src = "/logoopg.png";

    logoImg.onload = () => {
      const logoWidth = 200;
      const logoHeight = 50;
      const logoX = margin;
      const logoY = margin;
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      let currentY = logoY + logoHeight + 20;

      // === Header (with border, no margin between sections)
      const headerHeight = 50;
      ctx.strokeStyle = "#888888";
      ctx.lineWidth = 1;
      ctx.strokeRect(margin, currentY, baseWidth - margin * 2, headerHeight);

      ctx.fillStyle = "#000000";
      ctx.font = "bold 20px Helvetica";
      ctx.textAlign = "left"; // Aligns text to the left of the x coordinate
      ctx.fillText(`Report Type: ${reportName}`, margin + 10, currentY + 33);
      currentY += headerHeight;

      // === Metadata
      const metadataHeight = 80;
      ctx.strokeStyle = "#888888";
      ctx.strokeRect(margin, currentY, baseWidth - margin * 2, metadataHeight);

      ctx.fillStyle = "#34495e";
      ctx.font = "14px Helvetica";
      ctx.textAlign = "left";

      const labelX = margin + 10;
      const valueX = labelX + 100;
      let lineY = currentY + 20;

      ctx.fillText("Device:", labelX, lineY);
      ctx.fillText(vehicleNumber, valueX, lineY);

      lineY += 20;
      ctx.fillText("From Date:", labelX, lineY);
      ctx.fillText(formatDateTime(fromDateTime), valueX, lineY);

      lineY += 20;
      ctx.fillText("To Date:", labelX, lineY);
      ctx.fillText(formatDateTime(toDateTime), valueX, lineY);

      currentY += metadataHeight;

      // === Chart Image
      const chartImg = new Image();
      chartImg.onload = () => {
        const chartPadding = 2;
        const chartAreaX = margin;
        const chartAreaY = currentY;
        const chartAreaWidth = baseWidth - margin * 2;
        const chartAreaHeight = baseHeight - chartAreaY - margin;

        ctx.strokeStyle = "#888888";
        ctx.strokeRect(chartAreaX, chartAreaY, chartAreaWidth, chartAreaHeight);

        const imgAspect = chartImg.width / chartImg.height;
        let drawWidth = chartAreaWidth - chartPadding * 2;
        let drawHeight = drawWidth / imgAspect;

        if (drawHeight > chartAreaHeight - chartPadding * 2) {
          drawHeight = chartAreaHeight - chartPadding * 2;
          drawWidth = drawHeight * imgAspect;
        }

        const chartX = chartAreaX + (chartAreaWidth - drawWidth) / 2;
        const chartY = chartAreaY + (chartAreaHeight - drawHeight) / 2;

        ctx.drawImage(chartImg, chartX, chartY, drawWidth, drawHeight);

        // === Save JPG
        const jpgData = canvas.toDataURL("image/jpeg", 1.0);
        const link = document.createElement("a");
        link.href = jpgData;
        link.download = "temperature-report.jpg";
        link.click();
      };

      chartImg.src = chartDataURL;
    };

    logoImg.onerror = () => {
      console.error("Failed to load logo from /logoopg.png");
    };
  };

  {
    /* Export PDf*/
  }
  const exportToPDF = () => {
    const echartsInstance = chartRef.current?.getEchartsInstance();
    if (!echartsInstance) return;

    const imgData = echartsInstance.getDataURL({
      type: "jpeg",
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const logoImage = new Image();
    logoImage.src = `${window.location.origin}/logoopg.png`;
    logoImage.crossOrigin = "anonymous"; // Ensures no CORS issues for canvas

    logoImage.onload = () => {
      // Convert logo to base64 via canvas
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");
      tempCanvas.width = logoImage.width;
      tempCanvas.height = logoImage.height;
      ctx.drawImage(logoImage, 0, 0);
      const logoBase64 = tempCanvas.toDataURL("image/png");

      // Create PDF
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 6;
      const tableWidth = pageWidth - margin * 2;
      const rowHeight = 14;
      let currentY = margin;

      // === Insert Logo on Left ===
      const logoWidth = 60; // wider logo
      const logoHeight = 15; // taller logo
      const logoX = margin; // left aligned
      pdf.addImage(logoBase64, "PNG", logoX, currentY, logoWidth, logoHeight);
      currentY += logoHeight + 6;

      // Theme Colors
      const headerFillColor = [255, 255, 255];
      const headerTextColor = [52, 73, 94];
      const rowFillColor = [255, 255, 255];
      const borderColor = [160, 160, 160];
      const labelTextColor = [52, 73, 94];

      // === Report Type Header ===
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setDrawColor(...borderColor);
      pdf.setFillColor(...headerFillColor);
      pdf.setTextColor(...headerTextColor);
      pdf.rect(margin, currentY, tableWidth, rowHeight, "FD");
      pdf.text("Report Type: " + reportName, margin + 4, currentY + 9);
      currentY += rowHeight;

      // === Metadata Block ===
      const tripleLineRowHeight = rowHeight * 1.8;
      const lineSpacing = 7;
      const labelX = margin + 4;
      const valueX = margin + 40;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setFillColor(...rowFillColor);
      pdf.setTextColor(...labelTextColor);

      pdf.rect(margin, currentY, tableWidth, tripleLineRowHeight, "FD");
      pdf.text("Device:", labelX, currentY + 8);
      pdf.text(vehicleNumber, valueX, currentY + 8);
      pdf.text("From Date:", labelX, currentY + 8 + lineSpacing);
      pdf.text(
        formatDateTime(fromDateTime),
        valueX,
        currentY + 8 + lineSpacing
      );
      pdf.text("To Date:", labelX, currentY + 8 + lineSpacing * 2);
      pdf.text(
        formatDateTime(toDateTime),
        valueX,
        currentY + 8 + lineSpacing * 2
      );

      currentY += tripleLineRowHeight;

      // === Chart Section ===
      const remainingHeight = pageHeight - currentY - margin;
      const chartPadding = 6;

      pdf.setDrawColor(...borderColor);
      pdf.rect(margin, currentY, tableWidth, remainingHeight);
      pdf.addImage(
        imgData,
        "JPEG",
        margin + chartPadding,
        currentY + chartPadding,
        tableWidth - chartPadding * 2,
        remainingHeight - chartPadding * 2
      );

      pdf.save("temperature-report.pdf");
    };
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">API URL:</div>
        <div className="text-sm font-mono break-all text-gray-600">
          {`https://track.onepointgps.com${data?.url}` || "No URL available"}
        </div>
      </div>
      {/* ECharts Graph */}
      <div className="p-4 bg-gray-50 rounded-lg relative">
        <div className="flex justify-end mb-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              <ChevronDown className="w-4 h-4" />
              Export
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow z-10">
                <button
                  onClick={() => {
                    exportToJPG();
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileImage className="w-4 h-4" />
                  Export to JPG
                </button>
                <button
                  onClick={() => {
                    exportToPDF();
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export to PDF
                </button>
              </div>
            )}
          </div>
        </div>

        <ReactECharts
          ref={chartRef}
          option={chartOptions}
          style={{ height: "500px", width: "100%", marginBottom: "2rem" }}
        />
      </div>

      {/* Report Table */}
      <div id="temperature-table-top" className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Sr #
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Temperature (°C)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRecords.map((record, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {currentPage * ITEMS_PER_PAGE + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(record.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.temperature.toFixed(1)}°C
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Page {currentPage + 1} of {totalPages}
                <span className="ml-2 text-gray-500">
                  ({records.length.toLocaleString()} records)
                </span>
              </span>
              <select
                value={ITEMS_PER_PAGE}
                disabled
                className="text-sm border border-gray-300 rounded-lg px-2 py-1"
              >
                <option value={ITEMS_PER_PAGE}>Show {ITEMS_PER_PAGE}</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(0)}
                disabled={currentPage === 0}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={currentPage === totalPages - 1}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
