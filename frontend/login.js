// Importiere die Backend-URL (muss am Anfang stehen)
import { BACKEND_URL } from './config.js';

// Füge den Event-Listener für das Formular hinzu
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Verhindert das Standard-Formular-Verhalten

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    try {
        // Führe den Login durch
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Für Cookies oder Authentifizierungsinformationen
            body: JSON.stringify({ username, password, rememberMe }),
        });

        // Verarbeite die Antwort
        const data = await response.json();

        if (response.ok) {
            // Zeige Erfolgsmeldung an
            document.getElementById('message').textContent = 'Login erfolgreich! Token: ' + data.token;

            //Speicherung des Usernamens
            localStorage.setItem('loggedInUsername', username);
            console.log('user ' + username);

            // Weiterleitung auf die geschützte Seite
            window.location.href = `${BACKEND_URL}/dashboard`;
            
            console.log('Token:');
        } else {
            // Zeige Fehlermeldung an
            document.getElementById('message').textContent = 'Login fehlgeschlagen: ' + data.msg;
        }
    } catch (err) {
        // Zeige allgemeine Fehlermeldung an
        document.getElementById('message').textContent = 'Fehler: ' + err.message;
    }
});
