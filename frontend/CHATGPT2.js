async function displayAppointmentsOnCalendar() {
    const startOfWeek = getStartOfWeek(currentDate);

    // Lade die Clients nur einmal, falls noch nicht geschehen
    if (!clients || clients.length === 0) {
        const clientsResponse = await fetch('http://localhost:5000/api/clients');
        clients = await clientsResponse.json();
    }

    allAppointments.forEach(app => {
        const appStartDate = new Date(app.dateTime);
        const appEndDate = new Date(appStartDate.getTime() + app.duration * 60000);

        if (appStartDate >= startOfWeek && appStartDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            const dayIndex = (appStartDate.getDay() + 6) % 7; // Montag=0, Sonntag=6

            const startHour = appStartDate.getHours();
            const endHour = appEndDate.getHours();

            for (let hour = startHour; hour <= endHour; hour++) {
                const calendar = document.getElementById('calendar');
                const cellSelector = `.hour-cell[data-day-index='${dayIndex}'][data-hour='${hour}']`;
                const hourCell = calendar.querySelector(cellSelector);

                if (hourCell) {
                    if (hour === startHour) {
                        // Erstelle das Termin-Element nur einmal in der ersten Stunde
                        const appointmentDiv = document.createElement('div');
                        appointmentDiv.classList.add('appointment');
                        appointmentDiv.setAttribute('data-app-id', app._id);

                        // Berechne die Dauer in Stunden
                        const durationHours = (appEndDate.getTime() - appStartDate.getTime()) / (60 * 60 * 1000);

                        // Setze CSS-Eigenschaften für das Termin-Element
                        appointmentDiv.style.gridRow = `span ${Math.ceil(durationHours)}`;
                        appointmentDiv.style.top = `${(appStartDate.getMinutes() / 60) * 100}%`;
                        appointmentDiv.style.height = `${durationHours * 100}%`;
                        appointmentDiv.style.zIndex = '2';

                        // Inhalte des Termins
                        const clientAppointment = clients.find(client => client.Kundennummer === app.KundennummerzumTermin);
                        appointmentDiv.innerHTML = `
                            <div>
                                ${clientAppointment
                                    ? `<strong>${clientAppointment.Vorname} ${clientAppointment.Nachname}</strong>
                                    <br>
                                    ${app.Preis} ${app.Dienstleistung}`
                                    : "Kunde nicht gefunden"}
                            </div>`;

                        // Füge das Termin-Element der ersten Zelle hinzu
                        hourCell.appendChild(appointmentDiv);
                    }
                }
            }
        }
        //Funktion um Überlappende Termine zu identifizieren
        function calculateOverlappingAppointments(appointments) {
            appointments.forEach(app1 => {
                const overlappingApps = appointments.filter(app2 => {
                    const app1Start = new Date(app1.dateTime);
                    const app1End = new Date(app1Start.getTime() + app1.duration * 60000);
                    const app2Start = new Date(app2.dateTime);
                    const app2End = new Date(app2Start.getTime() + app2.duration * 60000);
                    return app1 !== app2 && (app1Start < app2End && app2Start < app1End);
                });
        
                app1.overlapCount = overlappingApps.length + 1;
                app1.overlapIndex = overlappingApps.filter(app2 => new Date(app2.dateTime) < new Date(app1.dateTime)).length;
            });
        }
        
    });
}