import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react"; 
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UniversityPage from "./pages/UniversityPage";
import Search from "./pages/Search";
import Formation from "./pages/Formation";
import Profil from "./pages/Profil";
import Comparator from "./pages/Comparator";
import FormationDetail from "./components/FormationDetails"; 

function App() {
 
  const [comparatorList, setComparatorList] = useState([]); 

  const toggleComparator = (formation) => {
    setComparatorList(prevList => {
      const isAlreadyAdded = prevList.some(item => item.recordid === formation.recordid);

      if (isAlreadyAdded) {
        return prevList.filter(item => item.recordid !== formation.recordid);
      } else {
     
        if (prevList.length >= 3) {
            alert("Vous ne pouvez comparer que 3 formations à la fois.");
            return prevList;
        }
        return [...prevList, formation];
      }
    });
  };

  const clearComparator = () => {
    setComparatorList([]);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route 
            path="/dashboard" 
            element={
                <Dashboard 
                    comparatorList={comparatorList} 
                    toggleComparator={toggleComparator} 
                />
            } 
        />
        
    
        <Route 
            path="/comparateur" 
            element={
                <Comparator 
                    comparatorList={comparatorList} 
                    toggleComparator={toggleComparator} 
                    clearComparator={clearComparator}
                />
            } 
        />

        <Route path="/university/:name" element={<UniversityPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/formation/:id" element={<Formation />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/formation/:id" element={<FormationDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;