import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { FileJson, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";

interface TemperatureData {
  datetime: string;
  temperature: number;
}

const TestJson: React.FC = () => {
  const [data, setData] = useState<TemperatureData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = "/api/objects";

  const params = {
    user_api_hash: "$2y$10$wbOFizhBQ29eYhn2rkzrPuXqvKwM.ExoORc7u7L8j6otqC0GLu6Dq",
    format: "json",
    // Add other params if needed, for example:
    // type: 13,
    // devices: 3747,
    // date_from, from_time, date_to, to_time etc.
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl, { params });
        console.log("API response:", response.data);

        const items = response.data.items;
        if (!items || items.length === 0) {
          throw new Error("No temperature data found in the response");
        }

        const sensors = items[0].sensors;
        if (!sensors || sensors.length === 0) {
          throw new Error("No sensors data available in the response");
        }

        const processedData = sensors
          .flatMap((sensor: any) =>
            Object.values(sensor.values || {}).map((value: any) => ({
              datetime: format(new Date(value.t * 1000), "dd-MM-yyyy HH:mm:ss"),
              temperature: parseFloat(value.v),
            }))
          )
          .sort(
            (a, b) =>
              new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
          );

        setData(processedData);
        setIsLoading(false);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch data";
        console.error("Fetch error:", message);
        setError(message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center space-x-3">
        <FileJson className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-semibold text-gray-900">
          Temperature Data Report
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-600">Loading data...</span>
          </div>
        ) : error ? (
          <div className="flex items-center text-red-600 p-4">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            No temperature data available
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temperature (°C)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.datetime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.temperature.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">
                API URL (proxied):
              </div>
              <div className="text-sm font-mono break-all text-gray-600">
                {apiUrl}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TestJson;
