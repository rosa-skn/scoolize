import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UniversityPage from "./pages/UniversityPage";
import Search from "./pages/Search";
import Formation from "./pages/Formation";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/university/:name" element={<UniversityPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/formation/:id" element={<Formation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
