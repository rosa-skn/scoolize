import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchParcoursupData } from "../services/parcoursupAPI";

export default function UniversityPage() {
  const { name } = useParams();
  const [formations, setFormations] = useState([]);

  useEffect(() => {
    async function load() {
      const records = await fetchParcoursupData();
      const list = records
        .map((r) => r.fields)
        .filter((f) => f.etablissement === name)
        .map((f) => f.libelle_formation);

      setFormations(list);
    }

    load();
  }, [name]);

  return (
    <div style={{ padding: "30px" }}>
      <h1>{name}</h1>
      <h2>Formations :</h2>

      <ul>
        {formations.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </div>
  );
}
