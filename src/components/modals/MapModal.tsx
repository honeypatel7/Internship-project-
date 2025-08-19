import React from 'react';
import { X } from 'lucide-react';
import { LocationMap } from '../maps/LocationMap';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  vehicleName: string;
  coordinates?: string;
}

export function MapModal({ isOpen, onClose, latitude, longitude, vehicleName, coordinates }: MapModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    // Add a slight delay to allow for fade-out animation
    setTimeout(onClose, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-transform duration-200 ease-out animate-slideIn">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">Vehicle Location</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            vehicleName={vehicleName}
            coordinates={coordinates}
          />
        </div>
      </div>
    </div>
  );
}