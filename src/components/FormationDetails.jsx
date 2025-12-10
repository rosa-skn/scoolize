import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";
import { fetchParcoursupData } from "../services/parcoursupAPI";
import { ArrowLeft, Heart, MapPin, Users, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { calculerScore } from "../utils/algorithm.js";

export default function FormationDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dejaPostule, setDejaPostule] = useState(false);
  const [postulant, setPostulant] = useState(false);
  const [profil, setProfil] = useState(null);
  const [scoreEstime, setScoreEstime] = useState(null);

  useEffect(() => {
    loadUser();
    loadFormation();
  }, [id]);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUser(data.user);
      await verifierCandidature(data.user.id);
      await chargerProfil(data.user.id);
    }
  }

  async function chargerProfil(userId) {
    const { data } = await supabase
      .from('profils_etudiants')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfil(data);
      // Calculer le score estimé si on a les données
      if (data.notes && formation) {
        estimerScore(data);
      }
    }
  }

  async function loadFormation() {
    setLoading(true);
    const allData = await fetchParcoursupData();
    const found = allData.find(item => item.recordid === id);
    
    if (found) {
      // Enrichir les données de la formation
      const formationEnrichie = {
        ...found,
        // Définir les critères de sélection basés sur le type
        matieres_importantes: determinerMatieres(found.fields),
        coefficients: determinerCoefficients(found.fields),
        note_minimale: determinerNoteMinimale(found.fields),
        type_selectivite: determinerSelectivite(found.fields)
      };
      
      setFormation(formationEnrichie);
      
      // Recalculer le score si on a déjà le profil
      if (profil) {
        estimerScore(profil, formationEnrichie);
      }
    }
    
    setLoading(false);
  }

  // 🎯 Déterminer les matières importantes selon le type de formation
  function determinerMatieres(fields) {
    const fili = fields.fili?.toLowerCase() || "";
    const libelle = fields.lib_for_voe_ins?.toLowerCase() || "";
    
    if (fili.includes("math") || libelle.includes("math") || fili.includes("mpsi") || fili.includes("pcsi")) {
      return ["mathematiques", "physique", "francais"];
    }
    if (fili.includes("info") || libelle.includes("info") || libelle.includes("nsi")) {
      return ["mathematiques", "nsi", "anglais"];
    }
    if (fili.includes("eco") || fili.includes("commerce") || fili.includes("gestion")) {
      return ["ses", "mathematiques", "anglais"];
    }
    if (fili.includes("droit") || fili.includes("science po")) {
      return ["histoire", "francais", "philosophie"];
    }
    if (fili.includes("medecine") || fili.includes("sante") || fili.includes("staps")) {
      return ["svt", "physique", "francais"];
    }
    if (fili.includes("lettres") || fili.includes("langues")) {
      return ["francais", "philosophie", "anglais"];
    }
    
    // Par défaut
    return ["francais", "mathematiques", "anglais"];
  }

  // 🎯 Déterminer les coefficients selon les matières
  function determinerCoefficients(fields) {
    const matieres = determinerMatieres(fields);
    const coefs = {};
    
    // Coefficient principal pour la 1ère matière
    coefs[matieres[0]] = 5;
    // Coefficients secondaires
    if (matieres[1]) coefs[matieres[1]] = 4;
    if (matieres[2]) coefs[matieres[2]] = 2;
    
    return coefs;
  }

  // 🎯 Déterminer la note minimale
  function determinerNoteMinimale(fields) {
    const selectivite = determinerSelectivite(fields);
    
    if (selectivite === 'elite') return 15.0;
    if (selectivite === 'selective') return 12.0;
    return 10.0;
  }

  // 🎯 Déterminer le type de sélectivité
  function determinerSelectivite(fields) {
    const tauxAcces = parseFloat(fields.taux_acces_ens) || 100;
    const selectForm = fields.select_form?.toLowerCase() || "";
    const fili = fields.fili?.toLowerCase() || "";
    
    // Formations d'élite (CPGE, grandes écoles, etc.)
    if (fili.includes("cpge") || fili.includes("prépa") || fili.includes("grande école")) {
      return 'elite';
    }
    
    // Très sélective si taux d'accès < 30%
    if (tauxAcces < 30) {
      return 'elite';
    }
    
    // Sélective si < 60%
    if (tauxAcces < 60 || selectForm.includes("oui")) {
      return 'selective';
    }
    
    return 'normale';
  }

  // 📊 Estimer le score de l'étudiant
  function estimerScore(profilData, formationData = formation) {
    if (!profilData?.notes || !formationData) return;
    
    const resultat = calculerScore(
      profilData.notes,
      formationData,
      1, // On suppose que c'est le 1er vœu
      profilData.est_boursier || false
    );
    
    setScoreEstime(resultat);
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

    if (!profil?.notes) {
      alert("⚠️ Veuillez d'abord compléter votre profil (notes scolaires)");
      nav("/profil");
      return;
    }

    setPostulant(true);

    try {
      // 🎯 Calculer le score avec l'algorithme
      const resultat = calculerScore(
        profil.notes,
        formation,
        1, // À améliorer: récupérer le vrai rang du vœu
        profil.est_boursier || false
      );

      if (!resultat.admissible) {
        alert(`❌ ${resultat.raison}\n\nNote minimale requise: ${formation.note_minimale}/20\nVotre moyenne pondérée: ${resultat.moyennePonderee}/20`);
        setPostulant(false);
        return;
      }

      // Insérer la candidature avec le score calculé
      const { error } = await supabase
        .from('candidatures')
        .insert({
          etudiant_id: user.id,
          formation_id: id,
          statut: 'en_attente',
          score: resultat.score,
          moyenne_ponderee: parseFloat(resultat.moyennePonderee),
          date_candidature: new Date().toISOString()
        });

      if (error) throw error;

      alert(`✅ Candidature envoyée avec succès!\n\n📊 Votre score: ${resultat.score}/1000\n📈 Moyenne pondérée: ${resultat.moyennePonderee}/20`);
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
            {/* Badges */}
            <div className="flex gap-2 mb-4">
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: "#C6FFF4",
                  color: "#2C615B",
                }}
              >
                {f.contrat_etab || "PUBLIC"}
              </span>
              
              {/* Badge sélectivité */}
              <span
                className={`inline-block text-xs font-bold px-3 py-1 rounded-lg ${
                  formation.type_selectivite === 'elite' ? 'bg-red-100 text-red-800' :
                  formation.type_selectivite === 'selective' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}
              >
                {formation.type_selectivite === 'elite' ? '🏆 ÉLITE' :
                 formation.type_selectivite === 'selective' ? '📊 SÉLECTIVE' :
                 '✅ NON-SÉLECTIVE'}
              </span>
            </div>

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

            {/* Score estimé */}
            {scoreEstime && scoreEstime.admissible && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Votre score estimé
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Score total</p>
                    <p className="text-3xl font-bold text-blue-900">{scoreEstime.score}/1000</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Moyenne pondérée</p>
                    <p className="text-3xl font-bold text-blue-900">{scoreEstime.moyennePonderee}/20</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>• Bonus rang vœu: +{scoreEstime.bonusRang} points</p>
                  {scoreEstime.bonusBoursier > 0 && (
                    <p>• Bonus boursier: +{scoreEstime.bonusBoursier} points</p>
                  )}
                </div>
              </div>
            )}

            {scoreEstime && !scoreEstime.admissible && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Critères non remplis
                </h3>
                <p className="text-red-700">{scoreEstime.raison}</p>
                <p className="text-sm text-red-600 mt-2">
                  Note minimale requise: {formation.note_minimale}/20
                </p>
              </div>
            )}

            {/* Filière */}
            <div className="bg-purple-50 p-6 rounded-lg mb-6">
              <h2 className="text-lg font-bold mb-2">Filière</h2>
              <p className="text-gray-700">{f.fili}</p>
            </div>

            {/* Matières importantes */}
            {formation.matieres_importantes && (
              <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                <h2 className="text-lg font-bold mb-3">📚 Matières évaluées</h2>
                <div className="flex flex-wrap gap-2">
                  {formation.matieres_importantes.map(matiere => (
                    <span
                      key={matiere}
                      className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded-lg text-sm font-medium"
                    >
                      {matiere.charAt(0).toUpperCase() + matiere.slice(1)} 
                      {formation.coefficients[matiere] && ` (coef. ${formation.coefficients[matiere]})`}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                  <span className="font-bold">Taux d'accès</span>
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

              {/* Alerte profil incomplet */}
              {!profil?.notes && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-orange-800 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold">Profil incomplet</span>
                  </div>
                  <p className="text-sm text-orange-700 mb-3">
                    Complétez vos notes pour voir votre score estimé
                  </p>
                  <Link
                    to="/profil"
                    className="text-sm text-orange-900 underline hover:no-underline"
                  >
                    → Compléter mon profil
                  </Link>
                </div>
              )}

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
                  disabled={postulant || (scoreEstime && !scoreEstime.admissible)}
                  className="w-full py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4 transition"
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

                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Note minimale:</span>
                  <span className="ml-2 text-sm font-bold">{formation.note_minimale}/20</span>
                </div>

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
