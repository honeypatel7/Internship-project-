import React, { createContext, useContext, useState, useEffect } from "react";
import { deviceService } from "../services";
import type { Device } from "../services/types";

interface DeviceInfo {
  deviceId: string;
  traccarId: string;
  deviceName: string;
}

interface UserContextType {
  email: string | null;
  apiHash: string | null;
  firstName: string | null;
  lastName: string | null;
  deviceData: DeviceInfo[];
  setUserData: (email: string, apiHash: string) => void;
  updateUserProfile: (
    firstName: string | null,
    lastName: string | null
  ) => void;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [apiHash, setApiHash] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceInfo[]>([]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    const storedApiHash = localStorage.getItem("apiHash");
    if (storedEmail && storedApiHash) {
      setEmail(storedEmail);
      setApiHash(storedApiHash);
      fetchDevices(storedApiHash);
    }
  }, []);

  const fetchDevices = async (apiHash: string) => {
    try {
      const response = await deviceService.getDevices(apiHash);
      const devices: DeviceInfo[] = response.data
        .flatMap((group) => group.items || [])
        .map((device: Device) => ({
          deviceId: device.id,
          traccarId: device.device_data?.traccar_device_id || "",
          deviceName: device.name,
        }));
      setDeviceData(devices);
    } catch (error) {
      console.error("Failed to fetch device data:", error);
    }
  };

  const setUserData = async (email: string, apiHash: string) => {
    setEmail(email);
    setApiHash(apiHash);
    localStorage.setItem("email", email);
    localStorage.setItem("apiHash", apiHash);
    fetchDevices(apiHash);
  };

  const updateUserProfile = (
    firstName: string | null,
    lastName: string | null
  ) => {
    setFirstName(firstName);
    setLastName(lastName);
  };

  const clearUserData = () => {
    setEmail(null);
    setApiHash(null);
    setFirstName(null);
    setLastName(null);
    setDeviceData([]);
    localStorage.removeItem("email");
    localStorage.removeItem("apiHash");
  };

  return (
    <UserContext.Provider
      value={{
        email,
        apiHash,
        firstName,
        lastName,
        deviceData,
        setUserData,
        updateUserProfile,
        clearUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
