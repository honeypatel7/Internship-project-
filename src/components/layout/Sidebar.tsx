import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from './SidebarContext';
import {
  LayoutDashboard,
  Activity,
  FileJson,
  Thermometer,
  Droplet,
  Cable,
  LifeBuoy,
  ChevronRight,
  Menu,
} from 'lucide-react';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  submenu?: {
    title: string;
    path: string;
  }[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    title: 'Live Data',
    path: '/live-data',
    icon: <Activity className="w-5 h-5" />,
  },
  {
    title: 'Test JSON',
    path: '/test-json',
    icon: <FileJson className="w-5 h-5" />,
  },
  {
    title: 'Temperature Analysis',
    path: '/temperature',
    icon: <Thermometer className="w-5 h-5" />,
    submenu: [
      { title: 'Summary', path: '/temperature/summary' },
      { title: 'Vehicle Temperature', path: '/temperature/detail' },
      { title: 'Temperature Reports', path: '/temperature/reports' },
    ],
  },
  {
    title: 'Fuel Analysis',
    path: '/fuel',
    icon: <Droplet className="w-5 h-5" />,
    submenu: [
      { title: 'Summary', path: '/fuel/summary' },
      { title: 'Vehicle Fuel', path: '/fuel/detail' },
    ],
  },
  {
    title: 'CAN Analysis',
    path: '/can',
    icon: <Cable className="w-5 h-5" />,
    submenu: [
      { title: 'Summary', path: '/can/summary' },
      { title: 'Vehicle CAN', path: '/can/detail' },
    ],
  },
  {
    title: 'Support',
    path: '/support',
    icon: <LifeBuoy className="w-5 h-5" />,
    submenu: [
      { title: 'Tickets', path: '/support/tickets' },
    ],
  },
];

export default function Sidebar() {
  const { isExpanded, setIsExpanded } = useSidebar();
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (item: MenuItem) => {
    if (item.submenu) {
      setExpandedSubmenu(expandedSubmenu === item.path ? null : item.path);
    } else {
      navigate(item.path);
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isSubmenuActive = (item: MenuItem) =>
    item.submenu?.some((subItem) => location.pathname === subItem.path);

  return (
    <aside
      className={`fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64 shadow-lg' : 'w-16'
      }`}
      onMouseEnter={() => !isExpanded && setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setExpandedSubmenu(null);
      }}
    >
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => (
          <div key={item.path}>
            <button
              onClick={() => handleMenuClick(item)}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive(item.path) || isSubmenuActive(item)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center">
                {item.icon}
                <span
                  className={`ml-3 transition-opacity duration-300 ${
                    isExpanded ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {item.title}
                </span>
              </span>
              {item.submenu && isExpanded && (
                <ChevronRight
                  className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                    expandedSubmenu === item.path ? 'rotate-90' : ''
                  }`}
                />
              )}
            </button>
            {item.submenu && expandedSubmenu === item.path && isExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                {item.submenu.map((subItem) => (
                  <button
                    key={subItem.path}
                    onClick={() => navigate(subItem.path)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive(subItem.path)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {subItem.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}