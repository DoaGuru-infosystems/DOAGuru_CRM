import React from "react";
import { Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import "./index.css";
import AdminRoutes from "./routes/AdminRoutes";
import EmployeeRoutes from "./routes/EmployeeRoutes";
import SuperAdminRoutes from "./routes/SuperAdminRoutes";
import OneLoginOnly from "./utils/OneLoginOnly";
import ResetPasswordOnly from "./utils/ResetPasswordOnly";
import { Toaster } from "react-hot-toast";

function App() {
  const user = useSelector((state) => state.auth.user);

  const renderRoutes = () => {
    // If not logged in or missing token, render public/auth routes
    if (!user || !user.token) {
      return (
        <>
          <Route path="/" element={<OneLoginOnly />} />
          <Route path="/reset-password" element={<ResetPasswordOnly />} />
          <Route path="*" element={<OneLoginOnly />} />
        </>
      );
    }

    // Role-based routing
    switch (user?.staff_role) {
      case "superadmin":
        return <Route path="/*" element={<SuperAdminRoutes />} />;
      case "admin":
        return <Route path="/*" element={<AdminRoutes />} />;
      case "employee":
        return <Route path="/*" element={<EmployeeRoutes />} />;
      default:
        return <Route path="/" element={<OneLoginOnly />} />;
    }
  };

  return (
    <div style={{ overflow: "hidden" }}>
      <Toaster />
      <Routes>{renderRoutes()}</Routes>
    </div>
  );
}

export default App;
