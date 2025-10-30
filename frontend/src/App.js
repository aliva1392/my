import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Printing from "./pages/Printing";
import { Toaster } from "./components/ui/toaster";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Printing />} />
          <Route path="/printing" element={<Printing />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;