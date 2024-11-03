console.log("Testlog");
//====================================================================================================================================
//KALEDNER
//====================================================================================================================================

// Globale Variablen
let currentDate = new Date();
let allAppointmentsCalendar = [];

// Funktion zum Rendern des Kalenders
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = ''; // Vorherigen Inhalt löschen

    // Startdatum (Montag) der aktuellen Woche erhalten
    const startOfWeek = getStartOfWeek(currentDate);

    // Tagesüberschriften erstellen
    calendar.appendChild(document.createElement('div')); // Leere Ecke für die Zeitspalte
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.textContent = getDayName(day) + ', ' + formatDate(day);
        calendar.appendChild(dayHeader);
    }

    // Zeitslots erstellen 
    for (let hour = 8; hour <= 19; hour++) {
        // Zeitlabel
        const timeLabel = document.createElement('div');
        timeLabel.classList.add('time-slot');
        timeLabel.textContent = (hour < 10 ? '0' + hour : hour) + ':00';
        calendar.appendChild(timeLabel);

        // Stundenfelder für jeden Tag
        for (let i = 0; i < 7; i++) {
            const hourCell = document.createElement('div');
            hourCell.classList.add('hour-cell');
            hourCell.dataset.dayIndex = i;
            hourCell.dataset.hour = hour;
            calendar.appendChild(hourCell);
        }
    }

    // Termine anzeigen
    displayAppointmentsOnCalendar();
}

// Funktion, um den Start der Woche (Montag) zu erhalten
function getStartOfWeek(date) {
    const day = date.getDay(); // 0 (So) bis 6 (Sa)
    const diff = (day === 0 ? -6 : 1 - day); // Anpassen, wenn Tag Sonntag ist
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
}

// Funktion, um den Namen des Tages zu erhalten
function getDayName(date) {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[date.getDay()];
}

// Funktion, um das Datum zu formatieren
function formatDate(date) {
    return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
}



// Termine im Kalender anzeigen
function displayAppointmentsOnCalendar() {
    const startOfWeek = getStartOfWeek(currentDate);

    allAppointments.forEach(app => {
        const appDate = new Date(app.dateTime);
        const appEndDate = new Date(appDate.getTime() + app.duration * 60000); // Dauer in Minuten

        // Überprüfen, ob der Termin in die aktuelle Woche fällt
        if (appDate >= startOfWeek && appDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            const dayIndex = (appDate.getDay() + 6) % 7; // Anpassen, damit Montag=0, Sonntag=6
            const hour = appDate.getHours();

            // Korrekte Zelle finden
            const calendar = document.getElementById('calendar');
            const cells = calendar.querySelectorAll(`.hour-cell[data-day-index='${dayIndex}'][data-hour='${hour}']`);
            if (cells.length > 0) {
                const cell = cells[0];

                // Termin-Element erstellen
                const appointmentDiv = document.createElement('div');
                appointmentDiv.classList.add('appointment');

                // Position und Höhe basierend auf Minuten berechnen
                const topPosition = (appDate.getMinutes() / 60) * 100;
                const durationHeight = (app.duration / 60) * 100;

                appointmentDiv.style.top = topPosition + '%';
                appointmentDiv.style.height = durationHeight + '%';

                appointmentDiv.textContent = `${app.KundennummerzumTermin} ${app.NachnameAppointment} (${app.Dienstleistung})`;

                cell.appendChild(appointmentDiv);
            }
        }
    });
}

// Event-Listener für die Wochennavigation
document.getElementById('prevWeek').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 7);
    renderCalendar();
});

document.getElementById('nextWeek').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 7);
    renderCalendar();
});


//====================================================================================================================================
//TERMINVERWALTUNG
//====================================================================================================================================

document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Verhindert das Standard-Formular-Verhalten

    // Variablen definieren:
    const duration = document.getElementById('duration').value;
    const dateTime = document.getElementById('dateTime').value;
    const description = document.getElementById('description').value;
    const KundennummerzumTermin = document.getElementById('KundennummerzumTermin').value;
    const NachnameAppointment = document.getElementById('NachnameAppointment').value;
    const TelefonAppointment = document.getElementById('TelefonAppointment').value;
    const MailAppointment = document.getElementById('MailAppointment').value;
    const Dienstleistung = document.getElementById('Dienstleistung').value;

    // Ausgabe zur Überprüfung
    console.log("Frontend: duration:", duration);
    console.log("Frontend: dateTime:", dateTime);
    console.log("Frontend: Description:", description);
    console.log("Frontend: KundennummerzumTermin:", KundennummerzumTermin);
    console.log("Frontend: NachnameAppointment:", NachnameAppointment);
    console.log("Frontend: TelefonAppointment:", TelefonAppointment);
    console.log("Frontend: MailAppointment:", MailAppointment);
    console.log("Frontend: Dienstleistung:", Dienstleistung);

    try {
        const response = await fetch('http://localhost:5000/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ duration, dateTime, description, KundennummerzumTermin, NachnameAppointment, TelefonAppointment, MailAppointment, Dienstleistung})
        });

        if (response.ok) {
            alert('Termin erfolgreich hinzugefügt!');
            loadAppointments();  // Termine neu laden
        } else {
            alert('Fehler beim Hinzufügen des Termins');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
});
  
// Globale Variable, um die geladenen Termine zu speichern
let allAppointments = [];

// Termine abrufen und anzeigen
async function loadAppointments() {
    try {
        const response = await fetch('http://localhost:5000/api/appointments', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            allAppointments = await response.json(); // Termine global speichern
            console.log(allAppointments); // Debugging-Log
            displayAppointments(allAppointments); // Alle Termine anzeigen in der Liste
            renderCalendar(); // Kalender nach dem Laden der Termine rendern im Kalender
        } else {
            alert('Fehler beim Laden der Termine');
            console.error('Fehler beim Laden der Termine');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}

// Termine in der Liste anzeigen
// Funktion zur Anzeige der Terminliste mit Verweis auf Kundendaten basierend auf KundennummerzumTermin
async function displayAppointments(appointments) {
    const clientsResponse = await fetch('http://localhost:5000/api/clients'); // Lädt alle Kunden aus der Kunden-Datenbank
    const clients = await clientsResponse.json();

    const appointmentsList = document.getElementById('appointmentsList');
    appointmentsList.innerHTML = appointments.map(app => {
        // Kunden basierend auf KundennummerzumTermin finden
        const client = clients.find(client => client.Kundennummer === app.KundennummerzumTermin);

        return `
            <div class="termin-card">
                <!-- Spalte A: Kundendaten -->
                <div class="termin-info">
                    <div>${client ? `${client.Vorname} ${client.Nachname}` : "Kunde nicht gefunden"}</div> <!-- A1 -->
                    <div>${client ? `${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}` : ""}</div> <!-- A2 -->
                    <div>${client ? `${client.Telefon}, ${client.Mail}` : ""}</div> <!-- A3 -->
                </div>
                <!-- Spalte B: Termindetails -->
                <div class="termin-info">
                    <div>${new Date(app.dateTime).toLocaleDateString()} ${new Date(app.dateTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div> <!-- B1 -->
                    <div>${app.Dienstleistung} (${app.duration} Min)</div> <!-- B2 -->
                    <div>${app.description}</div> <!-- B3 -->
                </div>
                <!-- Spalte C: Weitere Details -->
                <div class="termin-info">
                    <div>${app.NachnameAppointment}</div> <!-- C1 -->
                    <div>${app.TelefonAppointment}</div> <!-- C2 -->
                    <div>${app.MailAppointment}</div> <!-- C3 -->
                </div>
                <!-- Spalte D: Aktionen -->
                <div class="termin-actions">
                    <button onclick="editAppointment('${app._id}')" class="action-btn edit-btn" title="Bearbeiten">
                        ✏️
                    </button>
                    <button onclick="deleteAppointment('${app._id}')" class="action-btn delete-btn" title="Löschen">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}





function filterAppointments() {
    const searchTerm = document.getElementById('searchAppointment').value.toLowerCase();
    console.log("Filter term:", searchTerm); // Testlog

    const filteredAppointments = allAppointments.filter(app => {
        // Den zugehörigen Kunden basierend auf der Kundennummer suchen
        const client = allClients.find(c => c.Kundennummer === app.KundennummerzumTermin);

        // Überprüfen, ob eine Übereinstimmung in den Kundendaten gefunden wird
        return (
            (client && client.Vorname && client.Vorname.toLowerCase().includes(searchTerm)) ||
            (client && client.Nachname && client.Nachname.toLowerCase().includes(searchTerm)) ||
            (client && client.Strasse && client.Strasse.toLowerCase().includes(searchTerm)) ||
            (client && client.Ort && client.Ort.toLowerCase().includes(searchTerm)) ||
            (client && client.Telefon && client.Telefon.toLowerCase().includes(searchTerm)) ||
            (client && client.Mail && client.Mail.toLowerCase().includes(searchTerm))
        );
    });

    displayAppointments(filteredAppointments); // Gefilterte Ergebnisse anzeigen
}



// Event-Listener für die Suche hinzufügen
document.getElementById('searchAppointment').addEventListener('input', function () {
    console.log("Search Input Detected"); // Testlog
    filterAppointments();
});


//Button für Löschen des Termins
async function deleteAppointment(appointmentId) {
    const confirmation = confirm("Möchtest du diesen Termin wirklich löschen?");
    if (!confirmation) return;
    console.log("Appointment ID to delete: ", appointmentId);


    try {
        const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Termin erfolgreich gelöscht');
            loadAppointments();  // Termine neu laden
        } else {
            alert('Fehler beim Löschen des Termins');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}


//Button für Bearbeiten des Termins
async function editAppointment(appointmentId) {
    const appointment = allAppointments.find(app => app._id === appointmentId);
    if (!appointment) {
        alert('Termin nicht gefunden');
        return;
    }

    // Lade die bestehenden Daten in das Formular
    document.getElementById('duration').value = appointment.duration;
    document.getElementById('dateTime').value = new Date(appointment.dateTime).toISOString().slice(0, 16); // Für 'datetime-local'
    document.getElementById('description').value = appointment.description;
    document.getElementById('KundennummerzumTermin').value = appointment.KundennummerzumTermin;
    document.getElementById('NachnameAppointment').value = appointment.NachnameAppointment;
    document.getElementById('TelefonAppointment').value = appointment.TelefonAppointment;
    document.getElementById('MailAppointment').value = appointment.MailAppointment;
    document.getElementById('Dienstleistung').value = appointment.Dienstleistung;

    // Verändere den Submit-Button, um die Änderungen zu speichern
    const submitButton = document.querySelector('#appointmentForm button[type="submit"]');
    submitButton.innerText = "Änderungen speichern";
    submitButton.onclick = async function (e) {
        e.preventDefault();
        const updatedAppointment = {
            duration: document.getElementById('duration').value, // Leerzeichen entfernt
            dateTime: document.getElementById('dateTime').value,
            description: document.getElementById('description').value,
            KundennummerzumTermin: document.getElementById('KundennummerzumTermin').value,
            NachnameAppointment: document.getElementById('NachnameAppointment').value,
            TelefonAppointment: document.getElementById('TelefonAppointment').value,
            MailAppointment: document.getElementById('MailAppointment').value,
            Dienstleistung: document.getElementById('Dienstleistung').value,
        };

        try {
            const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedAppointment)
            });

            if (response.ok) {
                alert('Termin erfolgreich aktualisiert');
                loadAppointments();  // Termine neu laden
                submitButton.innerText = "Termin hinzufügen";
                submitButton.onclick = null;  // Zurücksetzen auf die ursprüngliche Funktion
            } else {
                alert('Fehler beim Aktualisieren des Termins');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    };
}


//====================================================================================================================================
//CLIENT-MANAGEMENT
//====================================================================================================================================
// Event Listener für das Kundenformular
document.getElementById('clientForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Kundeninformationen abrufen
    const Vorname = document.getElementById('Vorname').value;
    const Nachname = document.getElementById('Nachname').value;
    const Strasse = document.getElementById('Strasse').value;
    const Hausnummer = document.getElementById('Hausnummer').value;
    const Postleitzahl = document.getElementById('Postleitzahl').value;
    const Ort = document.getElementById('Ort').value;
    const Telefon = document.getElementById('Telefon').value;
    const Mail = document.getElementById('Mail').value;
    

    try {
        const response = await fetch('http://localhost:5000/api/clients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ Vorname, Nachname, Strasse, Hausnummer, Postleitzahl, Ort, Telefon, Mail })
        });

        if (response.ok) {
            alert('Kunde erfolgreich hinzugefügt!');
            loadClients();  // Kundenliste neu laden
        } else {
            alert('Fehler beim Hinzufügen des Kunden');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
});

// Globale Variable für die Kundenliste
let allClients = [];

// Funktion zum Laden aller Kunden
async function loadClients() {
    try {
        const response = await fetch('http://localhost:5000/api/clients');
        if (response.ok) {
            allClients = await response.json();
            displayClients(allClients);
        } else {
            alert('Fehler beim Laden der Kunden');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}

// Funktion zum Anzeigen der Kundenliste
function displayClients(clients) {
    const clientsList = document.getElementById('clientsList');
    clientsList.innerHTML = clients.map(client => `
        <div class="client-card">
            <span class="client-info">${client.Vorname} ${client.Nachname}</span>
            <span class="client-info">${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}</span>
            <span class="client-info">${client.Telefon}, ${client.Mail}</span>
            <div class="client-actions">
                <button onclick="editClient('${client._id}')" class="action-btn edit-btn" title="Bearbeiten">
                    ✏️
                </button>
                <button onclick="deleteClient('${client._id}')" class="action-btn delete-btn" title="Löschen">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}



// Kunden bearbeiten
async function editClient(clientId) {
    const client = allClients.find(c => c._id === clientId);
    if (!client) return alert('Kunde nicht gefunden');

    document.getElementById('Vorname').value = client.Vorname;
    document.getElementById('Nachname').value = client.Nachname;
    document.getElementById('Strasse').value = client.Strasse;
    document.getElementById('Hausnummer').value = client.Hausnummer;
    document.getElementById('Postleitzahl').value = client.Postleitzahl;
    document.getElementById('Ort').value = client.Ort;
    document.getElementById('Telefon').value = client.Telefon;
    document.getElementById('Mail').value = client.Mail;
    document.getElementById('Kundennummer').value = client.Kundennummer;

    const submitButton = document.querySelector('#clientForm button[type="submit"]');
    submitButton.innerText = "Änderungen speichern";
    submitButton.onclick = async function (e) {
        e.preventDefault();
        const updatedClient = {
            Vorname: document.getElementById('Vorname').value,
            Nachname: document.getElementById('Nachname').value,
            Strasse: document.getElementById('Strasse').value,
            Hausnummer: document.getElementById('Hausnummer').value,
            Postleitzahl: document.getElementById('Postleitzahl').value,
            Ort: document.getElementById('Ort').value,
            Telefon: document.getElementById('Telefon').value,
            Mail: document.getElementById('Mail').value,
            Kundennummer: document.getElementById('Kundennummer').value,
        };

        try {
            const response = await fetch(`http://localhost:5000/api/clients/${clientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedClient)
            });

            if (response.ok) {
                alert('Kunde erfolgreich aktualisiert');
                loadClients();
                submitButton.innerText = "Kunden hinzufügen";
                submitButton.onclick = null;
            } else {
                alert('Fehler beim Aktualisieren des Kunden');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    };
}

// Kunden löschen
async function deleteClient(clientId) {
    if (!confirm("Möchtest du diesen Kunden wirklich löschen?")) return;

    try {
        const response = await fetch(`http://localhost:5000/api/clients/${clientId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Kunde erfolgreich gelöscht');
            loadClients();
        } else {
            alert('Fehler beim Löschen des Kunden');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}

// Suchfunktion für Kunden
document.getElementById('searchClient').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const filteredClients = allClients.filter(client =>
        client.Vorname.toLowerCase().includes(searchTerm) ||
        client.Nachname.toLowerCase().includes(searchTerm) ||
        client.Telefon.toLowerCase().includes(searchTerm) ||
        client.Mail.toLowerCase().includes(searchTerm)
    );
    displayClients(filteredClients);
});

document.addEventListener('DOMContentLoaded', function() {
    loadAppointments();
    loadClients();
});


//Kundensuche innerhalb der Terminverwaltung:
// Filtered search results for customer search
let searchResults = [];

// Event-Listener für die Kunden-Suche
document.getElementById('searchCustomerInput').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();

    // Zeige die besten 5 Ergebnisse an
    searchResults = allClients
        .filter(client => 
            client.Vorname.toLowerCase().includes(searchTerm) ||
            client.Nachname.toLowerCase().includes(searchTerm) ||
            client.Ort.toLowerCase().includes(searchTerm) ||
            client.Telefon.toLowerCase().includes(searchTerm)
        )
        .slice(0, 5); // nur die besten 5 Ergebnisse
    
    displaySearchResults();
});

// Funktion zum Anzeigen der Suchergebnisse
function displaySearchResults() {
    const searchResultsContainer = document.getElementById('searchResults');
    searchResultsContainer.innerHTML = ''; // Vorherige Ergebnisse löschen

    if (searchResults.length === 0) return; // Falls keine Ergebnisse

    searchResults.forEach(client => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('search-result-item');
        resultItem.textContent = `${client.Vorname} ${client.Nachname}, ${client.Ort}, ${client.Telefon}`;
        
        // Klickbare Suchergebnisse
        resultItem.addEventListener('click', () => {
        // Kundennummer formatieren: erst zu String konvertieren, dann `padStart` verwenden
        document.getElementById('KundennummerzumTermin').value = String(client.Kundennummer).padStart(6, '0'); 
        searchResultsContainer.innerHTML = ''; // Suchergebnisse leeren
        document.getElementById('searchCustomerInput').value = ''; // Suchfeld zurücksetzen
    });


        searchResultsContainer.appendChild(resultItem);
    });
}

// Kundenliste laden und Suchfeld initialisieren beim Start
document.addEventListener('DOMContentLoaded', function() {
    loadAppointments();
    loadClients();  // AllClients wird hier geladen
});




//====================================================================================================================================
//EINSTELLUNGEN
//====================================================================================================================================
//FARBAUSWAHL THEMA DESIGN DARKMODE
// Funktion zum Aktualisieren der Themenfarbe
function updateThemeColor(color) {
    document.documentElement.style.setProperty('--theme-color', color);
    // Optional: Speichere die Farbe in localStorage
    localStorage.setItem('themeColor', color);
}

// Funktion zum Umschalten des Tag-Nacht-Modus
function toggleDarkMode(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    // Optional: Speichere den Modus in localStorage
    localStorage.setItem('darkMode', isDark);
}

// Event-Listener für die Farbwahl
document.getElementById('themeColor').addEventListener('input', function() {
    updateThemeColor(this.value);
});

// Event-Listener für den Tag-Nacht-Schalter
document.getElementById('darkModeToggle').addEventListener('change', function() {
    toggleDarkMode(this.checked);
});

// Funktion zum Laden der gespeicherten Einstellungen
function loadThemeSettings() {
    const savedColor = localStorage.getItem('themeColor');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    
    if (savedColor) {
        updateThemeColor(savedColor);
        document.getElementById('themeColor').value = savedColor;
    }
    
    if (savedDarkMode) {
        toggleDarkMode(true);
        document.getElementById('darkModeToggle').checked = true;
    }
}

// Lade die Einstellungen beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    loadThemeSettings();
});


















