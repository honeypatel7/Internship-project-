import React from 'react';
import { useUser } from '../../context/UserContext';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ApiDataViewer } from '../../components/data/ApiDataViewer';
import { MapModal } from '../../components/modals/MapModal';
import { deviceService } from '../../services';
import type { Device } from '../../services/types';
import { TemperatureDataTable } from '../../components/tables/TemperatureDataTable';
import {
    BarChart3, Car, MapPin, Clock, Timer, Gauge, Power,
    Battery, Signal, Wind, Thermometer, Satellite,
    RefreshCw, Search, X, ChevronDown
} from 'lucide-react';

const REFRESH_INTERVAL = 30000; // 30 seconds

export function TemperatureDetail() {
    const { apiHash } = useUser();
    const [searchParams] = React.useState(new URLSearchParams(window.location.search));
    const [vehicles, setVehicles] = React.useState < Device[] > ([]);
    const [selectedVehicle, setSelectedVehicle] = React.useState < string > ('');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [lastRefresh, setLastRefresh] = React.useState < Date > (new Date());
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState < string | null > (null);
    const [showMap, setShowMap] = React.useState(false);
    const [dateRange, setDateRange] = React.useState < {
        start: Date | null;
        end: Date | null;
    } > ({
        start: new Date(new Date().setHours(0, 0, 0, 0)),
        end: new Date(new Date().setHours(23, 59, 59, 999))
    });
    const [interval, setInterval] = React.useState<string>('60');
    const dropdownRef = React.useRef < HTMLDivElement > (null);
    const [apiDetails, setApiDetails] = React.useState<{
        request: Record<string, unknown> | null;
        response: unknown | null;
        url?: string;
    }>({
        request: null,
        response: null
    });
    const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);

    const handleRunReport = async () => {
        if (!apiHash || !selectedVehicle || !dateRange.start || !dateRange.end) return;
        
        try {
            const params = new URLSearchParams({
                lang: 'en',
                user_api_hash: apiHash,
                format: 'json',
                type: '13',
                'devices[]': selectedVehicleData?.id || '',
                date_from: format(dateRange.start, 'yyyy-MM-dd'),
                from_time: format(dateRange.start, 'HH:mm'),
                date_to: format(dateRange.end, 'yyyy-MM-dd'),
                to_time: format(dateRange.end, 'HH:mm'),
                interval
            });

            const requestUrl = `https://track.onepointgps.com/api/generate_report?${params.toString()}`;
            setApiDetails(prev => ({ ...prev, url: requestUrl }));
        } catch (err) {
            setError('Failed to generate temperature report');
            setApiDetails(prev => ({ ...prev, response: null }));
        }
    };

    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 5 && numValue <= 60) {
            setInterval(value);
        }
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredVehicles = React.useMemo(() => {
        return vehicles.filter(vehicle =>
            vehicle.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [vehicles, searchQuery]);

    const fetchVehicles = React.useCallback(async () => {
        if (!apiHash) return;

        try {
            const response = await deviceService.getDevices(apiHash);
            const devices = response.data.flatMap(group => group.items || [])
                .filter(device => {
                    const temp = device.sensors?.find(s => s.name === 'Temperature')?.val;
                    return temp !== undefined && temp !== '-' && !isNaN(Number(temp));
                })
                .sort((a, b) => a.name.localeCompare(b.name));

            setVehicles(devices);
            setLastRefresh(new Date());

            // Get vehicle from URL parameter
            const urlVehicle = searchParams.get('vehicle');
            if (urlVehicle) {
                const vehicle = devices.find(d => d.name === urlVehicle);
                if (vehicle) {
                    setSelectedVehicle(vehicle.name);
                    setSearchQuery(vehicle.name);
                }
            } else if (!selectedVehicle && devices.length > 0) {
                setSelectedVehicle(devices[0].name);
            }

            setIsLoading(false);
        } catch (err) {
            setError('Failed to fetch vehicle data');
            setIsLoading(false);
        }
    }, [apiHash, selectedVehicle]);

    React.useEffect(() => {
        fetchVehicles();
        const interval = setInterval(fetchVehicles, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchVehicles]);

    const selectedVehicleData = React.useMemo(() => {
        return vehicles.find(v => v.name === selectedVehicle);
    }, [vehicles, selectedVehicle]);

    const formatDuration = (seconds: number | undefined): string => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const getSensorValue = (sensorName: string): string => {
        const sensor = selectedVehicleData?.sensors?.find(s => s.name === sensorName);
        return sensor?.val || 'N/A';
    };

    const getIgnitionStatus = (): string => {
        const ignition = selectedVehicleData?.sensors?.find(s => s.type === 'ignition');
        return ignition?.val === true || ignition?.val === 'true' ? 'ON' : 'OFF';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                    <Car className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Temperature Analysis</h1>
                        <p className="text-sm text-gray-500 mt-1">Monitor temperature data for selected vehicles</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Input Parameters</h2>
                <div className="flex space-x-6">
                    {/* Vehicle Selection */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                        <div className="relative" ref={dropdownRef}>
                            <div
                                className="flex items-center justify-between rounded-lg border border-gray-300 text-sm px-4 py-2 w-full cursor-pointer bg-white" style={{ minWidth: '25ch' }}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span className="truncate">
                                    {selectedVehicle || 'Select a vehicle'}
                                </span>
                                <ChevronDown className="w-4 h-4 ml-2" />
                            </div>
                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                    <div className="p-2 border-b">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search vehicles..."
                                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredVehicles.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                No vehicles found
                                            </div>
                                        ) : (
                                            filteredVehicles.map((vehicle) => (
                                                <button
                                                    key={vehicle.id}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedVehicle === vehicle.name ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedVehicle(vehicle.name);
                                                        setIsDropdownOpen(false);
                                                        setSearchQuery('');
                                                    }}
                                                >
                                                    {vehicle.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Date Range</label>
                        <div className="flex items-center space-x-2">
                            <DatePicker
                                selected={dateRange.start}
                                onChange={(date: Date) => setDateRange(prev => ({ ...prev, start: date }))}
                                selectsStart
                                startDate={dateRange.start}
                                endDate={dateRange.end}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy HH:mm"
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholderText="Start"
                            />
                            <span className="text-gray-500">-</span>
                            <DatePicker
                                selected={dateRange.end}
                                onChange={(date: Date) => setDateRange(prev => ({ ...prev, end: date }))}
                                selectsEnd
                                startDate={dateRange.start}
                                endDate={dateRange.end}
                                minDate={dateRange.start}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy HH:mm"
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholderText="End"
                            />
                        </div>
                    </div>

                    {/* Interval Selection */}
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">Interval (Min)</label>
                      <select
                        value={interval}
                        onChange={(e) => handleIntervalChange(e)}
                        className="px-3 py-2 w-24 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      > 
                        <option value="60">60</option>
                        <option value="30">30</option>
                        <option value="15">15</option>
                        <option value="5">5</option>
                      </select>
                    </div>
                  
                    <div className="flex justify-end mt-6 space-x-3">
                        <button
                            onClick={handleRunReport}
                            disabled={isGeneratingReport || !selectedVehicle}
                            className={`px-6 py-2 rounded-lg text-sm font-medium ${
                                isGeneratingReport || !selectedVehicle
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                        >
                            <span className="flex items-center">
                                {isGeneratingReport ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        Run
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading vehicle data...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 rounded-lg p-4 text-red-600">
                    {error}
                </div>
            ) : selectedVehicleData ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                            <div>
                                <div className="text-sm font-medium text-gray-500 mb-2">Vehicle Information</div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Car className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">Vehicle Number</span>
                                        </div>
                                        <span className="font-medium">{selectedVehicleData.name}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">Location</span>
                                        </div>
                                        <button
                                            onClick={() => setShowMap(true)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            View Map
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">Last Update</span>
                                        </div>
                                        <span className="font-medium">
                                            {selectedVehicleData.timestamp
                                                ? format(new Date(selectedVehicleData.timestamp * 1000), 'dd-MMM-yy HH:mm:ss')
                                                : 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Timer className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">Stop Duration</span>
                                        </div>
                                        <span className="font-medium">
                                            {formatDuration(selectedVehicleData.stop_duration_sec)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                            <div>
                                <div className="text-sm font-medium text-gray-500 mb-2">Vehicle Status</div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Gauge className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">Current Speed</span>
                                        </div>
                                        <span className="font-medium">
                                            {selectedVehicleData.speed ? `${Math.round(selectedVehicleData.speed)} km/h` : 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Power className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">Ignition</span>
                                        </div>
                                        <span className={`font-medium ${getIgnitionStatus() === 'ON' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {getIgnitionStatus()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Satellite className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">Satellites</span>
                                        </div>
                                        <span className="font-medium">
                                            {selectedVehicleData.sensors?.find(s => s.type === 'satellites')?.value || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Battery className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">Battery</span>
                                        </div>
                                        <span className="font-medium">
                                            {getSensorValue('Battery')}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                            <div>
                                <div className="text-sm font-medium text-gray-500 mb-2">Temperature & Power</div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Signal className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">GSM Signal</span>
                                        </div>
                                        <span className="font-medium">
                                            {selectedVehicleData.sensors?.find(s => s.type === 'gsm')?.val || 'N/A'}%
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Power className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">Power</span>
                                        </div>
                                        <span className="font-medium">
                                            {getSensorValue('Power')} V
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Wind className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">AC Status</span>
                                        </div>
                                        <span className={`font-medium ${getSensorValue('AC') === 'ON' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {getSensorValue('AC')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Thermometer className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-600">Temperature</span>
                                        </div>
                                        <span className="font-medium">
                                            {getSensorValue('Temperature')}°C
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-right text-sm text-gray-500">
                        Last refreshed: {format(lastRefresh, 'dd-MMM-yy HH:mm:ss')}
                    </div>

                    {showMap && selectedVehicleData.device_data?.lastValidLatitude && selectedVehicleData.device_data?.lastValidLongitude && (
                        <MapModal
                            isOpen={showMap}
                            onClose={() => setShowMap(false)}
                            latitude={selectedVehicleData.device_data.lastValidLatitude}
                            longitude={selectedVehicleData.device_data.lastValidLongitude}
                            vehicleName={selectedVehicleData.name}
                        />
                    )}
                </>
            ) : (
                <div className="bg-yellow-50 rounded-lg p-4 text-yellow-600">
                    No vehicles found with temperature data.
                </div>
            )}

            {apiDetails.url && (
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    <h2 className="text-lg font-medium text-gray-900">API Details</h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-700 mb-2">API URL:</div>
                            <div className="text-sm font-mono break-all text-gray-600">
                                {apiDetails.url}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm">
                            <ApiDataViewer url={apiDetails.url} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}