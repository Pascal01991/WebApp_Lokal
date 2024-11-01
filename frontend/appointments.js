//Einstellungen
//Kalender-Einstellungen


//Kalender CHATGPT:
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

                appointmentDiv.textContent = `${app.VornameAppointment} ${app.NachnameAppointment} (${app.Dienstleistung})`;

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



document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Verhindert das Standard-Formular-Verhalten

    // Variablen definieren
    const duration = document.getElementById('duration').value;
    const dateTime = document.getElementById('dateTime').value;
    const description = document.getElementById('description').value;
    const VornameAppointment = document.getElementById('VornameAppointment').value;
    const NachnameAppointment = document.getElementById('NachnameAppointment').value;
    const TelefonAppointment = document.getElementById('TelefonAppointment').value;
    const MailAppointment = document.getElementById('MailAppointment').value;
    const Dienstleistung = document.getElementById('Dienstleistung').value;

    // Ausgabe zur Überprüfung
    console.log("Frontend: duration:", duration);
    console.log("Frontend: dateTime:", dateTime);
    console.log("Frontend: Description:", description);
    console.log("Frontend: VornameAppointment:", VornameAppointment);
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
            body: JSON.stringify({ duration, dateTime, description, VornameAppointment, NachnameAppointment, TelefonAppointment, MailAppointment, Dienstleistung})
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
function displayAppointments(appointments) {
    const appointmentsList = document.getElementById('appointmentsList');
    appointmentsList.innerHTML = appointments.map(app => `
        <div id="EinzelnerTermin">
        <div id="TerminBereichPersonalien">
            <h3>${app.VornameAppointment} ${app.NachnameAppointment}</h3>
            <p>${app.TelefonAppointment}</p>
            <p>${app.MailAppointment}</p>
            <button onclick="editAppointment('${app._id}')">Bearbeiten</button>
        </div>
        <div id="TerminBereichTermin">
            <h3>${new Date(app.dateTime).toLocaleString()}</h3> <!-- Datum inkl. Uhrzeit -->    
            <p>${app.Dienstleistung}</p>
            <p>${app.description}</p>
            <p>${app.duration}</p>
            <button onclick="editAppointment('${app._id}')">Bearbeiten</button>
            <button onclick="deleteAppointment('${app._id}')">Löschen</button>
        </div>
        </div>
        <br>
    `).join('');
}
/*
// Echtzeit-Suche basierend auf dem Titel der Termine
function filterAppointments() {
    const searchTerm = document.getElementById('searchTitel').value.toLowerCase();
    const filteredAppointments = allAppointments.filter(app => 
        app.title && app.title.toLowerCase().includes(searchTerm) // Sicherstellen, dass der Titel existiert
    );
    displayAppointments(filteredAppointments); // Gefilterte Ergebnisse anzeigen
}
*/
// Echtzeit-Suche basierend auf dem Personenbezogen daten der Termine
function filterAppointments() {
    const searchTerm = document.getElementById('searchTitel').value.toLowerCase();
    const filteredAppointments = allAppointments.filter(app => 
   {
            const searchTermLowerCase = searchTerm.toLowerCase();
        
            return (
                (app.VornameAppointment && app.VornameAppointment.toLowerCase().includes(searchTermLowerCase)) ||
                (app.NachnameAppointment && app.NachnameAppointment.toLowerCase().includes(searchTermLowerCase)) ||
                (app.TelefonAppointment && app.TelefonAppointment.toLowerCase().includes(searchTermLowerCase)) ||
                (app.MailAppointment && app.MailAppointment.toLowerCase().includes(searchTermLowerCase))
            );
        });
        
    displayAppointments(filteredAppointments); // Gefilterte Ergebnisse anzeigen
}


// Event-Listener für die Suche hinzufügen
document.getElementById('searchTitel').addEventListener('input', filterAppointments);
  
  // Termine laden, wenn das Dashboard geladen wird
  window.onload = function() {
    loadAppointments();
};

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
    document.getElementById('VornameAppointment').value = appointment.VornameAppointment;
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
            VornameAppointment: document.getElementById('VornameAppointment').value,
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




















