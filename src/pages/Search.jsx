import { useEffect, useState } from "react";
import { fetchParcoursupData } from "../services/parcoursupAPI";
import { Search, MapPin, HelpCircle, Heart, Plus, Minus } from "lucide-react";

export default function ParcoursupSearch() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchFormation, setSearchFormation] = useState("");
  const [searchZone, setSearchZone] = useState("");

  const [selectedType, setSelectedType] = useState("");
  const [sortBy, setSortBy] = useState("pertinence");

  const [typeOpen, setTypeOpen] = useState(true);
  const [apprentissageOpen, setApprentissageOpen] = useState(false);

  const [types, setTypes] = useState([]);
  const [typeCounts, setTypeCounts] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const records = await fetchParcoursupData();
    setAllData(records);
    setFilteredData(records);

    const typeMap = {};
    records.forEach((r) => {
      const type = r.fields.type_etablissement || r.fields.contrat_etab || "Autre";
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    setTypeCounts(typeMap);
    setTypes(Object.keys(typeMap).sort());

    setLoading(false);
  };

  useEffect(() => {
    filterData();
  }, [searchFormation, searchZone, selectedType, allData]);

  const filterData = () => {
    let filtered = [...allData];

    if (searchFormation) {
      const term = searchFormation.toLowerCase();
      filtered = filtered.filter((record) => {
        const fields = record.fields;
        return (
          fields.libelle_formation?.toLowerCase().includes(term) ||
          fields.etablissement?.toLowerCase().includes(term) ||
          fields.filiere?.toLowerCase().includes(term) ||
          fields.libelle_filiere?.toLowerCase().includes(term)
        );
      });
    }

    if (searchZone) {
      const zone = searchZone.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.fields.ville?.toLowerCase().includes(zone) ||
          r.fields.region?.toLowerCase().includes(zone) ||
          r.fields.commune?.toLowerCase().includes(zone)
      );
    }

    if (selectedType) {
      filtered = filtered.filter(
        (r) =>
          r.fields.type_etablissement === selectedType ||
          r.fields.contrat_etab === selectedType
      );
    }

    if (sortBy === "alphabetique") {
      filtered.sort((a, b) =>
        (a.fields.etablissement || "").localeCompare(b.fields.etablissement || "")
      );
    } else if (sortBy === "ville") {
      filtered.sort((a, b) =>
        (a.fields.ville || "").localeCompare(b.fields.ville || "")
      );
    }

    setFilteredData(filtered);
  };

  const handleTypeChange = (type) => {
    setSelectedType(selectedType === type ? "" : type);
  };

  const resetFilters = () => {
    setSearchFormation("");
    setSearchZone("");
    setSelectedType("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Rechercher une formation
          </h1>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                Rechercher une formation, une filière...
                <HelpCircle className="w-4 h-4 ml-1 text-gray-400" />
              </label>
              <input
                type="text"
                placeholder="Ex: BTS droit"
                value={searchFormation}
                onChange={(e) => setSearchFormation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              />
            </div>

            <div className="flex-1">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                Zone géographique
                <HelpCircle className="w-4 h-4 ml-1 text-gray-400" />
              </label>
              <input
                type="text"
                placeholder="Ex: Lyon"
                value={searchZone}
                onChange={(e) => setSearchZone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              />
            </div>

            <div className="flex items-end">
              <button 
                onClick={filterData}
                className="w-full md:w-auto px-8 py-3 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Search className="w-5 h-5" />
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm sticky top-4">
              <h2 className="text-lg font-bold mb-4">Filtres</h2>

              <div className="border-b pb-4 mb-4">
                <button
                  onClick={() => setTypeOpen(!typeOpen)}
                  className="flex items-center justify-between w-full text-left font-medium mb-3 hover:text-blue-900 transition"
                >
                  <span>Types d'établissement</span>
                  {typeOpen ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>

                {typeOpen && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {types.map((type) => (
                      <label
                        key={type}
                        className="flex items-center cursor-pointer group hover:bg-gray-50 p-1 rounded transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedType === type}
                          onChange={() => handleTypeChange(type)}
                          className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                          {type}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {typeCounts[type]}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="pb-4">
                <button
                  onClick={() => setApprentissageOpen(!apprentissageOpen)}
                  className="flex items-center justify-between w-full text-left font-medium mb-3 hover:text-blue-900 transition"
                >
                  <span>Apprentissage</span>
                  {apprentissageOpen ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>

                {apprentissageOpen && (
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded transition">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-900 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Formations en apprentissage
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded transition">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-900 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Formations hors apprentissage
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <button
                onClick={resetFilters}
                className="w-full mt-4 px-4 py-2 text-sm text-blue-900 border border-blue-900 rounded-md hover:bg-blue-50 transition"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </aside>

          <main className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">
                    {filteredData.length}
                  </span>{" "}
                  formation{filteredData.length > 1 ? "s" : ""} trouvée
                  {filteredData.length > 1 ? "s" : ""}
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Trier par</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="pertinence">Pertinence</option>
                    <option value="alphabetique">Alphabétique</option>
                    <option value="ville">Ville</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des formations...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
                <p className="text-lg text-gray-600 mb-4">
                  Aucune formation trouvée
                </p>
                <button
                  onClick={resetFilters}
                  className="text-blue-900 hover:underline font-medium"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredData.map((record) => (
                  <FormationCard key={record.recordid} record={record} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const FormationCard = ({ record }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);
  const fields = record.fields;

  const getTypeBadgeColor = (type) => {
    if (type?.toLowerCase().includes("public")) return "bg-green-100 text-green-800";
    if (type?.toLowerCase().includes("privé")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <span
              className={`inline-block px-3 py-1 text-xs font-medium rounded mb-2 ${getTypeBadgeColor(
                fields.type_etablissement || fields.contrat_etab
              )}`}
            >
              {fields.type_etablissement || fields.contrat_etab || "PUBLIC"}
            </span>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {fields.etablissement || fields.g_ea_lib_vx || "Établissement"}
            </h3>
            <p className="text-base text-gray-700 font-medium">
              {fields.libelle_formation ||
                fields.filiere ||
                fields.lib_for_voe_ins ||
                "Formation"}
            </p>
          </div>

          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <Heart
              className={`w-5 h-5 transition ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-gray-400 hover:text-red-400"
              }`}
            />
          </button>
        </div>

        <div className="mb-4 space-y-1">
          <p className="text-sm font-medium text-gray-900">
            {fields.libelle_filiere || fields.filiere || "Licence - Économie et gestion"}
          </p>
          <p className="text-sm text-gray-600 flex items-center">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            {fields.ville || fields.commune || "Ville"} 
            {fields.code_postal && ` (${fields.code_postal})`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button className="px-6 py-2 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800 transition shadow-md hover:shadow-lg">
            Voir la formation
          </button>

          <label className="flex items-center text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition">
            <input
              type="checkbox"
              className="w-4 h-4 mr-2 rounded border-gray-300 text-blue-900 focus:ring-blue-500"
            />
            Ajouter au comparateur
          </label>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <button
          onClick={() => setShowSimilar(!showSimilar)}
          className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition text-left"
        >
          <span className="text-sm font-medium text-gray-700">
            Formations similaires
          </span>
          <Plus
            className={`w-4 h-4 transition-transform ${
              showSimilar ? "rotate-45" : ""
            }`}
          />
        </button>

        {showSimilar && (
          <div className="px-6 pb-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 italic py-2">
              Aucune formation similaire disponible
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
