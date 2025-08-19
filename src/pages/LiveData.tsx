import React from 'react';
import { useUser } from '../context/UserContext';
import { Activity } from 'lucide-react';

export default function LiveData() {
  const { apiHash } = useUser();

  if (!apiHash) {
    return (
      <div className="text-gray-600">Please log in to view live data.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Activity className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-semibold text-gray-900">Live Data</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Active Vehicles</div>
          <div className="text-3xl font-semibold text-gray-900">24</div>
          <div className="text-sm text-green-600 mt-2">↑ 3 more than yesterday</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Data Points</div>
          <div className="text-3xl font-semibold text-gray-900">1.2M</div>
          <div className="text-sm text-blue-600 mt-2">Last 24 hours</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Update Rate</div>
          <div className="text-3xl font-semibold text-gray-900">30s</div>
          <div className="text-sm text-gray-600 mt-2">Average refresh time</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Real-time Vehicle Data</h2>
        <p className="text-gray-600">Live data stream coming soon...</p>
      </div>
    </div>
  );
}