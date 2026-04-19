import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const API_URL = 'http://localhost:8000';

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
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

  // Stan logowania
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      fetchReports();
    }
  }, [token]);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/reports`);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Błąd pobierania zgłoszeń:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/register`, null, {
        params: { email: registerEmail, password: registerPassword, username: registerUsername }
      });
      alert('Rejestracja udana! Możesz się zalogować.');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterUsername('');
    } catch (error) {
      alert('Błąd rejestracji');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', loginEmail);
      formData.append('password', loginPassword);
      const response = await axios.post(`${API_URL}/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const newToken = response.data.access_token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setIsLoggedIn(true);
      alert('Zalogowano pomyślnie');
    } catch (error) {
      alert('Błąd logowania');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsLoggedIn(false);
  };

  const handleMapClick = (latlng) => {
    setSelectedLocation(latlng);
    setNewReport({ ...newReport, lat: latlng.lat, lng: latlng.lng });
  };

  const addReport = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Musisz być zalogowany, aby dodać zgłoszenie');
      return;
    }
    try {
      await axios.post(`${API_URL}/reports`, newReport, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewReport({ title: '', description: '', lat: 52.2297, lng: 21.0122, report_type: 'korek' });
      setSelectedLocation(null);
      alert('Zgłoszenie dodane!');
    } catch (error) {
      alert('Błąd dodawania zgłoszenia');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>🚗 TrafficApp - Logowanie</h1>
        </header>
        <div className="container">
          <div className="form-section">
            <h2>Rejestracja</h2>
            <form onSubmit={handleRegister}>
              <input type="email" placeholder="Email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required />
              <input type="password" placeholder="Hasło" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required />
              <input type="text" placeholder="Nazwa użytkownika" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} />
              <button type="submit">Zarejestruj</button>
            </form>
          </div>
          <div className="form-section">
            <h2>Logowanie</h2>
            <form onSubmit={handleLogin}>
              <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              <input type="password" placeholder="Hasło" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              <button type="submit">Zaloguj</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚗 TrafficApp - Społecznościowe zgłoszenia utrudnień</h1>
        <p>Autor: Piotr Śledziewski</p>
        <button onClick={handleLogout}>Wyloguj</button>
      </header>
      <div className="container">
        <div className="form-section">
          <h2>Dodaj nowe zgłoszenie</h2>
          <form onSubmit={addReport}>
            <input type="text" placeholder="Tytuł zgłoszenia" value={newReport.title} onChange={(e) => setNewReport({...newReport, title: e.target.value})} required />
            <textarea placeholder="Opis" value={newReport.description} onChange={(e) => setNewReport({...newReport, description: e.target.value})} />
            <select value={newReport.report_type} onChange={(e) => setNewReport({...newReport, report_type: e.target.value})}>
              <option value="korek">Korek</option>
              <option value="wypadek">Wypadek</option>
              <option value="remont">Remont</option>
              <option value="policyjna">Kontrola policyjna</option>
              <option value="inne">Inne</option>
            </select>
            <div className="location-info">
              <strong>Wybrana lokalizacja:</strong><br />
              {selectedLocation ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}` : 'Kliknij na mapę żeby wybrać lokalizację'}
            </div>
            <button type="submit">Dodaj zgłoszenie</button>
          </form>
        </div>
        <div className="map-section">
          <h2>Mapa zgłoszeń - KLIKNIJ ABY WYBRAĆ LOKALIZACJĘ</h2>
          <MapContainer center={[52.2297, 21.0122]} zoom={10} style={{ height: '400px', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
            <MapClickHandler onMapClick={handleMapClick} />
            {selectedLocation && <Marker position={[selectedLocation.lat, selectedLocation.lng]}><Popup>Wybrana lokalizacja</Popup></Marker>}
            {reports.map((report) => report.location && <Marker key={report.id} position={[report.location.lat, report.location.lng]}><Popup><strong>{report.title}</strong><br />{report.description}<br /><em>Typ: {report.report_type}</em></Popup></Marker>)}
          </MapContainer>
        </div>
        <div className="reports-section">
          <h2>Lista zgłoszeń ({reports.length})</h2>
          <div className="reports-list">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <h3>{report.title}</h3>
                <p>{report.description}</p>
                <div className="report-meta"><span>Typ: {report.report_type}</span><span>Data: {new Date(report.created_at).toLocaleString()}</span>{report.location && <span>Lokalizacja: {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}</span>}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;