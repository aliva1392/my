import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Printing from "./pages/Printing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/printing" replace />} />
            <Route path="/printing" element={<Printing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;