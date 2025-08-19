import React from "react";
import { useUser } from "../../context/UserContext";
import { format } from "date-fns";
import {
  BarChart3,
  RefreshCw,
  Search,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { TemperatureDataTable } from "../../components/tables/TemperatureDataTable";

export function TemperatureReports() {
  const { apiHash } = useUser();
  const { deviceData } = useUser();
  const [reportType, setReportType] = React.useState("temperature-graph");
  const [selectedVehicle, setSelectedVehicle] = React.useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState({
    from: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    to: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [interval, setInterval] = React.useState("60");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [apiDetails, setApiDetails] = React.useState<{
    request: Record<string, unknown> | null;
    response: unknown | null;
    url?: string;
  }>({
    request: null,
    response: null,
  });

  const sortedDevices = React.useMemo(() => {
    return [...deviceData].sort((a, b) =>
      a.deviceName.localeCompare(b.deviceName)
    );
  }, [deviceData]);

  const filteredDevices = React.useMemo(() => {
    return sortedDevices.filter((device) =>
      device.deviceName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedDevices, searchQuery]);

  // Handle click outside dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (sortedDevices.length > 0 && !selectedVehicle) {
      setSelectedVehicle(sortedDevices[0].deviceId);
    }
  }, [sortedDevices, selectedVehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiHash) return;
    setIsGeneratingReport(true);
    setError(null);

    const selectedDevice = deviceData.find(
      (d) => d.deviceId === selectedVehicle
    );
    if (!selectedDevice) return;

    setIsLoading(true);
    setError(null);

    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    const params = new URLSearchParams({
      lang: "en",
      user_api_hash: apiHash,
      format: "json",
      type: "13",
      "devices[]": selectedDevice.deviceId,
      date_from: format(fromDate, "yyyy-MM-dd"),
      from_time: format(fromDate, "HH:mm"),
      date_to: format(toDate, "yyyy-MM-dd"),
      to_time: format(toDate, "HH:mm"),
      generate: 1,
    });

    if (reportType === "location-wise") {
      params.append("interval", interval);
    }

    const requestUrl = `/api/generate_report?${params.toString()}`;
    setApiDetails((prev) => ({ ...prev, url: requestUrl }));
    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.items || !data.items[0] || !data.items[0].sensors) {
        throw new Error("Invalid response format");
      }

      setApiDetails((prev) => ({ ...prev, response: data }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report"
      );
      setApiDetails((prev) => ({ ...prev, response: null }));
    } finally {
      setIsGeneratingReport(false);
      setIsLoading(false);
    }
  };

  if (!apiHash) {
    return (
      <div className="text-gray-600">
        Please log in to view temperature reports.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-semibold text-gray-900">
          Temperature Reports
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Report
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="temperature-graph">
                  Temperature Graph Report
                </option>
                <option value="location-wise">
                  Location wise Temperature Report
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vehicle
              </label>
              <div className="relative" ref={dropdownRef}>
                <div
                  className="flex items-center justify-between w-full rounded-lg border border-gray-300 text-sm px-3 py-2 cursor-pointer bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="truncate">
                    {selectedVehicle
                      ? deviceData.find((d) => d.deviceId === selectedVehicle)
                          ?.deviceName
                      : "Select a vehicle"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search vehicles..."
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredDevices.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No vehicles found
                        </div>
                      ) : (
                        filteredDevices.map((device) => (
                          <button
                            key={device.deviceId}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              selectedVehicle === device.deviceId
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700"
                            }`}
                            onClick={() => {
                              setSelectedVehicle(device.deviceId);
                              setIsDropdownOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            {device.deviceName}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date & Time
              </label>
              <input
                type="datetime-local"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date & Time
              </label>
              <input
                type="datetime-local"
                value={dateRange.to}
                min={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {reportType === "location-wise" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interval (Minutes)
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="5">5 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isGeneratingReport || !selectedVehicle}
              className={`flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isGeneratingReport || !selectedVehicle
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isGeneratingReport ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Run Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-lg">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {(apiDetails.request || apiDetails.response) && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">Loading data...</span>
            </div>
          ) : (
            <TemperatureDataTable
              data={{ ...apiDetails.response, url: apiDetails.url }}
              reportName={
                reportType === "temperature-graph"
                  ? "Temperature Graph Report"
                  : "Location-wise Temperature Report"
              }
              vehicleNumber={
                deviceData.find((d) => d.deviceId === selectedVehicle)
                  ?.deviceName || ""
              }
              fromDateTime={dateRange.from}
              toDateTime={dateRange.to}
            />
          )}
        </div>
      )}
    </div>
  );
}
