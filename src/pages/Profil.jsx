import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { extraireNotesDepuisPDF } from '../utils/extractNotes';
import { Link } from "react-router-dom";


export default function Profil() {
  const [chargement, setChargement] = useState(true);
  const [telechargement, setTelechargement] = useState(false);
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [user, setUser] = useState(null);
  
  // Données du profil
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [notes, setNotes] = useState({
    mathematiques: '',
    physique: '',
    chimie: '',
    svt: '',
    francais: '',
    anglais: '',
    histoire: '',
    geographie: '',
    philosophie: '',
    sport: '',
    ses: '',
    si: ''
  });
  
  // Bulletin PDF
  const [bulletin, setBulletin] = useState(null);
  const [urlBulletin, setUrlBulletin] = useState('');
  
  // Applications
  const [applications, setApplications] = useState([]);

  // Charger l'utilisateur et son profil
  useEffect(() => {
    chargerProfil();
    chargerApplications();
  }, []);

  async function chargerProfil() {
    try {
      setChargement(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Vous devez être connecté');
        return;
      }
      
      setUser(user);

      const { data, error } = await supabase
        .from('profils_etudiants')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur:', error);
        return;
      }

      if (data) {
        setPrenom(data.prenom || '');
        setNom(data.nom || '');
        setDateNaissance(data.date_naissance || '');
        setTelephone(data.telephone || '');
        setAdresse(data.adresse || '');
        setVille(data.ville || '');
        setCodePostal(data.code_postal || '');
        setNotes(data.notes || {});
        setUrlBulletin(data.url_bulletin || '');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setChargement(false);
    }
  }

  async function chargerApplications() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('candidatures')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Erreur chargement applications:', error);
    }
  }

  async function televerserBulletin() {
    if (!bulletin || !user) return;
    
    try {
      setTelechargement(true);
      setAnalyseEnCours(true);

      console.log('Analyse du bulletin en cours...');
      let notesExtraites = {};
      
      try {
        notesExtraites = await extraireNotesDepuisPDF(bulletin);
        console.log('Notes extraites:', notesExtraites);
      } catch (pdfError) {
        console.warn('Impossible d\'extraire les notes du PDF automatiquement:', pdfError);
        notesExtraites = {
          mathematiques: '',
          physique: '',
          chimie: '',
          svt: '',
          francais: '',
          anglais: '',
          histoire: '',
          geographie: '',
          philosophie: '',
          sport: '',
          ses: '',
          si: ''
        };
      }

      setNotes(notesExtraites);

      const nomFichier = `${user.id}/${Date.now()}_${bulletin.name}`;
      
      const { data, error } = await supabase.storage
        .from('bulletins-scolaires')
        .upload(nomFichier, bulletin, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('bulletins-scolaires')
        .getPublicUrl(nomFichier);

      setUrlBulletin(publicUrl);

      await sauvegarderProfilAvecNotes(notesExtraites, publicUrl);

      alert('Bulletin téléversé avec succès! Vous pouvez maintenant remplir vos notes manuellement.');
      setBulletin(null);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      alert('Erreur: ' + (error.message || 'Impossible de téléverser le bulletin'));
    } finally {
      setTelechargement(false);
      setAnalyseEnCours(false);
    }
  }

  async function sauvegarderProfilAvecNotes(notesExtraites, url) {
    const { error } = await supabase
      .from('profils_etudiants')
      .upsert({
        id: user.id,
        prenom,
        nom,
        date_naissance: dateNaissance && dateNaissance.trim() ? dateNaissance : null,
        telephone,
        adresse,
        ville,
        code_postal: codePostal,
        notes: notesExtraites,
        url_bulletin: url
      });

    if (error) throw error;
  }

  async function sauvegarderProfil() {
    if (!user) return;
    
    try {
      setChargement(true);

      const notesFormatted = {};
      Object.entries(notes).forEach(([key, value]) => {
        notesFormatted[key] = value === '' ? null : parseFloat(value) || 0;
      });

      const { error } = await supabase
        .from('profils_etudiants')
        .upsert({
          id: user.id,
          prenom: prenom || '',
          nom: nom || '',
          date_naissance: dateNaissance && dateNaissance.trim() ? dateNaissance : null,
          telephone: telephone || '',
          adresse: adresse || '',
          ville: ville || '',
          code_postal: codePostal || '',
          notes: notesFormatted,
          url_bulletin: urlBulletin || ''
        });

      if (error) {
        console.error('Erreur détaillée:', error);
        throw error;
      }
      
      alert('Profil sauvegardé avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur: ' + (error.message || 'Impossible de sauvegarder le profil'));
    } finally {
      setChargement(false);
    }
  }

  function obtenirCouleurStatut(statut) {
    switch (statut) {
      case 'accepte': return 'bg-green-100 text-green-800 border-green-300';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'refuse': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  function obtenirTexteStatut(statut) {
    switch (statut) {
      case 'accepte': return '✅ Accepté';
      case 'en_attente': return '⏳ En attente';
      case 'refuse': return '❌ Refusé';
      default: return '📝 En cours';
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
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Informations personnelles</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom</label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date de naissance</label>
                <input
                  type="date"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="123 Rue de la République"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ville</label>
                  <input
                    type="text"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Code postal</label>
                  <input
                    type="text"
                    value={codePostal}
                    onChange={(e) => setCodePostal(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="75001"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Bulletin scolaire (PDF)</h2>
            
            {analyseEnCours && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700 font-medium">
                  Analyse du bulletin en cours...
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Les notes seront extraites automatiquement
                </p>
              </div>
            )}

            {urlBulletin && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-700">Bulletin téléversé et analysé</p>
                <a 
                  href={urlBulletin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Voir le bulletin
                </a>
              </div>
            )}

            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setBulletin(e.target.files[0])}
                className="border p-2 rounded flex-1"
              />
              <button
                onClick={televerserBulletin}
                disabled={telechargement || !bulletin}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {telechargement ? "Envoi..." : "Analyser"}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Le PDF sera analysé automatiquement pour extraire vos notes
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-[#5C2D91]">
            Mes Candidatures ({applications.length})
          </h2>

          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">Vous n'avez pas encore postulé à de formation</p>
              <Link 
                to="/dashboard"
                className="text-blue-900 underline"
              >
                Découvrir les formations
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {applications.map((app) => (
                <div 
                  key={app.id}
                  className={`p-4 border rounded-lg ${
                    app.statut === 'accepte' ? 'bg-green-50 border-green-300' :
                    app.statut === 'refuse' ? 'bg-red-50 border-red-300' :
                    'bg-yellow-50 border-yellow-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm">{app.formation_id}</h3>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      app.statut === 'accepte' ? 'bg-green-200 text-green-800' :
                      app.statut === 'refuse' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {app.statut === 'accepte' ? 'Accepté' :
                       app.statut === 'refuse' ? 'Refusé' :
                       'En attente'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Formation ID: {app.formation_id}
                  </p>
                  
                  {app.score && (
                    <p className="text-sm font-medium">
                      Score: {app.score.toFixed(2)}/20
                    </p>
                  )}

                  <Link
                    to={`/formation/${app.formation_id}`}
                    className="text-sm text-blue-900 underline mt-2 inline-block"
                  >
                    Voir la formation
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Notes (sur 20)</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(notes).map(([matiere, note]) => (
                <div key={matiere}>
                  <label className="block text-xs font-medium mb-1 capitalize">
                    {matiere.replace('_', ' ')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={note}
                    onChange={(e) => setNotes({...notes, [matiere]: e.target.value})}
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="0-20"
                  />
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              Ces notes peuvent être modifiées manuellement si l'analyse automatique n'est pas précise
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={sauvegarderProfil}
          disabled={chargement}
          className="w-full py-3 bg-[#5C2D91] text-white rounded-lg font-bold hover:bg-[#4A2373] disabled:bg-gray-400"
        >
          {chargement ? "Sauvegarde..." : "Enregistrer le profil"}
        </button>
      </div>
    </div>
  );
}
