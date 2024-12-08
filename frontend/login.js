// Importiere die Backend-URL (muss am Anfang stehen)
import { BACKEND_URL } from './config.js';

// Füge den Event-Listener für das Formular hinzu
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Verhindert das Standard-Formular-Verhalten

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Führe den Login durch
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Für Cookies oder Authentifizierungsinformationen
            body: JSON.stringify({ email, password }),
        });

        // Verarbeite die Antwort
        const data = await response.json();

        if (response.ok) {
            // Zeige Erfolgsmeldung an
            document.getElementById('message').textContent = 'Login erfolgreich! Token: ' + data.token;

            

            // Weiterleitung auf die geschützte Seite
            window.location.href = '/api/dashboard';
        } else {
            // Zeige Fehlermeldung an
            document.getElementById('message').textContent = 'Login fehlgeschlagen: ' + data.msg;
        }
    } catch (err) {
        // Zeige allgemeine Fehlermeldung an
        document.getElementById('message').textContent = 'Fehler: ' + err.message;
    }
});
