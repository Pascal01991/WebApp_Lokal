/*IONOS Konfiguration:

// Globale Backend-URL basierend auf der Umgebung
export const BACKEND_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api' // Lokales Backend für lokale Tests
        : 'https://sapps.ch/api'; // Produktions-Backend für Live-System


*/

export const BACKEND_URL = "http://localhost:5000/api";
