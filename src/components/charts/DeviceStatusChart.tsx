import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useUser } from '../../context/UserContext';
import { AlertCircle, Loader2 } from 'lucide-react';
import { deviceService } from '../../services';
import type { DeviceStatusCount, ApiError } from '../../services/types';

const POLLING_INTERVAL = 30000; // 30 seconds

function formatLastUpdated(timestamp: Date | null): string {
  if (!timestamp) return 'Never';

  const day = timestamp.getDate().toString().padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[timestamp.getMonth()];
  const year = timestamp.getFullYear();
  const hours = timestamp.getHours().toString().padStart(2, '0');
  const minutes = timestamp.getMinutes().toString().padStart(2, '0');
  const seconds = timestamp.getSeconds().toString().padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

export function DeviceStatusChart() {
  const { apiHash } = useUser();
  const [deviceData, setDeviceData] = useState<DeviceStatusCount>({ online: 0, offline: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetchDeviceData = async () => {
    if (!apiHash) return;
    setError(null);

    try {
      const response = await deviceService.getDeviceStatusCount(apiHash);
      setDeviceData(response.data);
      setIsLoading(false);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to fetch device data');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchDeviceData();
    
    // Set up polling interval
    const interval = setInterval(fetchDeviceData, POLLING_INTERVAL);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [apiHash]);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} devices ({d}%)'
    },
    legend: {
      top: '5%',
      left: 'center',
      orient: 'horizontal',
      textStyle: {
        color: '#666'
      },
      data: ['Running', 'Stop', 'Offline']
    },
    series: [
      {
        name: 'Device Status',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            return [
              `{total|${deviceData.total}}`,
              '{subtitle|Total}',
              '{subtitle|Devices}'
            ].join('\n');
          },
          rich: {
            total: {
              fontSize: 32,
              fontWeight: 'bold',
              color: '#2D3748',
              padding: [0, 0, 8, 0]
            },
            subtitle: {
              fontSize: 14,
              color: '#718096',
              lineHeight: 18
            }
          }
        },
        emphasis: {
          scale: true,
          scaleSize: 5,
          itemStyle: {
            shadowBlur: 20,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { 
            value: deviceData.running, 
            name: 'Running',
            itemStyle: { color: '#10B981' }
          },
          { 
            value: deviceData.stop, 
            name: 'Stop',
            itemStyle: { color: '#EF4444' }
          },
          { 
            value: deviceData.offline, 
            name: 'Offline',
            itemStyle: { color: '#808080' }
          }
        ]
      }
    ]
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Device Status</h3>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <>
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm text-gray-500">Loading data...</span>
            </>
          )}
        </div>
      </div>
      <div className="text-[13px] text-[#666666] mt-1 mb-6">
        Last Updated: {formatLastUpdated(lastUpdated)}
      </div>
      {error ? (
        <div className="flex items-center justify-center h-[380px] text-red-600">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <ReactECharts 
            option={option}
            style={{ height: '380px', width: '100%', maxWidth: '580px' }}
            opts={{ renderer: 'svg' }}
            showLoading={isLoading}
            loadingOption={{ 
              text: 'Loading data...',
              textColor: '#2563EB',
              maskColor: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              showSpinner: true,
              spinnerRadius: 6,
              lineWidth: 2,
              color: '#2563EB'
            }} />
        </div>
      )}
    </div>
  );
}

export default DeviceStatusChart