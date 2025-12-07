import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Map from "./Map";
import { fetchParcoursupData } from "../services/parcoursupAPI";
import { Search, HelpCircle, Heart, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
export default function Dashboard() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);

  // Parcoursup data
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchFormation, setSearchFormation] = useState("");
  const [searchZone, setSearchZone] = useState("");

  // Filter states
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [sortBy, setSortBy] = useState("pertinence");

  // Accordion states
  const [typeOpen, setTypeOpen] = useState(true);
  const [apprentissageOpen, setApprentissageOpen] = useState(false);

  // For filters
  const [types, setTypes] = useState([]);
  const [typeCounts, setTypeCounts] = useState({});

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) nav("/");
      else setUser(data.user);
    }
    loadUser();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const records = await fetchParcoursupData();
    setAllData(records);
    setFilteredData(records);

    // Count types
    const typeMap = {};
    records.forEach((r) => {
      const t = r.fields.contrat_etab || "Non spécifié";
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    setTypes(Object.keys(typeMap));
    setTypeCounts(typeMap);

    setLoading(false);
  };

  useEffect(() => {
    applyFilters();
  }, [searchFormation, searchZone, selectedTypes, sortBy]);

  const applyFilters = () => {
    let filtered = [...allData];

    // Search formation
    if (searchFormation.trim()) {
      filtered = filtered.filter((item) =>
        item.fields.lib_for_voe_ins?.toLowerCase().includes(searchFormation.toLowerCase())
      );
    }

    // Search zone
    if (searchZone.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.fields.ville_etab?.toLowerCase().includes(searchZone.toLowerCase()) ||
          item.fields.lib_dep?.toLowerCase().includes(searchZone.toLowerCase())
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((item) => 
        selectedTypes.includes(item.fields.contrat_etab)
      );
    }

    // Sort
    if (sortBy === "alphabetical") {
      filtered.sort((a, b) =>
        (a.fields.lib_for_voe_ins || "").localeCompare(b.fields.lib_for_voe_ins || "")
      );
    }

    setFilteredData(filtered);
  };

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    nav("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Chargement des formations...</p>
        </div>
      </div>
    );
  }
return (
  <div className="min-h-screen bg-white flex flex-col">
    {/* Top header */}
    <header className="border-b border-gray-300 py-4 px-6">
      <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Parcoursup</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>

    {/* Search section */}
    <div className="py-10 px-6 bg-purple-50 ml-5 mr-5 mt-5">
      <div className="max-w-screen-2xl mx-auto">
        <h2 className="text-xl font-bold text-black mb-8 text-center">
          Rechercher une formation
        </h2>

        <div className="flex gap-6 justify-center">
          {/* Left search */}
          <div className="flex-1 max-w-lg">
            <label className="text-sm text-gray-700 font-medium mb-1 flex items-center">
              Rechercher une formation, une filière...
              <HelpCircle className="w-4 h-4 ml-1 text-gray-500" />
            </label>

            <input
              type="text"
              value={searchFormation}
              onChange={(e) => setSearchFormation(e.target.value)}
              placeholder="Ex : BTS droit"
              className="w-full bg-gray-100 px-4 py-2 border-0 border-b-2 border-b-[#4B4BCC] focus:border-b-[#4B4BCC] focus:ring-0"
            />
          </div>

          {/* Zone search */}
          <div className="flex-1 max-w-lg">
            <label className="text-sm text-gray-700 font-medium mb-1 flex items-center">
              Zone géographique
              <HelpCircle className="w-4 h-4 ml-1 text-gray-500" />
            </label>

            <input
              type="text"
              value={searchZone}
              onChange={(e) => setSearchZone(e.target.value)}
              placeholder="Ex : Lyon"
              className="w-full bg-gray-100 px-4 py-2 border-0 border-b-2 border-b-[#4B4BCC] focus:border-b-[#4B4BCC] focus:ring-0"
            />
          </div>

          {/* Search button */}
          <button
            onClick={applyFilters}
            className="self-end px-6 py-3 bg-blue-900 text-white rounded hover:bg-blue-800 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Rechercher
          </button>
        </div>
      </div>
    </div>

    {/* Whole content */}
    <div className="flex flex-1 max-w-screen-2xl mx-auto w-full mt-6">
      {/* Filters left */}
      <aside className="w-64 border-r border-gray-200 p-4">
        <h3 className="text-xl font-bold mb-4">Filtres</h3>

        {/* Type filter */}
        <div className="mb-6">
          <button
            onClick={() => setTypeOpen(!typeOpen)}
            className="flex justify-between w-full text-left font-semibold text-gray-800"
          >
            Types d’établissement
            {typeOpen ? <Minus /> : <Plus />}
          </button>

          {typeOpen && (
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  checked={selectedTypes.length === 0}
                  onChange={() => setSelectedTypes([])}
                />
                Tous ({allData.length})
              </label>

              {types.map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  {type} ({typeCounts[type]})
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Apprentissage */}
        <div className="mb-6">
          <button
            onClick={() => setApprentissageOpen(!apprentissageOpen)}
            className="flex justify-between w-full text-left font-semibold text-gray-800"
          >
            Apprentissage
            {apprentissageOpen ? <Minus /> : <Plus />}
          </button>

          {apprentissageOpen && (
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                Formations en apprentissage
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                Formations hors apprentissage
              </label>
            </div>
          )}
        </div>
      </aside>

      {/* Middle results */}
      <main className="flex-1 px-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-700 text-sm">
            Plus de <strong>{filteredData.length}</strong> formations dans cette zone.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Trier par</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-400 px-3 py-1 rounded text-sm"
            >
              <option value="pertinence">Pertinence</option>
              <option value="alphabetical">Ordre alphabétique</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredData.map((item) => (
            <FormationCard key={item.recordid} data={item} />
          ))}
        </div>
      </main>

      {/* Right MAP */}
      <aside className="w-[480px] sticky top-4 h-[85vh] border border-gray-300 rounded-lg overflow-hidden ml-6">
        <Map formations={filteredData} />
      </aside>
    </div>
  </div>
);
}
const FormationCard = ({ data }) => {
  const [similar, setSimilar] = useState(false);
  const f = data.fields;

  return (
    <div className="border border-gray-300 hover:border-blue-900 p-5 bg-white">
      {/* Badge */}
     <span
  className="text-xs font-bold px-3 py-1 rounded-lg"
  style={{
    backgroundColor: "#C6FFF4",
    color: "#2C615B",
  }}
>
  {f.contrat_etab || "PUBLIC"}
</span>


      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mt-3">
        {f.lib_for_voe_ins}
      </h3>

      <p className="text-sm text-gray-700 mt-1">
        {f.ville_etab} — {f.lib_dep}
      </p>

      <p className="text-sm text-gray-600 mt-1">{f.fili}</p>

      <Link
  to={`/formation/${data.recordid}`}
  className="px-4 py-2 bg-blue-900 text-white text-sm hover:bg-blue-700 inline-block"
>
  Voir la formation
</Link>

      <label className="flex items-center gap-2 mt-3 text-sm text-gray-800">
        <input type="checkbox" />
        Ajouter au comparateur
      </label>

      <button
        className="mt-3 text-blue-900 text-sm underline"
        onClick={() => setSimilar(!similar)}
      >
        Formations similaires
      </button>

      {similar && (
        <p className="pl-4 mt-2 text-sm text-gray-600 italic">
          Aucune formation similaire disponible
        </p>
      )}
    </div>
  );
};
