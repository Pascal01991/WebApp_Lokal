document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Verhindert das Standard-Formular-Verhalten

    // Variablen definieren
    const duration = document.getElementById('duration').value;
    const dateTime = document.getElementById('dateTime').value;
    const description = document.getElementById('description').value;
    const Vorname = document.getElementById('Vorname').value;
    const Nachname = document.getElementById('Nachname').value;
    const Telefon = document.getElementById('Telefon').value;
    const Mail = document.getElementById('Mail').value;
    const Dienstleistung = document.getElementById('Dienstleistung').value;

    // Ausgabe zur Überprüfung
    console.log("Frontend: duration:", duration);
    console.log("Frontend: dateTime:", dateTime);
    console.log("Frontend: Description:", description);
    console.log("Frontend: Vorname:", Vorname);
    console.log("Frontend: Nachname:", Nachname);
    console.log("Frontend: Telefon:", Telefon);
    console.log("Frontend: Mail:", Mail);
    console.log("Frontend: Dienstleistung:", Dienstleistung);

    try {
        const response = await fetch('http://localhost:5000/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ duration, dateTime, description, Vorname, Nachname, Telefon, Mail, Dienstleistung})
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
            displayAppointments(allAppointments); // Alle Termine anzeigen
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
            <h3>${app.duration}</h3>
            <p>${new Date(app.dateTime).toLocaleString()}</p> <!-- Datum inkl. Uhrzeit -->
            <p>${app.description}</p>
            <p>${app.Vorname}</p>
            <p>${app.Nachname}</p>
            <p>${app.Telefon}</p>
            <p>${app.Mail}</p>
            <p>${app.Dienstleistung}</p>
            <button onclick="editAppointment('${app._id}')">Bearbeiten</button>
            <button onclick="deleteAppointment('${app._id}')">Löschen</button>
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
                (app.Vorname && app.Vorname.toLowerCase().includes(searchTermLowerCase)) ||
                (app.Nachname && app.Nachname.toLowerCase().includes(searchTermLowerCase)) ||
                (app.Telefon && app.Telefon.toLowerCase().includes(searchTermLowerCase)) ||
                (app.Mail && app.Mail.toLowerCase().includes(searchTermLowerCase))
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
    document.getElementById('Vorname').value = appointment.Vorname;
    document.getElementById('Nachname').value = appointment.Nachname;
    document.getElementById('Telefon').value = appointment.Telefon;
    document.getElementById('Mail').value = appointment.Mail;
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
            Vorname: document.getElementById('Vorname').value,
            Nachname: document.getElementById('Nachname').value,
            Telefon: document.getElementById('Telefon').value,
            Mail: document.getElementById('Mail').value,
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



   