import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import TestJson from "./pages/TestJson";
import Dashboard from "./pages/Dashboard";
import LiveData from "./pages/LiveData";
import {
  TemperatureSummary,
  TemperatureDetail,
  TemperatureReports,
} from "./pages/Temperature";
import { FuelSummary, FuelDetail } from "./pages/Fuel";
import { CanSummary, CanDetail } from "./pages/Can";
import { Tickets } from "./pages/Support";

function App() {
  return (
    // <BrowserRouter>
    //   <Routes>
    //     <Route path="/" element={<Login />} />
    //     <Route path="/" element={<Layout />}>
    //       <Route path="dashboard" element={<Dashboard />} />
    //       <Route path="live-data" element={<LiveData />} />
    //       <Route path="test-json" element={<TestJson />} />
    //       <Route path="temperature">
    //         <Route path="summary" element={<TemperatureSummary />} />
    //         <Route path="detail" element={<TemperatureDetail />} />
    //         <Route path="reports" element={<TemperatureReports />} />
    //       </Route>
    //       <Route path="fuel">
    //         <Route path="summary" element={<FuelSummary />} />
    //         <Route path="detail" element={<FuelDetail />} />
    //       </Route>
    //       <Route path="can">
    //         <Route path="summary" element={<CanSummary />} />
    //         <Route path="detail" element={<CanDetail />} />
    //       </Route>
    //       <Route path="support">
    //         <Route path="tickets" element={<Tickets />} />
    //       </Route>
    //     </Route>
    //     <Route path="*" element={<Navigate to="/dashboard" replace />} />
    //   </Routes>
    // </BrowserRouter>
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />

        {/* Protected routes inside layout */}
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="live-data" element={<LiveData />} />
          <Route path="test-json" element={<TestJson />} />
          <Route path="temperature">
            <Route path="summary" element={<TemperatureSummary />} />
            <Route path="detail" element={<TemperatureDetail />} />
            <Route path="reports" element={<TemperatureReports />} />
          </Route>
          <Route path="fuel">
            <Route path="summary" element={<FuelSummary />} />
            <Route path="detail" element={<FuelDetail />} />
          </Route>
          <Route path="can">
            <Route path="summary" element={<CanSummary />} />
            <Route path="detail" element={<CanDetail />} />
          </Route>
          <Route path="support">
            <Route path="tickets" element={<Tickets />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
