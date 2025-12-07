import { useState } from "react";
import { supabase } from "../supabase";
import { 
  executerTourDePropositions,
  formatResultsForDatabase 
} from "../utils/parcoursupAlgorithm";
import { Play, RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const runParcoursupAlgorithm = async () => {
    setProcessing(true);
    setResults(null);

    try {
      // 1. Get all pending applications with student data
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select(`
          *,
          student_profiles!inner(grades, first_name, last_name)
        `)
        .eq("status", "pending");

      if (appsError) throw appsError;

      if (!apps || apps.length === 0) {
        setResults({
          success: false,
          message: "Aucune candidature en attente à traiter"
        });
        setProcessing(false);
        return;
      }

      // 2. Get formation requirements
      const { data: formations, error: formError } = await supabase
        .from("formation_requirements")
        .select("*");

      if (formError) throw formError;

      // Convert to map
      const formationsMap = (formations || []).reduce((acc, f) => {
        acc[f.formation_id] = f;
        return acc;
      }, {});

      // 3. Prepare applications data
      const applicationsWithGrades = apps.map(app => ({
        ...app,
        student_grades: app.student_profiles.grades,
        student_name: `${app.student_profiles.first_name} ${app.student_profiles.last_name}`
      }));

      console.log("📊 Traitement de", applicationsWithGrades.length, "candidatures");

      // 4. Run Parcoursup algorithm
      const algorithmResults = executerTourDePropositions(
        applicationsWithGrades,
        formationsMap,
        5 // max 5 iterations
      );

      // 5. Update database
      const updates = formatResultsForDatabase(algorithmResults);
      
      for (const update of updates) {
        await supabase
          .from("applications")
          .update({
            status: update.status,
            score: update.score,
            rank: update.rank
          })
          .eq("id", update.id);
      }

      setResults({
        success: true,
        propositions: algorithmResults.propositions.length,
        enAttente: algorithmResults.enAttente.length,
        demissions: algorithmResults.demissionsAutomatiques.length
      });

    } catch (error) {
      console.error("Erreur:", error);
      setResults({
        success: false,
        message: error.message
      });
    }

    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b py-4 px-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#5C2D91]">
            🎓 Administration - Algorithme Parcoursup
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Main Action */}
        <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-2">
            Traitement des candidatures
          </h2>
          <p className="text-gray-600 mb-6">
            Exécution de l'algorithme de Parcoursup pour attribuer les places disponibles
          </p>

          <button
            onClick={runParcoursupAlgorithm}
            disabled={processing}
            className="px-6 py-3 bg-[#000091] text-white rounded-lg hover:bg-[#000070] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {processing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Lancer l'algorithme
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className={`border rounded-lg shadow-sm p-6 mb-6 ${
            results.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            {results.success ? (
              <>
                <h3 className="font-bold text-lg mb-4 text-green-800">
                  ✅ Traitement terminé avec succès
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-green-900">
                    <span className="text-2xl">📨</span>
                    <div>
                      <p className="font-bold">{results.propositions}</p>
                      <p className="text-sm">Propositions envoyées</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-green-900">
                    <span className="text-2xl">⏳</span>
                    <div>
                      <p className="font-bold">{results.enAttente}</p>
                      <p className="text-sm">Candidatures en attente</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-green-900">
                    <span className="text-2xl">❌</span>
                    <div>
                      <p className="font-bold">{results.demissions}</p>
                      <p className="text-sm">Démissions automatiques</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-2 text-red-800">
                  ❌ Erreur lors du traitement
                </h3>
                <p className="text-sm text-red-700">{results.message}</p>
              </>
            )}
          </div>
        )}

        {/* Algorithm Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold mb-3 text-blue-900">
            📊 Comment fonctionne l'algorithme Parcoursup
          </h3>
          <ol className="text-sm space-y-3 text-blue-800">
            <li className="flex gap-3">
              <span className="font-bold">1.</span>
              <div>
                <strong>Ordre d'appel</strong> : Les étudiants sont classés selon leurs notes dans les matières requises
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">2.</span>
              <div>
                <strong>Propositions</strong> : Attribution des places dans la limite de la capacité d'accueil
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">3.</span>
              <div>
                <strong>Démissions automatiques</strong> : Si un étudiant reçoit une proposition pour un vœu mieux classé
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">4.</span>
              <div>
                <strong>Itérations</strong> : Le processus se répète jusqu'à stabilisation (max 5 tours)
              </div>
            </li>
          </ol>
          <div className="mt-4 pt-4 border-t border-blue-300">
            <p className="text-xs text-blue-700">
              ℹ️ Basé sur l'algorithme officiel du Ministère de l'Enseignement Supérieur et de la Recherche
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
