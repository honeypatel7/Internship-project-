import React from "react";
import { useUser } from "../../context/UserContext";
import { TempTable } from "../../components/tables/TempTable";
import { BarChart3, ThermometerSun } from "lucide-react";

export function TemperatureSummary() {
  const { apiHash } = useUser();

  if (!apiHash) {
    return (
      <div className="text-gray-600">
        Please log in to view temperature data.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ThermometerSun className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-semibold text-gray-900">
            Temperature Summary
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <select className="rounded-lg border border-gray-300 text-sm px-3 py-2">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">
            Average Temperature
          </div>
          <div className="text-3xl font-semibold text-gray-900">24.5°C</div>
          <div className="text-sm text-green-600 mt-2">
            ↓ 2.3°C from yesterday
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">
            Temperature Alerts
          </div>
          <div className="text-3xl font-semibold text-gray-900">3</div>
          <div className="text-sm text-red-600 mt-2">↑ 2 new alerts today</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">
            Vehicles Monitored
          </div>
          <div className="text-3xl font-semibold text-gray-900">42</div>
          <div className="text-sm text-blue-600 mt-2">100% reporting</div>
        </div>
      </div>

      <TempTable apiHash={apiHash} />
    </div>
  );
}
