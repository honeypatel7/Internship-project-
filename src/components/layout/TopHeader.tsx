import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { userService } from "../../services";

export default function TopHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const {
    email,
    apiHash,
    firstName,
    lastName,
    clearUserData,
    updateUserProfile,
  } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!apiHash) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await userService.getUserData(apiHash);
        updateUserProfile(
          response.data.data.first_name,
          response.data.data.last_name
        );
      } catch (err) {
        setError("Failed to fetch user data");
        console.error("Error fetching user data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [apiHash, updateUserProfile]);

  const displayName =
    firstName && lastName ? `${firstName} ${lastName}` : email;

  const handleLogout = () => {
    clearUserData();
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
      <div className="h-full px-4 flex items-center justify-between">
        <img
          src="https://raw.githubusercontent.com/stackblitz/stackblitz-icons/main/files/one-point-gps-logo.png"
          alt="OnePointGPS"
          className="h-8 w-auto object-contain"
        />

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 focus:outline-none"
            title={email || ""}
          >
            <span className="text-sm font-medium text-gray-700">
              {isLoading ? "Loading..." : displayName}
            </span>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {isLoading ? "..." : displayName?.[0].toUpperCase()}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <User className="w-4 h-4 mr-3" />
                Profile
              </button>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </button>
              <hr className="my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
