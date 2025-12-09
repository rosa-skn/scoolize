import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";
import { fetchParcoursupData } from "../services/parcoursupAPI";
import { ArrowLeft, Heart, MapPin, Users, TrendingUp, CheckCircle } from "lucide-react";

export default function FormationDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dejaPostule, setDejaPostule] = useState(false);
  const [postulant, setPostulant] = useState(false);

  useEffect(() => {
    loadUser();
    loadFormation();
  }, [id]);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUser(data.user);
      verifierCandidature(data.user.id);
    }
  }

  async function loadFormation() {
    setLoading(true);
    const allData = await fetchParcoursupData();
    const found = allData.find(item => item.recordid === id);
    setFormation(found);
    setLoading(false);
  }

  async function verifierCandidature(userId) {
    const { data } = await supabase
      .from('candidatures')
      .select('id')
      .eq('etudiant_id', userId)
      .eq('formation_id', id)
      .single();
    
    setDejaPostule(!!data);
  }

  async function postuler() {
    if (!user) {
      alert("Vous devez être connecté pour postuler");
      return;
    }

    setPostulant(true);

    try {
      // Récupérer le profil de l'étudiant
      const { data: profil } = await supabase
        .from('profils_etudiants')
        .select('*')
        .eq('etudiant_id', user.id)
        .single();

      // Calculer un score basique (vous pouvez améliorer cela)
      let score = null;
      if (profil?.notes) {
        const moyenne = Object.values(profil.notes).reduce((a, b) => a + b, 0) / Object.keys(profil.notes).length;
        score = moyenne;
      }

      // Insérer la candidature
      const { error } = await supabase
        .from('candidatures')
        .insert({
          etudiant_id: user.id,
          formation_id: id,
          statut: 'en_attente',
          score: score
        });

      if (error) throw error;

      alert("✅ Candidature envoyée avec succès!");
      setDejaPostule(true);
    } catch (error) {
      console.error("Erreur lors de la candidature:", error);
      alert("❌ Erreur lors de l'envoi de la candidature");
    } finally {
      setPostulant(false);
    }
  }

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
          <p className="text-xl font-bold text-gray-800 mb-4">Formation introuvable</p>
          <Link to="/dashboard" className="text-blue-900 underline">
            Retour au Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const f = formation.fields;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-300 py-4 px-6">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Parcoursup</h1>
          <div className="flex items-center gap-4">
            <Link to="/profil" className="text-sm text-blue-900 underline">
              Mon Profil
            </Link>
            <span className="text-sm text-gray-700">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Bouton retour */}
        <Link 
          to="/dashboard"
          className="inline-flex items-center gap-2 text-blue-900 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux résultats
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            {/* Badge type */}
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-lg mb-4"
              style={{
                backgroundColor: "#C6FFF4",
                color: "#2C615B",
              }}
            >
              {f.contrat_etab || "PUBLIC"}
            </span>

            {/* Titre */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {f.lib_for_voe_ins}
            </h1>

            {/* Établissement */}
            <p className="text-xl text-gray-700 mb-4">
              {f.g_ea_lib_vx}
            </p>

            {/* Localisation */}
            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <MapPin className="w-5 h-5" />
              <span>{f.ville_etab} — {f.lib_dep}</span>
            </div>

            {/* Filière */}
            <div className="bg-purple-50 p-6 rounded-lg mb-6">
              <h2 className="text-lg font-bold mb-2">Filière</h2>
              <p className="text-gray-700">{f.fili}</p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-300 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-900" />
                  <span className="font-bold">Capacité</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {f.cap_fin || "N/A"}
                </p>
              </div>

              <div className="border border-gray-300 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-900" />
                  <span className="font-bold">Sélectivité</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {f.taux_acces_ens ? `${f.taux_acces_ens}%` : "N/A"}
                </p>
              </div>
            </div>

            {/* Détails supplémentaires */}
            {f.detail_formation && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-bold mb-3">Détails de la formation</h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {f.detail_formation}
                </p>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="lg:col-span-1">
            <div className="border border-gray-300 rounded-lg p-6 sticky top-6">
              <h3 className="text-xl font-bold mb-4">Actions</h3>

              {/* Bouton Postuler */}
              {dejaPostule ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">Candidature envoyée</span>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Vous avez déjà postulé à cette formation
                  </p>
                </div>
              ) : (
                <button
                  onClick={postuler}
                  disabled={postulant}
                  className="w-full py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-gray-400 mb-4"
                >
                  {postulant ? "⏳ Envoi..." : "📝 Postuler à cette formation"}
                </button>
              )}

              {/* Bouton Favoris */}
              <button className="w-full py-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 mb-4">
                <Heart className="w-5 h-5" />
                Ajouter aux favoris
              </button>

              {/* Informations pratiques */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-bold mb-3">Informations pratiques</h4>
                
                {f.apprentissage && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Apprentissage:</span>
                    <span className="ml-2 text-sm">{f.apprentissage}</span>
                  </div>
                )}

                {f.select_form && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Formation sélective:</span>
                    <span className="ml-2 text-sm">{f.select_form}</span>
                  </div>
                )}

                {f.cod_aff_form && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Code formation:</span>
                    <span className="ml-2 text-sm font-mono">{f.cod_aff_form}</span>
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
