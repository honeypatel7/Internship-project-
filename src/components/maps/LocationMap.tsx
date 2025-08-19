import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, LatLng } from 'leaflet';
import { useUser } from '../../context/UserContext';
import { geocodingService } from '../../services';
import { Loader2 } from 'lucide-react';

// Fix for default marker icon
const icon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  vehicleName: string;
  coordinates?: string;
}

// Component to handle path bounds
function PathBounds({ coordinates }: { coordinates: LatLng[] }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (coordinates.length > 1) {
      const bounds = coordinates.reduce((bounds, coord) => bounds.extend(coord), map.getBounds());
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);

  return null;
}

export function LocationMap({ latitude, longitude, vehicleName, coordinates }: LocationMapProps) {
  const { apiHash } = useUser();
  const [address, setAddress] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAddress = async () => {
      if (!apiHash) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await geocodingService.getReverseGeocode(
          apiHash,
          latitude,
          longitude
        );
        setAddress(response.data.location.address);
      } catch (err) {
        setError('Failed to fetch address');
        console.error('Error fetching address:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddress();
  }, [apiHash, latitude, longitude]);

  const pathCoordinates = React.useMemo(() => {
    if (!coordinates) return [];
    
    return coordinates.split(',').map(point => {
      const [lat, lng] = point.split('/').map(Number);
      return new LatLng(lat, lng);
    });
  }, [coordinates]);

  // Calculate arrow positions for direction indicators
  const arrowPositions = React.useMemo(() => {
    if (pathCoordinates.length < 2) return [];
    
    return pathCoordinates.slice(0, -1).map((point, index) => {
      const nextPoint = pathCoordinates[index + 1];
      return {
        position: new LatLng(
          (point.lat + nextPoint.lat) / 2,
          (point.lng + nextPoint.lng) / 2
        ),
        rotation: Math.atan2(
          nextPoint.lng - point.lng,
          nextPoint.lat - point.lat
        ) * (180 / Math.PI)
      };
    });
  }, [pathCoordinates]);

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      style={{ height: '400px', width: '100%', minWidth: '300px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pathCoordinates.length > 1 && <PathBounds coordinates={pathCoordinates} />}
      {pathCoordinates.length > 1 && (
        <>
          <Polyline
            positions={pathCoordinates}
            pathOptions={{
              color: '#2563EB',
              weight: 4,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: '1, 8',
              dashOffset: '0'
            }}
          />
          <Polyline
            positions={pathCoordinates}
            pathOptions={{
              color: '#1E40AF',
              weight: 2,
              opacity: 0.4,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
          {arrowPositions.map((arrow, index) => (
            <Marker
              key={index}
              position={arrow.position}
              icon={new Icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="8" fill="#2563EB" fill-opacity="0.9"/>
                    <path d="M4 8H12M12 8L9 5M12 8L9 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                `),
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })}
              rotationAngle={arrow.rotation}
            />
          ))}
        </>
      )}
      <Marker position={[latitude, longitude]} icon={icon}>
        <Popup>
          <div className="min-w-[200px] max-w-[300px]">
            <div className="font-medium text-gray-900">{vehicleName}</div>
            <div className="mt-2 text-[12px] text-[#808080] min-h-[1.5em]">
              {isLoading ? (
                <div className="flex items-center space-x-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading address...</span>
                </div>
              ) : error ? (
                <span className="text-red-500">Address unavailable</span>
              ) : (
                address || 'No address found'
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Lat: {latitude.toFixed(6)}<br />
              Long: {longitude.toFixed(6)}
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}