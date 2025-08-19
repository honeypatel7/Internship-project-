import React from 'react';
import DeviceStatusChart from '../components/charts/DeviceStatusChart';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
        <div className="flex items-center space-x-4">
          <select className="rounded-lg border-gray-300 text-sm">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Active Vehicles</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">24</p>
          <div className="mt-2 text-sm text-green-600">↑ 12% from last week</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Temperature Alerts</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">3</p>
          <div className="mt-2 text-sm text-red-600">↑ 2 new alerts</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Fuel Efficiency</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">92%</p>
          <div className="mt-2 text-sm text-green-600">↑ 5% improvement</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Open Tickets</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">7</p>
          <div className="mt-2 text-sm text-yellow-600">2 high priority</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="font-medium text-gray-900">Temperature Alert - Vehicle #{i}</p>
                  <p className="text-sm text-gray-500">Temperature exceeded threshold</p>
                </div>
                <span className="text-sm text-gray-500">{i}h ago</span>
              </div>
            ))}
          </div>
        </div>
        <DeviceStatusChart />
      </div>
    </div>
  );
}