import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { extraireNotesDepuisPDF } from "../utils/extractNotes";
import { Link } from "react-router-dom";
import { fetchParcoursupData } from "../services/parcoursupAPI";
import { FileText, MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import Tesseract from 'tesseract.js';

export default function Profil() {
  const [chargement, setChargement] = useState(true);
  const [telechargement, setTelechargement] = useState(false);
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [user, setUser] = useState(null);

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [ine, setIne] = useState("");
  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [notes, setNotes] = useState({
    mathematiques: "",
    physique: "",
    chimie: "",
    svt: "",
    francais: "",
    anglais: "",
    histoire: "",
    geographie: "",
    philosophie: "",
    sport: "",
    ses: "",
    si: ""
  });

  const [bulletin, setBulletin] = useState(null);
  const [urlBulletin, setUrlBulletin] = useState("");
  const [candidatures, setCandidatures] = useState([]);
  const [motivationLetter, setMotivationLetter] = useState(null);
  const [urlMotivationLetter, setUrlMotivationLetter] = useState("");

  useEffect(() => {
    chargerProfil();
  }, []);

  async function chargerProfil() {
    try {
      setChargement(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Vous devez être connecté");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("profils_etudiants")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Erreur:", error);
        return;
      }

      if (data) {
        setPrenom(data.prenom || "");
        setNom(data.nom || "");
        setDateNaissance(data.date_naissance || "");
        setIne(data.ine || "");
        setAdresse(data.adresse || "");
        setVille(data.ville || "");
        setCodePostal(data.code_postal || "");
        setNotes(data.notes || {});
        setUrlBulletin(data.url_bulletin || "");
        setUrlMotivationLetter(data.url_motivation_letter || "");
      }

      await chargerCandidatures(user.id);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setChargement(false);
    }
  }

  async function chargerCandidatures(userId) {
    try {
      const { data: candidaturesData, error } = await supabase
        .from("candidatures")
        .select("*")
        .eq("etudiant_id", userId)
        .order("date_candidature", { ascending: false });

      if (error) throw error;
      if (!candidaturesData || candidaturesData.length === 0) {
        setCandidatures([]);
        return;
      }

      const formationsAPI = await fetchParcoursupData();

      const candidaturesEnrichies = candidaturesData.map((cand) => {
        const formationDetail = formationsAPI.find((f) => f.recordid === cand.formation_id);
        return {
          ...cand,
          formation: formationDetail?.fields || {}
        };
      });

      setCandidatures(candidaturesEnrichies);
    } catch (error) {
      console.error("Erreur chargement candidatures:", error);
      setCandidatures([]);
    }
  }

  async function televerserBulletin() {
    if (!bulletin || !user) return;

    try {
      setTelechargement(true);
      setAnalyseEnCours(true);

      let notesExtraites = {};
      let infoPersonnelle = {};

      try {
        alert('Analyse du bulletin en cours... Cela peut prendre 10-30 secondes.');
        const result = await extraireNotesDepuisPDF(bulletin);
        notesExtraites = result.grades;
        infoPersonnelle = result.personalInfo;
        
        console.log('Extracted info:', infoPersonnelle);
        
        const hasGrades = Object.values(notesExtraites).some(grade => grade !== "");
        
        if (!hasGrades) {
          alert('Aucune note détectée. Veuillez les entrer manuellement.');
        } else {
          alert('Notes extraites avec succès! Vérifiez et corrigez si nécessaire.');
        }

        if (infoPersonnelle.prenom) {
          setPrenom(infoPersonnelle.prenom);
        }
        if (infoPersonnelle.nom) {
          setNom(infoPersonnelle.nom);
        }
        if (infoPersonnelle.dateNaissance) {
          setDateNaissance(infoPersonnelle.dateNaissance);
        }
        if (infoPersonnelle.ine) {
          setIne(infoPersonnelle.ine);
        }

      } catch (pdfError) {
        console.error('Erreur OCR:', pdfError);
        alert('Erreur lors de l\'analyse. Veuillez entrer vos notes manuellement.');
        notesExtraites = getEmptyGrades();
      }

      setNotes(notesExtraites);

      const nomFichier = `${user.id}/${Date.now()}_${bulletin.name}`;

      const { data, error } = await supabase.storage
        .from("bulletins-scolaires")
        .upload(nomFichier, bulletin, {
          cacheControl: "3600",
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("bulletins-scolaires")
        .getPublicUrl(nomFichier);

      setUrlBulletin(publicUrl);

      await sauvegarderProfilAvecNotes(notesExtraites, publicUrl);

      alert("Bulletin téléversé avec succès! Vous pouvez maintenant remplir vos notes manuellement.");
      setBulletin(null);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      alert("Erreur: " + (error.message || "Impossible de téléverser le bulletin"));
    } finally {
      setTelechargement(false);
      setAnalyseEnCours(false);
    }
  }

  function getEmptyGrades() {
    return {
      mathematiques: "",
      physique: "",
      chimie: "",
      svt: "",
      francais: "",
      anglais: "",
      histoire: "",
      geographie: "",
      philosophie: "",
      sport: "",
      ses: "",
      si: ""
    };
  }

  async function sauvegarderProfilAvecNotes(notesExtraites, url) {
    const notesFormatted = {};
    Object.entries(notesExtraites).forEach(([key, value]) => {
      notesFormatted[key] = value === "" ? null : parseFloat(value) || null;
    });

    console.log('Saving profile with notes:', notesFormatted);

    const { error } = await supabase
      .from("profils_etudiants")
      .upsert({
        id: user.id,
        prenom,
        nom,
        date_naissance: dateNaissance && dateNaissance.trim() ? dateNaissance : null,
        ine,
        adresse,
        ville,
        code_postal: codePostal,
        notes: notesFormatted,
        url_bulletin: url
      });

    if (error) {
      console.error('Upsert error:', error);
      throw error;
    }
  }

  async function sauvegarderProfil() {
    if (!user) return;

    try {
      setChargement(true);

      const notesFormatted = {};
      Object.entries(notes).forEach(([key, value]) => {
        notesFormatted[key] = value === "" ? null : parseFloat(value) || null;
      });

      console.log('Saving profile with notes:', notesFormatted);

      const { error } = await supabase
        .from("profils_etudiants")
        .upsert({
          id: user.id,
          prenom: prenom || "",
          nom: nom || "",
          date_naissance: dateNaissance && dateNaissance.trim() ? dateNaissance : null,
          ine: ine || "",
          adresse: adresse || "",
          ville: ville || "",
          code_postal: codePostal || "",
          notes: notesFormatted,
          url_bulletin: urlBulletin || "",
          url_motivation_letter: urlMotivationLetter || ""
        });

      if (error) {
        console.error("Erreur détaillée:", error);
        throw error;
      }

      alert("Profil sauvegardé avec succès!");
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur: " + (error.message || "Impossible de sauvegarder le profil"));
    } finally {
      setChargement(false);
    }
  }

  function getStatutBadge(statut) {
    switch (statut) {
      case "accepte":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Accepté
          </span>
        );
      case "refuse":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
            <XCircle className="w-4 h-4" /> Refusé
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
            <Clock className="w-4 h-4" /> En attente
          </span>
        );
    }
  }

  async function televerserMotivationLetter() {
    if (!motivationLetter || !user) return;

    try {
      setTelechargement(true);

      const nomFichier = `${user.id}/motivation_${Date.now()}_${motivationLetter.name}`;

      const { error } = await supabase.storage
        .from("motivation-letters")
        .upload(nomFichier, motivationLetter, {
          cacheControl: "3600",
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("motivation-letters")
        .getPublicUrl(nomFichier);

      setUrlMotivationLetter(publicUrl);

      const { error: updateError } = await supabase
        .from("profils_etudiants")
        .update({
          url_motivation_letter: publicUrl
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      alert("Lettre de motivation téléversée avec succès!");
      setMotivationLetter(null);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      alert("Erreur: " + (error.message || "Impossible de téléverser la lettre"));
    } finally {
      setTelechargement(false);
    }
  }

  if (chargement) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Mes Candidatures ({candidatures.length})
          </h2>

          {candidatures.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-2">Aucune candidature pour le moment</p>
              <Link to="/dashboard" className="text-blue-600 hover:underline font-medium">
                Découvrir les formations
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {candidatures.map((cand) => (
                <div key={cand.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <Link to={`/formation/${cand.formation_id}`} className="text-lg font-bold text-blue-900 hover:underline">
                        {cand.formation.lib_for_voe_ins || "Formation"}
                      </Link>
                      <p className="text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {cand.formation.g_ea_lib_vx || "Non spécifié"} - {cand.formation.ville_etab || ""}
                      </p>
                    </div>
                    {getStatutBadge(cand.statut)}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-gray-500">Score:</span>
                      <span className="ml-2 font-bold">{cand.score ? `${cand.score.toFixed(2)}/20` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Moyenne:</span>
                      <span className="ml-2 font-bold">{cand.moyenne_ponderee ? `${cand.moyenne_ponderee.toFixed(2)}/20` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2">{new Date(cand.date_candidature).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Informations personnelles</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom</label>
                  <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Dupont" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date de naissance</label>
                <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">INE</label>
                <input type="text" value={ine} onChange={(e) => setIne(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="000000000AA" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="123 Rue de la République" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ville</label>
                  <input type="text" value={ville} onChange={(e) => setVille(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Paris" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Code postal</label>
                  <input type="text" value={codePostal} onChange={(e) => setCodePostal(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="75001" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Bulletin scolaire (PDF)</h2>

            {analyseEnCours && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700 font-medium">Analyse du bulletin en cours...</p>
                <p className="text-xs text-blue-600 mt-1">Les notes seront extraites automatiquement</p>
              </div>
            )}

            {urlBulletin && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-700">Bulletin téléversé et analysé</p>
                <a href={urlBulletin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">Voir le bulletin</a>
              </div>
            )}

            <div className="flex items-center gap-4">
              <input type="file" accept="application/pdf" onChange={(e) => setBulletin(e.target.files[0])} className="border p-2 rounded flex-1" />
              <button onClick={televerserBulletin} disabled={telechargement || !bulletin} className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400">
                {telechargement ? "Envoi..." : "Analyser"}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Le PDF sera analysé automatiquement pour extraire vos notes</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Lettre de motivation</h2>

            {urlMotivationLetter && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-700">Lettre de motivation téléversée</p>
                <a href={urlMotivationLetter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">Voir ou télécharger le document</a>
              </div>
            )}

            <div className="flex items-center gap-4">
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setMotivationLetter(e.target.files[0])} className="border p-2 rounded flex-1" />
              <button onClick={televerserMotivationLetter} disabled={telechargement || !motivationLetter} className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400">
                {telechargement ? "Envoi..." : "Téléverser"}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Formats acceptés: PDF, DOC, DOCX</p>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Notes (sur 20)</h2>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(notes).map(([matiere, note]) => (
                <div key={matiere}>
                  <label className="block text-xs font-medium mb-1 capitalize">{matiere.replace("_", " ")}</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="20" 
                    step="0.1" 
                    value={note || ""}
                    onChange={(e) => setNotes({ ...notes, [matiere]: e.target.value })} 
                    className="w-full border rounded px-2 py-1 text-sm" 
                    placeholder="0-20" 
                  />
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-3">Ces notes peuvent être modifiées manuellement si l'analyse automatique n'est pas précise</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={sauvegarderProfil} disabled={chargement} className="w-full py-3 bg-[#5C2D91] text-white rounded-lg font-bold hover:bg-[#4A2373] disabled:bg-gray-400">
          {chargement ? "Sauvegarde..." : "Enregistrer le profil"}
        </button>
      </div>
    </div>
  );
}
