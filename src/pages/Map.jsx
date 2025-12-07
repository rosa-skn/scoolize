import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { fetchParcoursupData } from "../services/parcoursupAPI";

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


export default function Map() {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    async function load() {
      const records = await fetchParcoursupData();

      const extracted = records
        .filter((r) => {
          const f = r.fields;
          if (!f) return false;

          const isUniversity = f.tri === "1_Universités";
          const isBUT = f.fili === "BUT";
          const isBTS = f.fili === "BTS";

          return isUniversity || isBUT || isBTS;
        })
        .map((r) => {
          const f = r.fields;

          const coords = f.g_olocalisation_des_formations;
          if (!coords || coords.length !== 2) return null;

          return {
            lat: coords[0],
            lng: coords[1],
            name: f.g_ea_lib_vx,
            formation: f.lib_for_voe_ins,
            type: f.fili,
          };
        })
        .filter((m) => m !== null);

      console.log("=== FILTERED MARKERS ===", extracted.length);

      setMarkers(extracted);
    }

    load();
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[46.5, 2.5]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap France"
        />

        {markers.map((m, index) => (
          <Marker key={index} position={[m.lat, m.lng]} icon={blueIcon}>
            <Popup>
              <b>{m.name}</b>
              <br />
              {m.formation}
              <br />
              <i>Type: {m.type}</i>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
