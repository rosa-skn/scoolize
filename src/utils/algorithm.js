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
  
  if (moyennePonderee < (formation.note_minimale || 10)) {
    return { score: 0, admissible: false, raison: "Note insuffisante" };
  }
  
  let score = moyennePonderee * 50;
  
  const bonusRang = Math.max(0, (11 - rangVoeu) * 10);
  score += bonusRang;
  
  if (estBoursier) {
    score += 50;
  }
  
  const selectivite = formation.type_selectivite || 'normale';
  if (selectivite === 'elite' && moyennePonderee < 14) {
    score *= 0.7;
  } else if (selectivite === 'normale') {
    score *= 1.1;
  }
  
  return {
    score: Math.round(score),
    admissible: true,
    moyennePonderee: moyennePonderee.toFixed(2),
    bonusRang,
    bonusBoursier: estBoursier ? 50 : 0
  };
}

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

export function attribuerPlaces(candidatsClasses, formation) {
  const capaciteTotale = formation.capacite_totale || 0;
  const capaciteBoursiers = formation.capacite_boursiers || 0;
  
  const boursiers = candidatsClasses.filter(c => c.est_boursier);
  const nonBoursiers = candidatsClasses.filter(c => !c.est_boursier);
  
  const boursiersAcceptes = boursiers.slice(0, capaciteBoursiers);
  
  const placesRestantes = capaciteTotale - boursiersAcceptes.length;
  const autresCandidats = [
    ...boursiers.slice(capaciteBoursiers),
    ...nonBoursiers
  ].sort((a, b) => b.resultat.score - a.resultat.score);
  
  const autresAcceptes = autresCandidats.slice(0, placesRestantes);
  
  const acceptes = [...boursiersAcceptes, ...autresAcceptes].map(c => c.etudiant_id);
  
  return candidatsClasses.map(candidat => ({
    ...candidat,
    statut: acceptes.includes(candidat.etudiant_id) ? 'accepte' : 
            candidat.resultat.score > 0 ? 'en_attente' : 'refuse',
    rang_classement: candidatsClasses.indexOf(candidat) + 1
  }));
}
