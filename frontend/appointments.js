document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Verhindert das Standard-Formular-Verhalten

    // Variablen definieren
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;

    // Ausgabe zur Überprüfung
    console.log("Frontend: Title:", title);
    console.log("Frontend: Date:", date);
    console.log("Frontend: Description:", description);

    try {
        const response = await fetch('http://localhost:5000/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, date, description })
        });

        if (response.ok) {
            alert('Termin erfolgreich hinzugefügt!');
        } else {
            alert('Fehler beim Hinzufügen des Termins');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
});
  
  // Termine abrufen und anzeigen
  async function loadAppointments() {
    try {
        const response = await fetch('http://localhost:5000/api/appointments', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
  
        if (response.ok) {
            const appointments = await response.json();
            console.log(appointments); // Debugging-Log
            const appointmentsList = document.getElementById('appointmentsList');
            appointmentsList.innerHTML = appointments.map(app => `
                <div>
                    <h3>${app.title}</h3>
                    <p>${new Date(app.date).toLocaleString()}</p>
                    <p>${app.description}</p>
                </div>
            `).join('');
        } else {
            alert('Fehler beim Laden der Termine');
            console.error('Fehler beim Laden der Termine');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
  }
  
  // Termine laden, wenn das Dashboard geladen wird
  window.onload = function() {
    loadAppointments();
};

gapi.client.calendar.freebusy.query({
    timeMin: '2024-10-09T09:00:00-07:00',  // Startzeit
    timeMax: '2024-10-09T17:00:00-07:00',  // Endzeit
    items: [{ id: 'primary' }]
  }).then(function (response) {
    var busyTimes = response.result.calendars.primary.busy;
    // Hier die freien Slots berechnen
    var freeSlots = berechneFreieSlots(busyTimes);
    zeigeFreieSlotsImKalender(freeSlots);
  });
  function bucheTermin(startTime, endTime) {
    var event = {
      summary: 'Gebuchter Termin',
      start: {
        dateTime: startTime,
        timeZone: 'Europe/Berlin'
      },
      end: {
        dateTime: endTime,
        timeZone: 'Europe/Berlin'
      }
    };
  
    gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    }).then(function (event) {
      alert('Termin gebucht: ' + event.htmlLink);
    });
  }
  
  function zeigeFreieSlotsImKalender(freeSlots) {
    var events = freeSlots.map(slot => {
        return {
            title: 'Freier Slot',
            start: slot.startTime,
            end: slot.endTime,
            color: 'green' // Freie Slots grün markieren
        };
    });
    calendar.addEventSource(events);
}
