import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Users,
  TrendingUp,
  School,
  Mail,
  ExternalLink,
  Info
} from "lucide-react";

export default function Formation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formation, setFormation] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const etudiantId = user?.id;

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) navigate("/");
      else setUser(data.user);
    }
    loadUser();
  }, []);

  useEffect(() => {
    loadFormation();
  }, [id]);

  const loadFormation = async () => {
    try {
      const response = await fetch(
        `https://data.enseignementsup-recherche.gouv.fr/api/records/1.0/search/?dataset=fr-esr-parcoursup&q=&rows=10000`
      );
      const data = await response.json();
      const found = data.records.find((r) => r.recordid === id);
      setFormation(found);
      setLoading(false);
    } catch (error) {
      console.error("Error loading formation:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleApplyToFormation = async (id) => {
    try {
      setProcessing(true);
      const { data: existingApp, error: checkError } = await supabase
        .from("candidatures")
        .select("id")
        .eq("etudiant_id", etudiantId)
        .eq("formation_id", id)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingApp) {
        alert("Vous avez déjà postulé à cette formation");
        setProcessing(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from("candidatures")
        .insert({
          etudiant_id: etudiantId,
          formation_id: id,
          statut: "en_attente"
        })
        .select()
        .single();

      if (insertError) throw insertError;

      alert("Candidature envoyée avec succès!");
    } catch (error) {
      console.error("Erreur lors de la candidature:", error);
      alert("Erreur: " + (error.message || "Impossible de postuler"));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Chargement de la formation...</p>
        </div>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">Formation non trouvée</p>
          <Link to="/dashboard" className="text-blue-600 underline hover:no-underline">
            Retour à la recherche
          </Link>
        </div>
      </div>
    );
  }

  const f = formation.fields;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-300 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Parcoursup</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-400 rounded text-sm hover:bg-gray-100"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-gray-300 py-3 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
          <Link to="/dashboard" className="text-blue-600 underline hover:no-underline">
            Rechercher une formation
          </Link>
          <span className="text-gray-600">&gt;</span>
          <span className="text-black font-semibold">{f.lib_for_voe_ins || "Formation"}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-sm text-blue-600 underline hover:no-underline mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la recherche
            </button>

            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-black mb-2">{f.lib_for_voe_ins || "Formation sans nom"}</h1>
                  <p className="text-xl text-black mb-3">{f.lib_comp_etab || "Établissement"}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Heart className="w-6 h-6 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleApplyToFormation(formation.recordid)}
                    disabled={applying || appliedSuccess}
                    className={`px-6 py-2 rounded font-semibold transition ${
                      appliedSuccess ? "bg-green-600 text-white" : "bg-[#5C2D91] text-white hover:bg-[#4A2373] disabled:bg-gray-400"
                    }`}
                  >
                    {applying ? "Ajout..." : appliedSuccess ? "Ajoutée" : "Ajouter"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <MapPin className="w-5 h-5" />
                <span>
                  {f.ville_etab || "Ville"} - {f.lib_dep || "Département"} ({f.cod_uai || "N/A"})
                </span>
              </div>
            </div>

            <div className="p-6 mb-8 bg-purple-50">
              <h2 className="text-xl font-bold text-gray mb-4">Établissement</h2>
              <div className="mb-4">
                <span className="inline-block px-4 py-2 bg-purple-200 text-purple-800 rounded text-sm font-semibold">
                  {f.contrat_etab || "ÉTABLISSEMENT PUBLIC"}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-00 mb-4 mt-6">Formation</h2>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="inline-block px-4 py-2 bg-purple-200 text-purple-800 rounded text-sm">
                    {f.select_form === "1" ? "FORMATION SÉLECTIVE" : "FORMATION OUVERTE"}
                  </span>
                  {f.capa_fin && (
                    <span className="inline-block px-4 py-2 bg-purple-200 text-purple-800 rounded text-sm">
                      {f.capa_fin} PLACES EN 2025
                    </span>
                  )}
                </div>

                {f.voe_tot && (
                  <span className="inline-block px-4 py-2 bg-purple-200 text-purple-800 rounded text-sm">
                    {f.voe_tot} VOEUX CONFIRMÉS EN 2025
                  </span>
                )}

                {f.fili && (
                  <div className="flex items-center gap-2 mt-4">
                    <School className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-semibold">{f.fili}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-300 rounded p-6 mb-8">
              <h2 className="text-2xl font-bold text-black mb-6">Comprendre les critères d'analyse des candidatures</h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="border-l-4 border-blue-600 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-black">Candidats</h3>
                  </div>
                  <p className="text-3xl font-bold text-black">{f.voe_tot || "N/A"}</p>
                  <p className="text-sm text-gray-600">Voeux confirmés</p>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <School className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-black">Places</h3>
                  </div>
                  <p className="text-3xl font-bold text-black">{f.capa_fin || "N/A"}</p>
                  <p className="text-sm text-gray-600">Capacité d'accueil</p>
                </div>

                {f.taux_acces_ens && (
                  <div className="border-l-4 border-blue-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-black">Taux d'accès</h3>
                    </div>
                    <p className="text-3xl font-bold text-black">{Math.round(f.taux_acces_ens)}%</p>
                    <p className="text-sm text-gray-600">Candidats admis</p>
                  </div>
                )}

                {f.prop_tot && (
                  <div className="border-l-4 border-blue-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-black">Propositions</h3>
                    </div>
                    <p className="text-3xl font-bold text-black">{f.prop_tot}</p>
                    <p className="text-sm text-gray-600">Propositions envoyées</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-300 rounded p-6 mb-8">
              <h2 className="text-2xl font-bold text-black mb-4">Présentation de la formation</h2>

              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">
                  Cette formation fait partie de la filière <strong>{f.fili || "Non spécifiée"}</strong>.
                </p>

                {f.form_lib_voe_acc && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-black mb-1">Formation détaillée</p>
                        <p className="text-sm text-gray-700">{f.form_lib_voe_acc}</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-gray-600 italic">
                  Pour plus d'informations détaillées sur le programme, les modalités d'admission et les débouchés, veuillez consulter le site officiel de l'établissement.
                </p>
              </div>
            </div>

            <div className="border border-gray-300 rounded p-6">
              <h2 className="text-2xl font-bold text-black mb-4">Contacter et échanger avec l'établissement</h2>

              <div className="space-y-4">
                {f.url && (
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 underline hover:no-underline">
                    <ExternalLink className="w-4 h-4" />
                    Site web de l'établissement
                  </a>
                )}

                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Adresse:</strong><br />
                    {f.ville_etab || "Non communiquée"}<br />
                    {f.lib_dep && `Département: ${f.lib_dep}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-80">
            <div className="sticky top-6 rounded p-6 bg-[#7B7BCC]">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Carte d'identité de la formation
              </h3>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-100 mb-1">Type d'établissement</p>
                  <p className="text-white">{f.contrat_etab || "Public"}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-100 mb-1">Filière</p>
                  <p className="text-white">{f.fili || "Non spécifiée"}</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-100 mb-1">Sélectivité</p>
                  <p className="text-white">{f.select_form === "1" ? "Formation sélective" : "Formation ouverte"}</p>
                </div>

                {f.capa_fin && (
                  <div>
                    <p className="font-semibold text-gray-100 mb-1">Capacité</p>
                    <p className="text-white">{f.capa_fin} places</p>
                  </div>
                )}

                {f.cod_aff_form && (
                  <div>
                    <p className="font-semibold text-gray-100 mb-1">Code formation</p>
                    <p className="text-white font-mono text-xs">{f.cod_aff_form}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
