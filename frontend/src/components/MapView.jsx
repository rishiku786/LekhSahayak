import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for critical issues
const criticalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapView = ({ complaints = [] }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Default to a central point in India if no data
  const center = [20.5937, 78.9629];
  const zoom = 5;

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative z-0">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {complaints.map((c) => {
          if (!c.coordinates || !c.coordinates.lat || !c.coordinates.lng) return null;
          
          return (
            <Marker 
              key={c._id || c.trackingId} 
              position={[c.coordinates.lat, c.coordinates.lng]}
              icon={c.priority === 'Critical' ? criticalIcon : defaultIcon}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{c.problemType}</h4>
                  <p className="text-xs text-slate-500 mb-2 truncate max-w-[200px]">{c.location}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      c.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {c.priority}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {c.status}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/complaint/${c.trackingId}`)}
                    className="w-full py-1.5 bg-brand-600 text-white font-bold text-xs rounded-md shadow-sm hover:bg-brand-700"
                  >
                    {t('map.view_details')}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
