const BACKEND_URL =
    window.location.hostname === 'localhost'
        ? 'http://localhost:5000' // Lokales Backend für lokale Tests
        : 'https://sapps.ch'; // Produktions-Backend für Live-System

export default BACKEND_URL;
