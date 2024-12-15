 // Importiere die Backend-URL (muss am Anfang stehen)
 import { BACKEND_URL } from './config.js';
 


    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
    //KALEDNER
    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
    // Globale Variablen
    let currentDate = new Date();
    let allAppointmentsCalendar = [];

    //speicherung der arbeitszeiten
    let workingHours = {
        montag: {
            active: true,
            morning: { start: '08:00', end: '12:00' },
            afternoon: { start: '13:00', end: '17:00' }
        },
        dienstag: {
            active: true,
            morning: { start: '08:00', end: '12:00' },
            afternoon: { start: '13:00', end: '17:00' }
        },
        mittwoch: {
            active: true,
            morning: { start: '08:00', end: '12:00' },
            afternoon: { start: '13:00', end: '17:00' }
        },
        donnerstag: {
            active: true,
            morning: { start: '08:00', end: '12:00' },
            afternoon: { start: '13:00', end: '17:00' }
        },
        freitag: {
            active: true,
            morning: { start: '08:00', end: '12:00' },
            afternoon: { start: '13:00', end: '17:00' }
        },
        samstag: {
            active: false,
            morning: { start: null, end: null },
            afternoon: { start: null, end: null }
        },
        sonntag: {
            active: false,
            mmorning: { start: null, end: null },
            afternoon: { start: null, end: null }
        }



    };
    
    
        // Hilfsfunktion, um eine Zeitangabe (HH:MM) in Minuten seit Mitternacht umzuwandeln
    function parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Funktion, um zu überprüfen, ob eine gegebene Zeit innerhalb der Arbeitszeiten liegt
    function isWithinWorkingHours(time, dayWorkingHours) {
        // Falls der Tag nicht aktiv ist, sofort false zurückgeben
        if (!dayWorkingHours.active) return false;

        const timeInMinutes = time.getHours() * 60 + time.getMinutes();

        // Prüfen, ob die Zeit innerhalb der Morgenarbeitszeiten liegt
        if (dayWorkingHours.morning.start && dayWorkingHours.morning.end) {
            const morningStart = parseTime(dayWorkingHours.morning.start);
            const morningEnd = parseTime(dayWorkingHours.morning.end);

            if (timeInMinutes >= morningStart && timeInMinutes < morningEnd) {
                return true;
            }
        }

        // Prüfen, ob die Zeit innerhalb der Nachmittagsarbeitszeiten liegt
        if (dayWorkingHours.afternoon.start && dayWorkingHours.afternoon.end) {
            const afternoonStart = parseTime(dayWorkingHours.afternoon.start);
            const afternoonEnd = parseTime(dayWorkingHours.afternoon.end);

            if (timeInMinutes >= afternoonStart && timeInMinutes < afternoonEnd) {
                return true;
            }
        }

        // Wenn die Zeit weder in den Morgen- noch in den Nachmittagsarbeitszeiten liegt, false zurückgeben
        return false;
    }


    function renderCalendar() {
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = ''; // Vorherigen Inhalt löschen
    
        const slots = generateTimeSlots();
        updateSlotAvailability(slots, allAppointments);
    
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
    
        // Erstelle eine Map für schnelle Slot-Suche
        const slotsMap = {};
        slots.forEach(slot => {
            const key = `${slot.dayIndex}-${slot.time.getHours()}-${slot.time.getMinutes()}`;
            slotsMap[key] = slot;
        });
    
        const allTimes = slots.map(slot => slot.time.getHours() * 60 + slot.time.getMinutes());
        const minTime = Math.min(...allTimes);
        const maxTime = Math.max(...allTimes);
    
        const startHour = Math.floor(minTime / 60);
        const endHour = Math.ceil(maxTime / 60);
    
        for (let hour = startHour; hour <= endHour; hour++) {
            const timeLabel = document.createElement('div');
            timeLabel.classList.add('time-slot');
            timeLabel.textContent = (hour < 10 ? '0' + hour : hour) + ':00';
            calendar.appendChild(timeLabel);
    
            for (let i = 0; i < 7; i++) {
                const cell = document.createElement('div');
                cell.classList.add('hour-cell');
                cell.style.position = 'relative';
    
                cell.dataset.dayIndex = i;
                cell.dataset.hour = hour;
    
                const cellContainer = document.createElement('div');
                cellContainer.style.position = 'relative';
                cellContainer.style.height = '100%';
    
                const defaultLength = parseInt(document.getElementById('defaultAppointmentLength').value, 10);
                const slotsPerHour = 60 / defaultLength;
    
                for (let s = 0; s < slotsPerHour; s++) {
                    const minute = s * defaultLength;
                    const key = `${i}-${hour}-${minute}`;
                    const slot = slotsMap[key];
    
                    const slotDiv = document.createElement('div');
                    slotDiv.classList.add('time-slot-div');
                    slotDiv.style.position = 'absolute';
                    slotDiv.style.top = (s * (100 / slotsPerHour)) + '%';
                    slotDiv.style.height = (100 / slotsPerHour) + '%';
                    slotDiv.style.left = '0';
                    slotDiv.style.right = '0';
                    slotDiv.style.zIndex = '1';
    
                    if (slot) {
                        if (slot.isAvailable) {
                            slotDiv.classList.add('available-slot');
                        } else {
                            slotDiv.classList.add('unavailable-slot');
                        }
                    } else {
                        slotDiv.classList.add('unavailable-slot');
                    }
    
                    // Klick-Event hinzufügen
                    slotDiv.addEventListener('click', function () {
                        handleSlotClick(startOfWeek, i, hour, minute, defaultLength);
                    });
    
                    cellContainer.appendChild(slotDiv);
                }
    
                cell.appendChild(cellContainer);
                calendar.appendChild(cell);
            }
        }
    
        displayAppointmentsOnCalendar();
    }
    
    function findOverlappingAppointments(appointments) {
    const overlappingGroups = [];

    appointments.forEach(app => {
        const appStart = new Date(app.dateTime);
        const appEnd = new Date(appStart.getTime() + app.duration * 60000);

        let addedToGroup = false;

        // Überprüfe, ob der Termin zu einer bestehenden Gruppe gehört
        overlappingGroups.forEach(group => {
            for (const existingApp of group) {
                const existingStart = new Date(existingApp.dateTime);
                const existingEnd = new Date(existingStart.getTime() + existingApp.duration * 60000);

                if (appStart < existingEnd && appEnd > existingStart) {
                    group.push(app); // Füge den Termin zur Gruppe hinzu
                    addedToGroup = true;
                    break;
                }
            }
        });

        // Falls keine passende Gruppe gefunden wurde, erstelle eine neue Gruppe
        if (!addedToGroup) {
            overlappingGroups.push([app]);
        }
    });

    return overlappingGroups;
}

// Hilfsfunktion Zeitformat:
function dateToLocalString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}`;
 }
    
    //Anklicken eines Slots öffnet Terminformular
    function handleSlotClick(startOfWeek, dayIndex, hour, minute, defaultLength) {
        const selectedDate = new Date(startOfWeek);
        selectedDate.setDate(startOfWeek.getDate() + dayIndex);
        selectedDate.setHours(hour, minute, 0, 0);
    
        const workingHoursForDay = workingHours[getDayName(selectedDate).toLowerCase()];
    
        let alertMessage = null;
    
        // Arbeitszeitprüfung
        if (!isWithinWorkingHours(selectedDate, workingHoursForDay)) {
            alertMessage = "Achtung Termin befindet sich ausserhalb der definierten Arbeitszeit.";
        }
    
        // Konfliktprüfung
        const overlappingAppointment = allAppointments.some(app => {
            const appStart = new Date(app.dateTime);
            const appEnd = new Date(appStart.getTime() + app.duration * 60000);
            const slotEnd = new Date(selectedDate.getTime() + defaultLength * 60000);
            return (selectedDate < appEnd && appStart < slotEnd);
        });
    
        if (overlappingAppointment) {
            alertMessage = "Achtung Termin überschneidet anderen Termin.";
        }
    
        if (alertMessage) {
            alert(alertMessage);
        }
    
        // Formular öffnen und Felder ausfüllen, unabhängig von Konflikten
        showAppointmentForm();
    
        // Korrekte Zeit setzen
        setLocalDateTimeInput(dateToLocalString(selectedDate));
        document.getElementById('duration').value = defaultLength;
    }
    

    
    
    //Zeitslots für externe Buchungsplattform bereitstellen
    function getAvailableSlotsForExport() {
        const slots = generateTimeSlots();
        updateSlotAvailability(slots, allAppointments);
    
        // Filtern der verfügbaren Slots
        const availableSlots = slots.filter(slot => slot.isAvailable);
    
        // Formatieren der Daten
        return availableSlots.map(slot => {
            return {    
                dateTime: dateToLocalString(slot.time),
                duration: slot.duration
            };
        });
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
    // Global definierte Var
    let clients = []; 
    
        
    // Funktion zum Laden aller Kunden
     async function loadClients() {
        try {
            const response = await fetch(`${BACKEND_URL}/clients`); // Einheitlicher Endpunkt
            if (response.ok) {
                const clients = await response.json(); // Daten laden
                allClients = clients; // Aktualisiere die globale Variable allClients
                displayClients(allClients); // Zeige die Kundenliste an
                console.log('Kunden erfolgreich geladen:', allClients); // Debugging-Log
            } else {
                console.error('Fehler beim Laden der Kunden:', response.statusText);
            }
        } catch (err) {
            console.error('Fehler beim Laden der Kunden:', err.message);
        }
    }


    
    // Beispiel für eine Funktion, die nach dem Laden der Clients aufgerufen wird
    async function initializeAppointments() {
        await loadClients(); // Zuerst Clients laden
        displayAppointmentsOnCalendar(); // Kalender mit Terminen anzeigen
        displayAppointments(allAppointments); // Terminliste anzeigen
    }
    
// Nun kannst du auf die clients-Daten in displayAppointmentsOnCalendar zugreifen:
async function displayAppointmentsOnCalendar() {
    const startOfWeek = getStartOfWeek(currentDate);

    // Lade die Clients nur einmal, falls noch nicht geschehen
    if (!clients || clients.length === 0) {
        const clientsResponse = await fetch(`${BACKEND_URL}/clients`);
        clients = await clientsResponse.json();
    }

    // Filtere Termine der aktuellen Woche
    const appointmentsThisWeek = allAppointments.filter(app => {
        const appStartDate = new Date(app.dateTime);
        return appStartDate >= startOfWeek && appStartDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    });

    // Finde Gruppen überlappender Termine
    const overlappingGroups = findOverlappingAppointments(appointmentsThisWeek);

    // Platziere die Termine
    overlappingGroups.forEach(group => {
        const groupSize = group.length;

        group.forEach((app, index) => {
            const appStartDate = new Date(app.dateTime);
            const appEndDate = new Date(appStartDate.getTime() + app.duration * 60000);
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
                        appointmentDiv.style.width = `${100 / groupSize}%`; // Breite teilen
                        appointmentDiv.style.left = `${(100 / groupSize) * index}%`; // Position basierend auf Index
                        appointmentDiv.style.zIndex = '2';
                       

                        // Erstelle die Icon-Container
                        const iconContainer = document.createElement('div');
                        iconContainer.classList.add('appointment-icons');
                        iconContainer.innerHTML = `
                            <span class="icon edit-icon" title="Bearbeiten">✏️</span>
                            <span class="icon delete-icon" title="Löschen">🗑️</span>
                        `;

                        // Event-Handler für Icons
                        iconContainer.querySelector('.edit-icon').addEventListener('click', () => {
                            editAppointment(app._id); // Bearbeiten-Funktion
                        });
                        iconContainer.querySelector('.delete-icon').addEventListener('click', () => {
                            deleteAppointment(app._id); // Löschen-Funktion
                        });

                        // Inhalte des Termins
                        const clientAppointment = clients.find(client => client.Kundennummer === app.KundennummerzumTermin);
                        const appointmentContent = document.createElement('div');
                        appointmentContent.innerHTML = `
                            <div>
                                ${clientAppointment
                                    ? `<strong>${clientAppointment.Vorname} ${clientAppointment.Nachname}</strong>
                                    <br>
                                    ${app.Preis} ${app.Dienstleistung}`
                                    : "Kunde nicht gefunden"}
                            </div>`;

                        // Füge Icons und Inhalte hinzu
                        appointmentDiv.appendChild(iconContainer);
                        appointmentDiv.appendChild(appointmentContent);

                        // Füge das Termin-Element der ersten Zelle hinzu
                        hourCell.appendChild(appointmentDiv);
                    }
                }
            }
        });
    });

    //Überschneidende Termine identifizieren
    function logOverlappingAppointments() {
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

        const appointmentsThisWeek = allAppointments.filter(app => {
            const appStart = new Date(app.dateTime);
            return appStart >= startOfWeek && appStart < endOfWeek;
        });

        const overlappingAppointments = [];

        // Vergleiche jedes Terminpaar, um Überlappungen zu finden
        for (let i = 0; i < appointmentsThisWeek.length; i++) {
            for (let j = i + 1; j < appointmentsThisWeek.length; j++) {
                const appA = appointmentsThisWeek[i];
                const appB = appointmentsThisWeek[j];

                const startA = new Date(appA.dateTime);
                const endA = new Date(startA.getTime() + appA.duration * 60000);

                const startB = new Date(appB.dateTime);
                const endB = new Date(startB.getTime() + appB.duration * 60000);

                // Prüfen auf Überlappung
                if (startA < endB && startB < endA) {
                    overlappingAppointments.push([appA, appB]);
                }
            }
        }
    }

    // Rufen Sie diese Funktion nach dem Laden der Termine auf
    logOverlappingAppointments();
}




    
    
    
    
    // Aufruf der Initialisierung, um die Daten zu laden und die Kalender- sowie Terminansichten zu aktualisieren
    initializeAppointments();
    

    // Event-Listener für die Wochennavigation
    document.getElementById('prevWeek').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderCalendar();
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderCalendar();
    });


    //Zeitslots für neue Termine und extenre Buchungsplattform / Generierung der Zeit-Slots basierend auf der Standard-Terminlänge
    function generateTimeSlots() {
        const slots = [];
        const startOfWeek = getStartOfWeek(currentDate);
        const defaultLength = parseInt(document.getElementById('defaultAppointmentLength').value, 10);
    
        // Iteriere über die Tage der Woche
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dayName = getDayName(day).toLowerCase();
    
            // Überspringe Tage, die nicht aktiv sind
            if (!workingHours[dayName] || !workingHours[dayName].active) continue;
    
            // Sammle alle Zeitfenster (Morgen und Nachmittag)
            const periods = ['morning', 'afternoon'];
            periods.forEach(period => {
                const start = workingHours[dayName][period].start;
                const end = workingHours[dayName][period].end;
    
                if (start && end) {
                    const startMinutes = parseTime(start);
                    const endMinutes = parseTime(end);
    
                    for (let minutes = startMinutes; minutes + defaultLength <= endMinutes; minutes += defaultLength) {
                        const slotTime = new Date(day);
                        slotTime.setHours(0, minutes, 0, 0);
    
                        slots.push({
                            dayIndex: i,
                            time: slotTime,
                            duration: defaultLength,
                            isAvailable: true // Wird später aktualisiert
                        });
                    }
                }
            });
        }
    
        return slots;
    }
    
    //Verfügbarkeit der Zeit-Slots prüfen
    function updateSlotAvailability(slots, appointments) {
        slots.forEach(slot => {
            const slotStart = slot.time;
            const slotEnd = new Date(slotStart.getTime() + slot.duration * 60000);
    
            // Prüfe, ob der Slot mit einem bestehenden Termin kollidiert
            const conflict = appointments.some(app => {
                const appStart = new Date(app.dateTime);
                const appEnd = new Date(appStart.getTime() + app.duration * 60000);
    
                return (slotStart < appEnd) && (appStart < slotEnd);
            });
    
            if (conflict) {
                slot.isAvailable = false;
            }
        });
    }
    
    document.getElementById('toggleSlotGridLines').addEventListener('click', function () {
        const calendar = document.getElementById('calendar');
        calendar.classList.toggle('hide-slot-lines');
      });
    //====================================================================================================================================      
    //====================================================================================================================================
    //====================================================================================================================================
    //TERMINVERWALTUNG
    //====================================================================================================================================
    //====================================================================================================================================
    // Globale Variablen für die Filterzustände Terminverwaltung
    let filterFutureActive = false;
    let filterPastActive = false;
    
    
    document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
        e.preventDefault(); // Verhindert das Standard-Formular-Verhalten

        
        

        // Variablen definieren:
        const duration = document.getElementById('duration').value;
        const dateTime = document.getElementById('dateTime').value;
        const description = document.getElementById('description').value;
        const KundennummerzumTermin = document.getElementById('KundennummerzumTermin').value;
        const Preis = document.getElementById('Preis').value;
        const Abrechnungsstatus = document.getElementById('Abrechnungsstatus').value;
        const MailAppointment = document.getElementById('MailAppointment').value;
        const Dienstleistung = document.getElementById('Dienstleistung').value;

        // Ausgabe zur Überprüfung
        console.log("Frontend: duration:", duration);
        console.log("Frontend: dateTime:", dateTime);
        console.log("Frontend: Description:", description);
        console.log("Frontend: KundennummerzumTermin:", KundennummerzumTermin);
        console.log("Frontend: Preis:", Preis);
        console.log("Frontend: Abrechnungsstatus:", Abrechnungsstatus);
        console.log("Frontend: MailAppointment:", MailAppointment);
        console.log("Frontend: Dienstleistung:", Dienstleistung);

        try {
            const response = await fetch(`${BACKEND_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ duration, dateTime, description, KundennummerzumTermin, Preis, Abrechnungsstatus, MailAppointment, Dienstleistung})
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
            const response = await fetch(`${BACKEND_URL}/appointments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                allAppointments = await response.json(); // Termine global speichern
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
        const clientsResponse = await fetch(`${BACKEND_URL}/clients`); // Lädt alle Kunden aus der Kunden-Datenbank
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
                        <div>Preis: ${app.Preis || "nicht angegeben"}</div> <!-- C1 -->
                        <div>Status: ${app.Abrechnungsstatus || "nicht angegeben"}</div> <!-- C2 -->
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
    const today = new Date();

    // Zuerst: Termine nach den aktivierten Buttons filtern
    let filteredAppointments = allAppointments.filter(app => {
        const appDate = new Date(app.dateTime);

        // Wenn beide Filter inaktiv sind, alle Termine durchlassen
        if (!filterFutureActive && !filterPastActive) return true;

        // Filterbedingungen anwenden
        if (filterFutureActive && appDate >= today) return true;
        if (filterPastActive && appDate < today) return true;

        return false; // Termin ausschließen, wenn keine Bedingung passt
    });

    // Zweitens: Filterung nach dem Suchbegriff innerhalb der zuvor gefilterten Ergebnisse
    filteredAppointments = filteredAppointments.filter(app => {
        const client = allClients.find(c => c.Kundennummer === app.KundennummerzumTermin);

        // Überprüfen, ob der Suchbegriff in den Kundendaten gefunden wird
        return (
            (client && client.Vorname && client.Vorname.toLowerCase().includes(searchTerm)) ||
            (client && client.Nachname && client.Nachname.toLowerCase().includes(searchTerm)) ||
            (client && client.Strasse && client.Strasse.toLowerCase().includes(searchTerm)) ||
            (client && client.Ort && client.Ort.toLowerCase().includes(searchTerm)) ||
            (client && client.Telefon && client.Telefon.toLowerCase().includes(searchTerm)) ||
            (client && client.Mail && client.Mail.toLowerCase().includes(searchTerm))
        );
    });

    // Sortieren der Ergebnisse nach Nähe zum heutigen Datum
    filteredAppointments.sort((a, b) => {
        const dateA = new Date(a.dateTime);
        const dateB = new Date(b.dateTime);
        return Math.abs(dateA - today) - Math.abs(dateB - today);
    });

    // Gefilterte und sortierte Ergebnisse anzeigen
    displayAppointments(filteredAppointments);
}

    // Event-Listener für die Suche hinzufügen
    document.getElementById('searchAppointment').addEventListener('input', function () {
        filterAppointments();
    });

//Button TERMIN ERSTELLEN
// Funktion zum Anzeigen des Formulars
function showAppointmentForm() {
    const form = document.getElementById('TerminFormular');
    form.style.display = 'block'; // Vor dem Hinzufügen der Klasse sicherstellen, dass es sichtbar ist
    setTimeout(() => {
        form.classList.add('show'); // Klasse für Transition hinzufügen
    }, 10); // Minimaler Delay, um die Transition zu triggern
    document.getElementById('openAppointmentFormButton').style.display = 'none';
}



// Für "Termin erstellen" verwenden
document.getElementById('openAppointmentFormButton').addEventListener('click', showAppointmentForm);



// Funktion zum Ausblenden des Formulars
document.getElementById('CancelAppointmentFormButton').addEventListener('click', function () {
    const form = document.getElementById('TerminFormular');
    form.classList.remove('show'); // Klasse entfernen
    setTimeout(() => {
        form.style.display = 'none'; // Nach der Transition ausblenden
    }, 300); // Delay sollte mit der CSS-Transition-Zeit übereinstimmen
    document.getElementById('openAppointmentFormButton').style.display = 'inline-block';
});




    //Button für Löschen des Termins
    async function deleteAppointment(appointmentId) {
        const confirmation = confirm("Möchtest du diesen Termin wirklich löschen?");
        if (!confirmation) return;
        console.log("Appointment ID to delete: ", appointmentId);


        try {
            const response = await fetch(`${BACKEND_URL}/appointments/${appointmentId}`, {
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
// Funktion zur Konvertierung der UTC-Zeit in das lokale Format für datetime-local (Achtung funktioniert nur online mit NginX korrekt!!!)
// Beispiel: dateTimeLocalStr = "2024-12-18T12:00:00"
function setLocalDateTimeInput(dateTimeLocalStr) {
    const [datePart, timePart] = dateTimeLocalStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    // Erstelle ein Datum in lokaler Zeit, ohne Zeitzonen-Shift
    const date = new Date(year, month - 1, day, hour, minute, second);

    if (isNaN(date)) {
        console.error("Ungültiges Datum:", dateTimeLocalStr);
        return;
    }

    const localDateTime = `${year.toString().padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
    document.getElementById('dateTime').value = localDateTime;
}



// Funktion zum Bearbeiten des Termins

// Für "Bearbeiten"-Button im Termin
async function editAppointment(appointmentId) {
    const appointment = allAppointments.find(app => app._id === appointmentId);
    if (!appointment) {
        alert('Termin nicht gefunden');
        return;
    }

    // Debugging: Prüfe die Kundennummer
    console.log('KundennummerzumTermin:', appointment.KundennummerzumTermin);

    // Hole die Kundendaten basierend auf der Kundennummer
    const customer = clients.find(client => appointment.KundennummerzumTermin === client.Kundennummer);

    if (customer) {
        // Setze die Kundendaten in die entsprechenden `<span>`-Elemente
        const kundenNameField = document.getElementById('KundenName');
        if (kundenNameField) {
            kundenNameField.innerText = `${customer.Vorname} ${customer.Nachname}`;
        }

        const kundenAdresseField = document.getElementById('KundenAdresse');
        if (kundenAdresseField) {
            kundenAdresseField.innerText = `${customer.Strasse} ${customer.Hausnummer}, ${customer.Postleitzahl} ${customer.Ort}`;
        }

        const kundenTelefonField = document.getElementById('KundenTelefon');
        if (kundenTelefonField) {
            kundenTelefonField.innerText = customer.Telefon || 'Nicht verfügbar';
        }

        const kundenMailField = document.getElementById('KundenMail');
        if (kundenMailField) {
            kundenMailField.innerText = customer.Mail || 'Nicht verfügbar';
        }
         
        const kundenNummerDisplayField = document.getElementById('KundennummerzumTerminDisplay');
        if (kundenNummerDisplayField) {
            kundenNummerDisplayField.innerText = String(customer.Kundennummer).padStart(6, '0'); // Kundennummer formatieren (optional)
        }
    } else {
        console.warn('Kundendaten nicht gefunden.');
    }

    // Setze die Termindaten ins Formular
    setLocalDateTimeInput(appointment.dateTime);
    document.getElementById('duration').value = appointment.duration;
    document.getElementById('Dienstleistung').value = appointment.Dienstleistung;
    document.getElementById('Preis').value = appointment.Preis;
    document.getElementById('Abrechnungsstatus').value = appointment.Abrechnungsstatus;
    document.getElementById('description').value = appointment.description;

    // Setze die Kundennummer ins versteckte Feld
    const kundenNummerField = document.getElementById('KundennummerzumTermin');
    if (kundenNummerField) {
        kundenNummerField.value = appointment.KundennummerzumTermin;
    }

    // Formular anzeigen
    showAppointmentForm();

    // Weitere Einstellungen für die Speicherung der Änderungen
    const submitButton = document.querySelector('#appointmentForm button[type="submit"]');
    submitButton.innerText = "Änderungen speichern";
    submitButton.onclick = async function (e) {
        e.preventDefault();

        // Neue Daten sammeln
        const updatedAppointment = {
            KundennummerzumTermin: document.getElementById('KundennummerzumTermin').value,
            dateTime: document.getElementById('dateTime').value,
            duration: document.getElementById('duration').value,
            Dienstleistung: document.getElementById('Dienstleistung').value,
            Preis: document.getElementById('Preis').value,
            Abrechnungsstatus: document.getElementById('Abrechnungsstatus').value,
            description: document.getElementById('description').value,
        };

        try {
            // Termin aktualisieren
            const response = await fetch(`${BACKEND_URL}/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedAppointment)
            });

            if (response.ok) {
                alert('Termin erfolgreich aktualisiert');
                loadAppointments(); // Termine neu laden
                submitButton.innerText = "Termin hinzufügen";
                submitButton.onclick = null;
            } else {
                alert('Fehler beim Aktualisieren des Termins');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    };
}




    //Kundensuche innerhalb der Terminverwaltung:
    // Filtered search results for customer search
    let searchResults = [];

    // Event-Listener für die Kunden-Suche Kundenauswahl
    // Kundensuche Logik bleibt unverändert

    // Kundensuche-Event-Listener für Auswahl des Kunden
    document.getElementById('searchCustomerInput').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        searchResults = allClients
            .filter(client => 
                client.Vorname.toLowerCase().includes(searchTerm) ||
                client.Nachname.toLowerCase().includes(searchTerm) ||
                client.Ort.toLowerCase().includes(searchTerm) ||
                client.Telefon.toLowerCase().includes(searchTerm)
            )
            .slice(0, 5);
        displaySearchResults();
    });





// Event-Listener für den "Vergangenheit"-Filter-Button
document.getElementById('filterPast').addEventListener('click', function () {
    
    filterPastActive = !filterPastActive; // Toggle-Zustand

    // Klasse `.active` je nach Zustand hinzufügen oder entfernen
    if (filterPastActive) {
        this.classList.add('active'); // Klasse hinzufügen, um den aktiven Zustand zu zeigen
        console.log("Filter.activ1");
    } else {
        this.classList.remove('active'); // Klasse entfernen, um den Zustand zurückzusetzen
        console.log("Filter.activ2");
    }
    filterAppointments(); // Filterung erneut ausführen
});

// Event-Listener für den "Zukunfts"-Filter-Button
document.getElementById('filterFuture').addEventListener('click', function () {
    

    filterFutureActive = !filterFutureActive; // Toggle-Zustand

    // Klasse `.active` je nach Zustand hinzufügen oder entfernen
    if (filterFutureActive) {
        this.classList.add('active'); // Klasse hinzufügen, um den aktiven Zustand zu zeigen
        
    } else {
        this.classList.remove('active'); // Klasse entfernen, um den Zustand zurückzusetzen
   }
    filterAppointments(); // Filterung erneut ausführen
});


// Funktion zur Anzeige der Suchergebnisse mit angewendeten Filtern und Sortierung
function displaySearchResults() {
    const searchResultsContainer = document.getElementById('searchClientForApointment'); // Zielcontainer
    searchResultsContainer.innerHTML = ''; // Alte Ergebnisse löschen
    
    // Prüfen, ob es Ergebnisse gibt
    if (appointmentsList.length === 0) {
        console.log("Anzahl der Suchergebnisse:", appointmentsList.length);
        searchResultsContainer.style.display = 'none'; // Container ausblenden, wenn keine Ergebnisse
        return;
    }
    else {
        console.log("Keine suchergebnisse Gefunden, Anzahl der Suchergebnisse:", appointmentsList.length);
    }
        
    // Datum von heute für den Filtervergleich
    const today = new Date();

    // Filter und Sortieren der Suchergebnisse
    let filteredResults = searchResults
        .filter(client => {
            // Wenn beide Filter deaktiviert sind, zeige alle Termine an
            if (!filterFutureActive && !filterPastActive) return true;

            const appointmentDate = new Date(client.dateTime); // Annahme: client hat dateTime-Eigenschaft

            // Filter basierend auf Aktivierung
            if (filterFutureActive && appointmentDate >= today) return true;
            if (filterPastActive && appointmentDate < today) return true;

            return false;
        })
        .sort((a, b) => {
            const dateA = new Date(a.dateTime);
            const dateB = new Date(b.dateTime);
            return Math.abs(dateA - today) - Math.abs(dateB - today); // Sortieren nach Nähe zum heutigen Datum
        });



    // Anzeige der gefilterten und sortierten Ergebnisse
    searchResultsContainer.style.display = 'block'; // Container anzeigen
    filteredResults.forEach(client => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('search-result-item');
        resultItem.textContent = `${client.Vorname} ${client.Nachname}, ${client.Ort}, ${client.Telefon}`;

        // Kundendaten und Auswahl-Logik
        resultItem.addEventListener('click', () => {
            document.getElementById('KundennummerzumTermin').value = client.Kundennummer;
            document.getElementById('KundennummerzumTerminDisplay').textContent = String(client.Kundennummer).padStart(6, '0');
            document.getElementById('KundenName').textContent = `${client.Vorname} ${client.Nachname}`;
            document.getElementById('KundenAdresse').textContent = `${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}`;
            document.getElementById('KundenTelefon').textContent = client.Telefon;
            document.getElementById('KundenMail').textContent = client.Mail;
            searchResultsContainer.innerHTML = ''; // Ergebnisse leeren
            searchResultsContainer.style.display = 'none'; // Container ausblenden
            document.getElementById('searchCustomerInput').value = ''; // Eingabefeld zurücksetzen
        });

        searchResultsContainer.appendChild(resultItem);
    });
}

    // Event-Listener für das Eingabefeld und die Escape-Taste
    document.getElementById('searchCustomerInput').addEventListener('input', function() {
        if (this.value.trim() === '') {
            // Bei leerem Eingabefeld die Ergebnisse ausblenden
            document.getElementById('searchClientForApointment').style.display = 'none';
        } else {
            // Hier sollten die neuen Suchergebnisse geladen und angezeigt werden
            displaySearchResults();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            // Escape-Taste schließt das Suchergebnisfenster
            const searchResultsContainer = document.getElementById('searchClientForApointment');
            searchResultsContainer.style.display = 'none';
            searchResultsContainer.innerHTML = ''; // Optional: Inhalte leeren
            document.getElementById('searchCustomerInput').value = ''; // Optional: Eingabefeld zurücksetzen
        }
    });
    
    
    // Submit-Event-Listener für das Terminformular
    document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        // Termin-Daten sammeln
        const KundennummerzumTermin = document.getElementById('KundennummerzumTermin').value;
        const dateTime = document.getElementById('dateTime').value;
        const duration = document.getElementById('duration').value;
        const Dienstleistung = document.getElementById('Dienstleistung').value;
        const Preis = document.getElementById('Preis').value;
        const Abrechnungsstatus = document.getElementById('Abrechnungsstatus').value;
        const description = document.getElementById('description').value;

        try {
            const response = await fetch(`${BACKEND_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ KundennummerzumTermin, dateTime, duration, Dienstleistung, Preis, Abrechnungsstatus, description })
            });

            if (response.ok) {
                alert('Termin erfolgreich hinzugefügt!');
                loadAppointments();
            } else {
                alert('Fehler beim Hinzufügen des Termins');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    });
    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
    //CLIENT-MANAGEMENT
    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
    
    // Kundenformular und Terminformular beim Laden der Seite ausblenden
    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('kundenFormular').style.display = 'none';
});

    
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
            const response = await fetch(`${BACKEND_URL}/clients`, {
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


    // Funktion zum Anzeigen der Kundenliste
    function displayClients(clients) {
        console.log('Anzuzeigende Kunden:', clients); // Logge die Kunden
        const clientsList = document.getElementById('clientsList');
        console.log(clientsList);
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
        console.log("KundenlisteLOG");    
    }
    
    console.log('allClients' + allClients); // Logge die tatsächliche Kundenliste



// Button KUNDEN ANLEGEN
function showClientForm() {
    const form = document.getElementById('kundenFormular');
    form.classList.remove('hidden'); // Entfernt den Zustand "komplett unsichtbar"
    form.style.display = 'block'; // Sichtbar machen
    setTimeout(() => {
        form.classList.add('show'); // Fügt die Transition ein
    }, 10); // Leichter Delay, damit die Transition greift
    document.getElementById('openClientFormButton').style.display = 'none'; // Button ausblenden
}



// Funktion zum Ausblenden des Formulars
document.getElementById('cancelClientFormButton').addEventListener('click', function () {
    const form = document.getElementById('kundenFormular');
    const openButton = document.getElementById('openClientFormButton');

    // Button "Kunden anlegen" direkt sichtbar machen
    openButton.style.display = 'inline-block';

    // Smooth das Formular schließen
    form.classList.remove('show');
    setTimeout(() => {
        form.classList.add('hidden'); // Versteckt das Formular komplett
        form.style.display = 'none';
    }, 300); // Nach Abschluss der Transition ausblenden
});


// Für "Termin erstellen" -->Formular öffnen
document.getElementById('openClientFormButton').addEventListener('click', showClientForm);


    // Kunden bearbeiten
    async function editClient(clientId) {
        showClientForm();    
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
                
            };

            try {
                const response = await fetch(`${BACKEND_URL}/clients/${clientId}`, {
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
            const response = await fetch(`${BACKEND_URL}/clients/${clientId}`, { method: 'DELETE' });
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
    const searchClientInput = document.getElementById('searchClient');
    if (!searchClientInput) {
        console.error("Das Element mit der ID 'searchClient' wurde nicht gefunden!");
    } else {
        searchClientInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredClients = allClients.filter(client =>
                client.Vorname.toLowerCase().includes(searchTerm) ||
                client.Nachname.toLowerCase().includes(searchTerm) ||
                client.Telefon.toLowerCase().includes(searchTerm) ||
                client.Mail.toLowerCase().includes(searchTerm)
            );
            console.log('Gefilterte Kunden:', filteredClients);
            displayClients(filteredClients);
        });
    }


    document.addEventListener('DOMContentLoaded', function() {
        loadAppointments();
        loadClients();
    });



    // Kundenliste laden und Suchfeld initialisieren beim Start
    document.addEventListener('DOMContentLoaded', function() {
        loadAppointments();
        loadClients();  // AllClients wird hier geladen
    });


    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
    //EINSTELLUNGEN
    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
    
    // Arbeitszeiten speichern: Event-Listener für den "Speichern"-Button hinzufügen
    document.getElementById('saveWorkingHours').addEventListener('click', saveWorkingHours);


    function saveWorkingHours() {
        const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    
        days.forEach(day => {
            const active = document.getElementById(`${day}Active`).checked;
            const morningStart = document.getElementById(`${day}MorningStart`).value;
            const morningEnd = document.getElementById(`${day}MorningEnd`).value;
            const afternoonStart = document.getElementById(`${day}AfternoonStart`).value;
            const afternoonEnd = document.getElementById(`${day}AfternoonEnd`).value;
    
            workingHours[day] = {
                active: active,
                morning: { start: morningStart, end: morningEnd },
                afternoon: { start: afternoonStart, end: afternoonEnd }
            };
        });
    
        // Arbeitszeiten in localStorage speichern
        localStorage.setItem('workingHours', JSON.stringify(workingHours));
    
        // Kalender neu rendern
        renderCalendar();
    }
    
    function loadWorkingHours() {
        const savedHours = localStorage.getItem('workingHours');
        if (savedHours) {
            workingHours = JSON.parse(savedHours);
        }
    
        const days = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
        days.forEach(day => {
            if (workingHours[day]) {
                document.getElementById(`${day}Active`).checked = workingHours[day].active;
                document.getElementById(`${day}MorningStart`).value = workingHours[day].morning.start;
                document.getElementById(`${day}MorningEnd`).value = workingHours[day].morning.end;
                document.getElementById(`${day}AfternoonStart`).value = workingHours[day].afternoon.start;
                document.getElementById(`${day}AfternoonEnd`).value = workingHours[day].afternoon.end;
            } else {
                console.warn(`Arbeitszeiten für ${day} sind nicht definiert.`);
                // Optional: Setze Standardwerte oder behandle den Fehler entsprechend
            }
        });
    }
    
    
    // Beim Laden der Seite aufrufen
    document.addEventListener('DOMContentLoaded', function() {
        loadWorkingHours();
    });
    
    
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


   
