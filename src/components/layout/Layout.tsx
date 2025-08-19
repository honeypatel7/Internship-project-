import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { useSidebar } from './SidebarContext';

export default function Layout() {
  const { isExpanded } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      <TopHeader />
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? 'ml-64' : 'ml-16'
      }`}>
        <main className="flex-1 p-8 mt-16 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}