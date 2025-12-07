// src/services/parcoursupAPI.js

export async function fetchParcoursupData() {
  const url =
    "https://data.enseignementsup-recherche.gouv.fr/api/records/1.0/search/?dataset=fr-esr-parcoursup&q=&rows=5000";

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("=== RAW RECORD ===", data.records[0]);


    console.log("API Records Loaded:", data.records.length);
    return data.records;
  } catch (error) {
    console.error("Error fetching Parcoursup data:", error);
    return [];
  }
}
