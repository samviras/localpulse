import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { Location, CompetitorWithSnapshot } from '../types';

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const grayIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

interface Props {
  locations: Location[];
  competitors: CompetitorWithSnapshot[];
  center?: [number, number];
  zoom?: number;
  showRadius?: boolean;
  radiusCenter?: [number, number];
  height?: string;
}

export default function CompetitorMap({
  locations, competitors, center = [49.27, -123.12], zoom = 12,
  showRadius, radiusCenter, height = '400px',
}: Props) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height, width: '100%', borderRadius: '0.75rem' }} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {showRadius && radiusCenter && (
        <Circle center={radiusCenter as any} radius={1000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08 }} />
      )}
      {locations.map(loc => (
        <Marker key={`loc-${loc.id}`} position={[loc.latitude, loc.longitude]} icon={blueIcon}>
          <Popup><div className="text-sm"><strong className="text-blue-600">{loc.name}</strong><br /><span className="text-gray-600">{loc.address}</span><br /><span className="text-xs text-gray-400">📍 Your Location</span></div></Popup>
        </Marker>
      ))}
      {competitors.map(c => (
        <Marker key={`comp-${c.id}`} position={[c.latitude, c.longitude]} icon={c.latest_business_status === 'CLOSED_TEMPORARILY' ? grayIcon : redIcon}>
          <Popup><div className="text-sm"><strong className="text-red-600">{c.name}</strong><br />{c.latest_rating && <span>⭐ {c.latest_rating}</span>}{c.latest_review_count && <span> · {c.latest_review_count} reviews</span>}<br />{c.distance_km && <span className="text-xs text-gray-400">{c.distance_km}km away</span>}{c.latest_business_status === 'CLOSED_TEMPORARILY' && <><br /><span className="text-xs text-amber-500 font-bold">⚠️ Temporarily Closed</span></>}</div></Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
