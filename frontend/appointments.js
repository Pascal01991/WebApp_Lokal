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


   