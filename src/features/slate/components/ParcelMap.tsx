import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, ExternalLink } from "lucide-react";
import "leaflet/dist/leaflet.css";

function parseGps(gps: string): [number, number] | null {
  const match = gps.match(/(-?\d+\.?\d*)\s*°?\s*([NS])\s*,\s*(-?\d+\.?\d*)\s*°?\s*([EW])/i);
  if (!match) return null;
  let lat = parseFloat(match[1]);
  let lng = parseFloat(match[3]);
  if (match[2].toUpperCase() === "S") lat = -lat;
  if (match[4].toUpperCase() === "W") lng = -lng;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return [lat, lng];
}

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return (h % 10000) / 10000;
  };
}

function irregularBoundary(lat: number, lng: number, seed: string): [number, number][] {
  const rand = seededRandom(seed);
  const vertexCount = 5 + Math.floor(rand() * 3);
  const baseRadius = 0.0011 + rand() * 0.0009;
  const points: [number, number][] = [];
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * 2 * Math.PI + (rand() - 0.5) * 0.6;
    const radius = baseRadius * (0.65 + rand() * 0.7);
    points.push([lat + radius * Math.cos(angle), lng + radius * Math.sin(angle) * 1.15]);
  }
  return points;
}

/** Re-fits the map view whenever the polygon changes. */
function FitBounds({ polygon }: { polygon: [number, number][] }) {
  const map = useMap();
  if (polygon.length >= 2) {
    try { map.fitBounds(L.latLngBounds(polygon), { padding: [20, 20], maxZoom: 18 }); } catch { /* ignore */ }
  }
  return null;
}

const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#B8923D;border:2px solid #0F2A4A;box-shadow:0 0 0 5px rgba(184,146,61,.28)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface ParcelMapProps {
  gps: string;
  height?: number;
  /** When provided, renders this explicit polygon instead of the seeded estimate. */
  polygon?: [number, number][];
}

export default function ParcelMap({ gps, height = 220, polygon: explicitPolygon }: ParcelMapProps) {
  const coords = parseGps(gps);

  if (!coords) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: height, borderRadius: 8, border: "1px solid #dee2e6", background: "#f3f4f6", color: "#9aa1a9", fontSize: 12 }}
      >
        GPS coordinates not yet surveyed for this parcel.
      </div>
    );
  }

  const [lat, lng] = coords;
  const bounds = explicitPolygon && explicitPolygon.length >= 3 ? explicitPolygon : irregularBoundary(lat, lng, gps);
  const isRealPolygon = !!(explicitPolygon && explicitPolygon.length >= 3);

  return (
    <div>
      <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #dee2e6" }}>
        <MapContainer key={`${gps}-${isRealPolygon}-${bounds.length}`} center={[lat, lng]} zoom={16} style={{ height, width: "100%" }} scrollWheelZoom={false}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {isRealPolygon && <FitBounds polygon={bounds} />}
          <Polygon
            positions={bounds}
            pathOptions={{
              color: isRealPolygon ? "#1C7A4E" : "#B8923D",
              fillColor: isRealPolygon ? "#1C7A4E" : "#B8923D",
              fillOpacity: 0.18,
              weight: isRealPolygon ? 2.5 : 2,
              dashArray: isRealPolygon ? undefined : "4 4",
            }}
          />
          <Marker position={[lat, lng]} icon={pinIcon}>
            <Popup>{gps}</Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
        <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "#717881" }}>
          <MapPin size={12} />
          <span>{gps}</span>
          {isRealPolygon && <span style={{ color: "#1C7A4E", fontWeight: 600 }}>· {bounds.length} vertices</span>}
          {!isRealPolygon && <span style={{ color: "#9aa1a9", fontStyle: "italic" }}>· estimated boundary</span>}
        </div>
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1"
          style={{ fontSize: 11, color: "#1d4670", fontWeight: 600, textDecoration: "none" }}
        >
          Open in Maps <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}
