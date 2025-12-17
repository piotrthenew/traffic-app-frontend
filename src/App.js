import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix dla ikonek markerów
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const API_URL = 'http://localhost:8000';

// Komponent do obsługi kliknięć na mapie
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function App() {
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    lat: 52.2297,
    lng: 21.0122,
    report_type: 'korek'
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Pobieranie zgłoszeń z backendu
  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/reports`);
      setReports(response.data.reports);
    } catch (error) {
      console.error('Błąd pobierania zgłoszeń:', error);
    }
  };

  // Obsługa kliknięcia na mapę
  const handleMapClick = (latlng) => {
    setSelectedLocation(latlng);
    setNewReport({
      ...newReport,
      lat: latlng.lat,
      lng: latlng.lng
    });
  };

  // Dodawanie nowego zgłoszenia
  const addReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/reports`, newReport);
      setNewReport({
        title: '',
        description: '',
        lat: 52.2297,
        lng: 21.0122,
        report_type: 'korek'
      });
      setSelectedLocation(null);
      fetchReports(); // Odśwież listę
      alert('Zgłoszenie dodane!');
    } catch (error) {
      console.error('Błąd dodawania zgłoszenia:', error);
      alert('Błąd przy dodawaniu zgłoszenia');
    }
  };

  // Załaduj zgłoszenia przy starcie
  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚗 TrafficApp - Społecznościowe zgłoszenia utrudnień</h1>
        <p>Autor: Piotr Śledziewski</p>
      </header>

      <div className="container">
        {/* Formularz dodawania zgłoszenia */}
        <div className="form-section">
          <h2>Dodaj nowe zgłoszenie</h2>
          <form onSubmit={addReport}>
            <input
              type="text"
              placeholder="Tytuł zgłoszenia"
              value={newReport.title}
              onChange={(e) => setNewReport({...newReport, title: e.target.value})}
              required
            />
            <textarea
              placeholder="Opis"
              value={newReport.description}
              onChange={(e) => setNewReport({...newReport, description: e.target.value})}
            />
            <select
              value={newReport.report_type}
              onChange={(e) => setNewReport({...newReport, report_type: e.target.value})}
            >
              <option value="korek">Korek</option>
              <option value="wypadek">Wypadek</option>
              <option value="remont">Remont</option>
              <option value="policyjna">Kontrola policyjna</option>
              <option value="inne">Inne</option>
            </select>
            
            <div className="location-info">
              <p>
                <strong>Wybrana lokalizacja:</strong><br />
                {selectedLocation 
                  ? `Szerokość: ${selectedLocation.lat.toFixed(6)}, Długość: ${selectedLocation.lng.toFixed(6)}`
                  : 'Kliknij na mapę żeby wybrać lokalizację'
                }
              </p>
            </div>

            <button type="submit">Dodaj zgłoszenie</button>
          </form>
        </div>

        {/* Mapa */}
        <div className="map-section">
          <h2>Mapa zgłoszeń - KLIKNIJ ABY WYBRAĆ LOKALIZACJĘ</h2>
          <MapContainer 
            center={[52.2297, 21.0122]} 
            zoom={10} 
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* Obsługa kliknięć na mapie */}
            <MapClickHandler onMapClick={handleMapClick} />
            
            {/* Marker wybranej lokalizacji */}
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>
                  Tutaj zostanie dodane zgłoszenie<br />
                  <strong>{newReport.title || 'Brak tytułu'}</strong>
                </Popup>
              </Marker>
            )}

            {/* Markery istniejących zgłoszeń */}
            {reports.map((report) => (
              report.location && (
                <Marker 
                  key={report.id} 
                  position={[report.location.lat, report.location.lng]}
                >
                  <Popup>
                    <strong>{report.title}</strong><br />
                    {report.description}<br />
                    <em>Typ: {report.report_type}</em>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>

        {/* Lista zgłoszeń */}
        <div className="reports-section">
          <h2>Lista zgłoszeń ({reports.length})</h2>
          <div className="reports-list">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <h3>{report.title}</h3>
                <p>{report.description}</p>
                <div className="report-meta">
                  <span>Typ: {report.report_type}</span>
                  <span>Data: {new Date(report.created_at).toLocaleString()}</span>
                  {report.location && (
                    <span>Lokalizacja: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;