import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Admin() {
  const [candidatures, setCandidatures] = useState([]);

  // Fetch all candidatures with student + formation info
  const fetchCandidatures = async () => {
    const { data, error } = await supabase
      .from("candidatures")
      .select(`
        id,
        statut,
        date_candidature,
        profils_etudiants (prenom, nom),
        formations (nom_formation, nom_etablissement)
      `);

    if (error) {
      console.log("Erreur:", error);
    } else {
      setCandidatures(data);
    }
  };

  // Update status (accepte / refuse / en_attente)
  const updateStatus = async (id, newStatus) => {
    await supabase
      .from("candidatures")
      .update({ statut: newStatus })
      .eq("id", id);

    fetchCandidatures();
  };

  useEffect(() => {
    fetchCandidatures();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin - Gestion des candidatures</h1>

      {candidatures.length === 0 ? (
        <p>Aucune candidature trouvée.</p>
      ) : (
        candidatures.map((cand) => (
          <div 
            key={cand.id} 
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "10px"
            }}
          >
            <p>
              <strong>
                {cand.profils_etudiants?.prenom} {cand.profils_etudiants?.nom}
              </strong>
              {" → "}
              {cand.formations?.nom_formation} 
              {" ("}{cand.formations?.nom_etablissement}{")"}
            </p>

            <p>Statut actuel : {cand.statut}</p>

            <button onClick={() => updateStatus(cand.id, "accepte")}>
              Accepter
            </button>
            <button onClick={() => updateStatus(cand.id, "refuse")}>
              Refuser
            </button>
            <button onClick={() => updateStatus(cand.id, "en_attente")}>
              Remettre en attente
            </button>
          </div>
        ))
      )}
    </div>
  );
}
