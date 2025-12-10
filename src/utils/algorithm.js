export function calculerScore(notesEtudiant, formation, rangVoeu = 1, estBoursier = false) {
  const coefficients = formation.coefficients || {};
  const matieresImportantes = formation.matieres_importantes || [];
  
  let sommeNotes = 0;
  let sommeCoefficients = 0;
  
  for (const matiere of matieresImportantes) {
    const note = notesEtudiant[matiere] || 0;
    const coef = coefficients[matiere] || 1;
    
    sommeNotes += note * coef;
    sommeCoefficients += coef;
  }
  
  const moyennePonderee = sommeCoefficients > 0 ? sommeNotes / sommeCoefficients : 0;
  
  // 2️⃣ Vérifier la note minimale
  if (moyennePonderee < (formation.note_minimale || 10)) {
    return { score: 0, admissible: false, raison: "Note insuffisante" };
  }
  
  // 3️⃣ Calculer le score de base (sur 1000 points)
  let score = moyennePonderee * 50; // Max 1000 points si 20/20
  
  // 4️⃣ Bonus selon le rang du vœu (plus c'est haut dans la liste, mieux c'est)
  const bonusRang = Math.max(0, (11 - rangVoeu) * 10); // Max +100 points pour vœu n°1
  score += bonusRang;
  
  // 5️⃣ Bonus boursier (+50 points)
  if (estBoursier) {
    score += 50;
  }
  
  // 6️⃣ Ajustement selon la sélectivité
  const selectivite = formation.type_selectivite || 'normale';
  if (selectivite === 'elite' && moyennePonderee < 14) {
    score *= 0.7; // Malus pour les formations d'élite
  } else if (selectivite === 'normale') {
    score *= 1.1; // Bonus pour les formations non-sélectives
  }
  
  return {
    score: Math.round(score),
    admissible: true,
    moyennePonderee: moyennePonderee.toFixed(2),
    bonusRang,
    bonusBoursier: estBoursier ? 50 : 0
  };
}

/**
 * 🏆 CLASSEMENT DES CANDIDATS
 * 
 * Classe tous les candidats pour une formation donnée
 */
export function classerCandidats(candidatures, formation) {
  return candidatures
    .map(candidature => ({
      ...candidature,
      resultat: calculerScore(
        candidature.notes || {},
        formation,
        candidature.rang_voeu || 1,
        candidature.est_boursier || false
      )
    }))
    .filter(c => c.resultat.admissible)
    .sort((a, b) => b.resultat.score - a.resultat.score);
}

/**
 * 🎯 ATTRIBUTION DES PLACES
 * 
 * Détermine qui est accepté selon la capacité d'accueil
 */
export function attribuerPlaces(candidatsClasses, formation) {
  const capaciteTotale = formation.capacite_totale || 0;
  const capaciteBoursiers = formation.capacite_boursiers || 0;
  
  const boursiers = candidatsClasses.filter(c => c.est_boursier);
  const nonBoursiers = candidatsClasses.filter(c => !c.est_boursier);
  
  // 1️⃣ Placer les boursiers d'abord (quota réservé)
  const boursiersAcceptes = boursiers.slice(0, capaciteBoursiers);
  
  // 2️⃣ Places restantes pour tous
  const placesRestantes = capaciteTotale - boursiersAcceptes.length;
  const autresCandidats = [
    ...boursiers.slice(capaciteBoursiers),
    ...nonBoursiers
  ].sort((a, b) => b.resultat.score - a.resultat.score);
  
  const autresAcceptes = autresCandidats.slice(0, placesRestantes);
  
  // 3️⃣ Marquer les statuts
  const acceptes = [...boursiersAcceptes, ...autresAcceptes].map(c => c.etudiant_id);
  
  return candidatsClasses.map(candidat => ({
    ...candidat,
    statut: acceptes.includes(candidat.etudiant_id) ? 'accepte' : 
            candidat.resultat.score > 0 ? 'en_attente' : 'refuse',
    rang_classement: candidatsClasses.indexOf(candidat) + 1
  }));
}
