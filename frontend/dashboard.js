 // Importiere die Backend-URL (muss am Anfang stehen)
 import { BACKEND_URL } from './config.js';
 


 
    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
    //ALLGMEIN BENÖTIGTE ELEMENTE
    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
   

// Funktion zum Bearbeiten des Termins

// Für "Bearbeiten"-Button im Termin


async function editAppointment(appointmentId) {
    // 1) Button "Termin erstellen" ausblenden
    openAppointmentFormButton.style.display = 'none';

    // 2) Terminobjekt finden
    const appointment = allAppointments.find(app => app._id === appointmentId);
    if (!appointment) {
        alert('Termin nicht gefunden');
        return;
    }

    // 3) Formularfelder für den Termin befüllen
    document.getElementById('KundennummerzumTermin').value = appointment.KundennummerzumTermin || '';

    // Start & Endzeit ins datetime-local-Feld packen
    setLocalDateTimeInput(appointment.startDateTime, 'startDateTime');
    setLocalDateTimeInput(appointment.endDateTime,   'endDateTime');

    // Falls `appointment.duration` in Minuten kommt, verteilen auf Stunden/Minuten
    const totalMinutes = parseInt(appointment.duration, 10) || 0;
    document.getElementById('durationHours').value = Math.floor(totalMinutes / 60);
    document.getElementById('durationMinutes').value = totalMinutes % 60;

    document.getElementById('Dienstleistung').value = appointment.Dienstleistung || '';
    document.getElementById('Preis').value = appointment.Preis || '';
    document.getElementById('Abrechnungsstatus').value = appointment.Abrechnungsstatus || '';
    document.getElementById('description').value = appointment.description || '';

    document.getElementById('erfasstDurch').value = appointment.erfasstDurch || '';
    document.getElementById('letzterBearbeiter').value = appointment.letzterBearbeiter || '';
    document.getElementById('Ressource').value = appointment.Ressource || '';
    document.getElementById('projektId').value = appointment.projektId || '';
    document.getElementById('verrechnungsTyp').value = appointment.verrechnungsTyp || '';
    document.getElementById('erbringungsStatus').value = appointment.erbringungsStatus || '';
    document.getElementById('rechnungsEmpfaengerNummer').value = appointment.rechnungsEmpfaengerNummer || '';
    document.getElementById('fakturaNummer').value = appointment.fakturaNummer || '';
    document.getElementById('fakturaBemerkung').value = appointment.fakturaBemerkung || '';
    

    // 4) Den zugehörigen Kunden suchen und Kundendaten befüllen
    const client = allClients.find(c => c.Kundennummer === appointment.KundennummerzumTermin);
    if (client) {
        document.getElementById('KundennummerzumTermin').value = client.Kundennummer;
        document.getElementById('KundennummerzumTerminDisplay').textContent = String(client.Kundennummer).padStart(6, '0');
        document.getElementById('KundenName').textContent = `${client.Vorname} ${client.Nachname}`;
        document.getElementById('KundenAdresse').textContent = `${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}`;
        document.getElementById('KundenTelefon').textContent = client.Telefon || '';
        document.getElementById('KundenMail').textContent = client.Mail || '';
    } else {
        document.getElementById('KundenName').textContent = 'Kunde nicht gefunden';
        document.getElementById('KundenAdresse').textContent = '';
        document.getElementById('KundenTelefon').textContent = '';
        document.getElementById('KundenMail').textContent = '';
    }

     // 4.5 RechnungsEmpfänger Daten laden
     document.getElementById('rechnungsEmpfaengerNummer').value 
     = appointment.rechnungsEmpfaengerNummer || '';

    // Falls du die <span>-Felder hast
    // => Display-Nummer direkt befüllen, z.B.:
    if (appointment.rechnungsEmpfaengerNummer) {
        // Suche den passenden Client
        const recClient = allClients.find(c => c.Kundennummer === appointment.rechnungsEmpfaengerNummer);

        // Block einblenden
        const block = document.getElementById('abweichenderRechnungsempfaengerBlock');
        if (block) block.style.display = 'block';

        if (recClient) {
            document.getElementById('RechnungsempfaengerNummerDisplay').textContent 
                = String(recClient.Kundennummer).padStart(6, '0');
            document.getElementById('RechnungsempfaengerName').textContent 
                = `${recClient.Vorname} ${recClient.Nachname}`;
            document.getElementById('RechnungsempfaengerAdresse').textContent 
                = `${recClient.Strasse} ${recClient.Hausnummer}, ${recClient.Postleitzahl} ${recClient.Ort}`;
            document.getElementById('RechnungsempfaengerTelefon').textContent 
                = recClient.Telefon;
            document.getElementById('RechnungsempfaengerMail').textContent 
                = recClient.Mail;
        } else {
            // Falls die Nummer nicht zu einem bekannten Client passt
            document.getElementById('RechnungsempfaengerNummerDisplay').textContent = '';
            document.getElementById('RechnungsempfaengerName').textContent = 'Nicht gefunden';
            document.getElementById('RechnungsempfaengerAdresse').textContent = '';
            document.getElementById('RechnungsempfaengerTelefon').textContent = '';
            document.getElementById('RechnungsempfaengerMail').textContent = '';
        }
    } else {
        // Falls keine rechnungsEmpfaengerNummer => Block ausblenden
        document.getElementById('abweichenderRechnungsempfaengerBlock').style.display = 'none';
        document.getElementById('RechnungsempfaengerNummerDisplay').textContent = '';
        document.getElementById('RechnungsempfaengerName').textContent = '';
        document.getElementById('RechnungsempfaengerAdresse').textContent = '';
        document.getElementById('RechnungsempfaengerTelefon').textContent = '';
        document.getElementById('RechnungsempfaengerMail').textContent = '';
    }

    // 5) Formular anzeigen (Edit-Modus)
    showAppointmentForm(true);

    // 6) Button "Änderungen speichern" (PUT) neu binden
    const submitButton = appointmentForm.querySelector('button[type="submit"]');
    submitButton.replaceWith(submitButton.cloneNode(true));  // Event-Listener entfernen
    const newSubmitButton = appointmentForm.querySelector('button[type="submit"]');
    newSubmitButton.innerText = 'Änderungen speichern';
    newSubmitButton.addEventListener('click', async (e) => {
        e.preventDefault();

        // Neue Start- und Endzeit auslesen
        const startVal = document.getElementById('startDateTime').value;  // z.B. "2025-01-02T10:00"
        const endVal   = document.getElementById('endDateTime').value;    // z.B. "2025-01-02T11:30"

        // Dauer in Stunden/Minuten => Gesamtminuten
        const hours = parseInt(document.getElementById('durationHours').value, 10) || 0;
        const mins  = parseInt(document.getElementById('durationMinutes').value, 10) || 0;
        const totalDuration = hours * 60 + mins;

        const updatedAppointment = {
            KundennummerzumTermin: document.getElementById('KundennummerzumTermin').value,
            startDateTime: startVal,
            endDateTime: endVal,
            duration: totalDuration,
            Dienstleistung: document.getElementById('Dienstleistung').value,
            Preis: document.getElementById('Preis').value,
            Abrechnungsstatus: document.getElementById('Abrechnungsstatus').value,
            description: document.getElementById('description').value,
            erfasstDurch: document.getElementById('erfasstDurch').value,
            letzterBearbeiter: document.getElementById('letzterBearbeiter').value,
            Ressource: document.getElementById('Ressource').value,
            projektId: document.getElementById('projektId').value,
            verrechnungsTyp: document.getElementById('verrechnungsTyp').value,
            erbringungsStatus: document.getElementById('erbringungsStatus').value,
            rechnungsEmpfaengerNummer: document.getElementById('rechnungsEmpfaengerNummer').value,
            fakturaNummer: document.getElementById('fakturaNummer').value,
            fakturaBemerkung: document.getElementById('fakturaBemerkung').value
        };

        try {
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
                hideAppointmentForm();
                loadAppointments(); 
            } else {
                alert('Fehler beim Aktualisieren des Termins');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    });
}



    //Button für Löschen des Termins
    async function deleteAppointment(appointmentId) {
        if (!confirm("Möchten Sie diesen Termin wirklich löschen?")) return;
    
        try {
            const response = await fetch(`${BACKEND_URL}/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
    
            if (response.ok) {
                alert('Termin erfolgreich gelöscht');
                loadAppointments();
            } else {
                alert('Fehler beim Löschen des Termins');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    }

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
    let workingHours = {            //Später aus DB
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
    
    ///Diese Fumktion haben wir ins Backend kopiert, hier kann die später wohl rausgelöscht werden
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

    async function fetchAvailableSlots() {
        try {
            const response = await fetch(`${BACKEND_URL}/availability/slots?currentDate=${currentDate.toISOString()}`);
            if (!response.ok) {
                throw new Error(`Fehler beim Laden der Slots: ${response.statusText}`);
            }
            const slots = await response.json();
            
            return slots;
        } catch (error) {
            console.error('Fehler beim Abrufen der Slots:', error);
            return [];
        }
    }
    


    

    async function renderCalendar() {
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';
    
        // Slots asynchron vom Backend laden
        const slots = await fetchAvailableSlots();
        if (!slots.length) {
            console.warn('Keine Slots zum Anzeigen gefunden.');
            return;
        }
    
        const startOfWeek = getStartOfWeek(currentDate);
    
        // Tagesüberschriften erstellen
        calendar.appendChild(document.createElement('div')); // Leere Ecke
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header');
            dayHeader.textContent = getDayName(day) + ', ' + formatDate(day);
            calendar.appendChild(dayHeader);
        }
    
        // Map für Slots
        const slotsMap = {};
        slots.forEach(slot => {
            // Annahme: slot.startDateTime oder slot.dateTime
            // Hier belassen wir "slot.dateTime" nur, wenn das Backend so heißt:
            const date = new Date(slot.startDateTime);
            const hour = date.getHours();
            const minute = date.getMinutes();
            const key = `${slot.dayIndex}-${hour}-${minute}`;
            slotsMap[key] = slot;
        });
    
        const allTimes = slots.map(slot => {
            const date = new Date(slot.startDateTime);
            return date.getHours() * 60 + date.getMinutes();
        });
    
        const minTime = Math.min(...allTimes);
        const maxTime = Math.max(...allTimes);
    
        const startHour = Math.floor(minTime / 60);
        const endHour = Math.ceil(maxTime / 60);
console.log('startHour:'+ startHour);
        const defaultLength = parseInt(document.getElementById('defaultAppointmentLength').value, 10);
        const slotsPerHour = 60 / defaultLength;
    console.log('rendercalendar')
        for (let hour = startHour; hour <= endHour; hour++) {
console.log('for schleife hour ++')
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
                        if (slot.isHoliday) {
                            slotDiv.classList.add('unavailable-holiday');
                        } else if (slot.isAvailable) {
                            slotDiv.classList.add('available-slot');
                        } else {
                            slotDiv.classList.add('unavailable-slot');
                        }
                    } else {
                        slotDiv.classList.add('unavailable-slot');
                    }
    
                    // Klick-Event
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
            const appStart = new Date(app.startDateTime);
            const appEnd = new Date(appStart.getTime() + app.duration * 60000);
    
            let addedToGroup = false;
    
            // Überprüfe, ob der Termin zu einer bestehenden Gruppe gehört
            overlappingGroups.forEach(group => {
                for (const existingApp of group) {
                    const existingStart = new Date(existingApp.startDateTime);
                    const existingEnd = new Date(existingStart.getTime() + existingApp.duration * 60000);
    
                    if (appStart < existingEnd && appEnd > existingStart) {
                        group.push(app);
                        addedToGroup = true;
                        break;
                    }
                }
            });
    
            // Falls keine passende Gruppe gefunden wurde, erstelle eine neue
            if (!addedToGroup) {
                overlappingGroups.push([app]);
            }
        });
    
        return overlappingGroups;
    }
    

///Diese Fumktion haben wir ins Backend kopiert, hier kann die später wohl rausgelöscht werden
//Nach nochmaliger Nachfrage diese Funktion vermutlich besser nur im Backend!
// // Hilfsfunktion Zeitformat:
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
        
        clearAppointmentForm();
        console.log('clearaufgeführt')
        // Arbeitszeitprüfung
        if (!isWithinWorkingHours(selectedDate, workingHoursForDay)) {
            alertMessage = "Achtung Termin befindet sich ausserhalb der definierten Arbeitszeit.";
        }
    
        // Konfliktprüfung
        const overlappingAppointment = allAppointments.some(app => {
            const appStart = new Date(app.startDateTime);
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
    
        // Formular öffnen und Felder ausfüllen
        showAppointmentForm();
    
        // Startzeit in das Feld packen:
        // Hier wandeln wir "selectedDate" in "YYYY-MM-DDTHH:mm" um:
        const localDateTimeStr = dateToLocalString(selectedDate);  // -> z.B. "2025-01-02T09:15"
        document.getElementById('startDateTime').value = localDateTimeStr;
    
        // Endtermin optional leer oder fix
        document.getElementById('endDateTime').value = '';
    
        // Dauer-Default in Stunden/Minuten
        const defHours = Math.floor(defaultLength / 60);
        const defMins = defaultLength % 60;
        document.getElementById('durationHours').value = defHours;
        document.getElementById('durationMinutes').value = defMins;
    }
    

    
    
    
///Diese Fumktion haben wir ins Backend kopiert, hier kann die später wohl rausgelöscht werden
    // Funktion, um den Start der Woche (Montag) zu erhalten
    function getStartOfWeek(date) {
        const day = date.getDay(); // 0 (So) bis 6 (Sa)
        const diff = (day === 0 ? -6 : 1 - day); // Anpassen, wenn Tag Sonntag ist
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    }
    
    ///Diese Fumktion haben wir ins Backend kopiert, hier kann die später wohl rausgelöscht werden
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
            const response = await fetch(`${BACKEND_URL}/clients`);
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Kunden');
            }
            allClients = await response.json();
            displayClients(allClients);
        } catch (err) {
            alert('Fehler: ' + err.message);
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
        const appStartDate = new Date(app.startDateTime);
        return appStartDate >= startOfWeek && 
               appStartDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
               
    });
    console.log(appointmentsThisWeek.length);
    console.log (appointmentsThisWeek);
    // Finde Gruppen überlappender Termine
    const overlappingGroups = findOverlappingAppointments(appointmentsThisWeek);

    // Platziere die Termine
    overlappingGroups.forEach(group => {
        const groupSize = group.length;

        group.forEach((app, index) => {
            // Start/End aus DB
            const appStartDate = new Date(app.startDateTime);
            let appEndDate;
            if (app.endDateTime) {
                // Falls im DB-Eintrag bereits endDateTime existiert
                appEndDate = new Date(app.endDateTime);
            } else {
                // Sonst fallback: start + duration
                appEndDate = new Date(appStartDate.getTime() + app.duration * 60000);
            }
console.log('forEach')
            const dayIndex = (appStartDate.getDay() + 6) % 7; // Montag=0, Sonntag=6
console.log(appStartDate)
            const startHour = appStartDate.getHours();
            const endHour = appEndDate.getHours();

            for (let hour = startHour; hour <= endHour; hour++) {
                const calendar = document.getElementById('calendar');
                const cellSelector = `.hour-cell[data-day-index='${dayIndex}'][data-hour='${hour}']`;
                const hourCell = calendar.querySelector(cellSelector);
                
console.log('for Schleife let hour');

                if (hourCell) {
                    console.log(hourCell);
                    console.log('if HourCell');
                    if (hour === startHour) 
                        {
                            console.log('if hour === startHour');
                        // Nur einmal "drawen" in der ersten Stunde
                        const appointmentDiv = document.createElement('div');
                        appointmentDiv.classList.add('appointment');
                        appointmentDiv.setAttribute('data-app-id', app._id);

                        // Berechne die Gesamtstunden zwischen Start & Ende
                        const durationHours = (appEndDate.getTime() - appStartDate.getTime()) / (60 * 60 * 1000);

                        // CSS
                        appointmentDiv.style.gridRow = `span ${Math.ceil(durationHours)}`;
                        appointmentDiv.style.top = `${(appStartDate.getMinutes() / 60) * 100}%`;
                        appointmentDiv.style.height = `${durationHours * 100}%`;
                        appointmentDiv.style.width = `${100 / groupSize}%`;
                        appointmentDiv.style.left = `${(100 / groupSize) * index}%`;
                        appointmentDiv.style.zIndex = '2';

                        // Icons
                        const iconContainer = document.createElement('div');
                        iconContainer.classList.add('appointment-icons');
                        iconContainer.innerHTML = `
                            <span class="icon edit-icon" title="Bearbeiten">✏️</span>
                            <span class="icon delete-icon" title="Löschen">🗑️</span>
                        `;
                        iconContainer.querySelector('.edit-icon').addEventListener('click', () => {
                            editAppointment(app._id);
                        });
                        iconContainer.querySelector('.delete-icon').addEventListener('click', () => {
                            deleteAppointment(app._id);
                        });

                        // Inhalte
                        const clientAppointment = clients.find(client => client.Kundennummer === app.KundennummerzumTermin);
                        const appointmentContent = document.createElement('div');
                        appointmentContent.innerHTML = `
                            <div>
                                ${clientAppointment
                                    ? `<strong>${clientAppointment.Vorname} ${clientAppointment.Nachname}</strong>
                                       <br>
                                       ${app.Preis} ${app.Dienstleistung}`
                                    : "Kunde nicht gefunden"
                                }
                            </div>`;

                        appointmentDiv.appendChild(iconContainer);
                        appointmentDiv.appendChild(appointmentContent);

                        hourCell.appendChild(appointmentDiv);
                        console.log('ifHour_true')
                    }
                    else {
                        console.log('ifHour_false');
                    }
                }
                
            }
        });
    });

    // Interne Funktion zur Erkennung von Überschneidungen:
    function logOverlappingAppointments() {
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

        const appointmentsThisWeek = allAppointments.filter(app => {
            const appStart = new Date(app.startDateTime);
            return appStart >= startOfWeek && appStart < endOfWeek;
        });

        const overlappingAppointments = [];

        for (let i = 0; i < appointmentsThisWeek.length; i++) {
            for (let j = i + 1; j < appointmentsThisWeek.length; j++) {
                const appA = appointmentsThisWeek[i];
                const appB = appointmentsThisWeek[j];

                const startA = new Date(appA.startDateTime);
                const endA = appA.endDateTime
                    ? new Date(appA.endDateTime)
                    : new Date(startA.getTime() + appA.duration * 60000);

                const startB = new Date(appB.startDateTime);
                const endB = appB.endDateTime
                    ? new Date(appB.endDateTime)
                    : new Date(startB.getTime() + appB.duration * 60000);

                // Prüfen auf Überlappung
                if (startA < endB && startB < endA) {
                    overlappingAppointments.push([appA, appB]);
                }
            }
        }
    }

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
    /**************************************************************
 * GLOBALE VARIABLEN: Filterzustände, Terminliste
 **************************************************************/
let filterFutureActive = false;
let filterPastActive = false;
let allAppointments = []; // Termine global speichern
// Falls benötigt: let allClients = []; // schon in deinem Code definiert?

/**************************************************************
 * NEUE STRUKTUR FÜR DAS APPOINTMENT-FORMULAR
 **************************************************************/
// Referenzen auf DOM-Elemente
const appointmentFormContainer = document.getElementById('TerminFormular');
const appointmentForm = document.getElementById('appointmentForm');
const openAppointmentFormButton = document.getElementById('openAppointmentFormButton');
const cancelAppointmentFormButton = document.getElementById('CancelAppointmentFormButton');

/**
 * (A) Formular-Felder leeren,
 *     inkl. Kundendaten (Kundennummer, Name, Adresse usw.).
 */
function clearAppointmentForm() { 
    document.getElementById('KundennummerzumTermin').value = '';
    document.getElementById('KundennummerzumTerminDisplay').textContent = '';
    document.getElementById('KundenName').textContent = '';
    document.getElementById('KundenAdresse').textContent = '';
    document.getElementById('KundenTelefon').textContent = '';
    document.getElementById('KundenMail').textContent = '';

    document.getElementById('rechnungsEmpfaengerNummer').value = '';
    document.getElementById('RechnungsempfaengerName').textContent = '';
    document.getElementById('RechnungsempfaengerAdresse').textContent = '';
    document.getElementById('RechnungsempfaengerTelefon').textContent = '';
    document.getElementById('RechnungsempfaengerMail').textContent = '';

    // Neu statt dateTime
    document.getElementById('startDateTime').value = '';
    document.getElementById('endDateTime').value = '';

    // Neu statt duration
    document.getElementById('durationHours').value = '0';
    document.getElementById('durationMinutes').value = '0';

    document.getElementById('Dienstleistung').value = '';
    document.getElementById('Preis').value = '';
    document.getElementById('Abrechnungsstatus').value = '';
    document.getElementById('description').value = '';

    document.getElementById('letzterBearbeiter').value = '';
    document.getElementById('Ressource').value = '';

    document.getElementById('erfasstDurch').value = '';
    document.getElementById('projektId').value = '';
    document.getElementById('verrechnungsTyp').value = '-- bitte wählen --';
    document.getElementById('erbringungsStatus').value = '-- bitte wählen --';
    document.getElementById('fakturaBemerkung').value = '';
    document.getElementById('fakturaNummer').value = '';
    
    console.log('formular geleert')
}


/**
 * (B) Formular anzeigen (Unterschied: Neu vs. Edit)
 * @param {boolean} [isEditMode=false] 
 */
function showAppointmentForm(isEditMode = false) {
    // 1) Formular einblenden
    appointmentFormContainer.style.display = 'block';
    setTimeout(() => {
        appointmentFormContainer.classList.add('show');
    }, 10);

    // 2) Button-Beschriftung setzen
    const submitButton = appointmentForm.querySelector('button[type="submit"]');
    submitButton.innerText = isEditMode ? 'Änderungen speichern' : 'Termin hinzufügen';

    // 3) Alten Event-Listener entfernen
    submitButton.replaceWith(submitButton.cloneNode(true));
}

/**
 * (C) Formular ausblenden (Abbrechen oder Speichern)
 */
function hideAppointmentForm() {
    appointmentFormContainer.classList.remove('show');
    setTimeout(() => {
        appointmentFormContainer.style.display = 'none';
    }, 300);

    // Button "Termin erstellen" wieder anzeigen
    openAppointmentFormButton.style.display = 'inline-block';

    // Button-Text zurücksetzen
    const submitButton = appointmentForm.querySelector('button[type="submit"]');
    submitButton.innerText = 'Termin hinzufügen';
    console.log('hide läuft')
    // Felder leeren
    clearAppointmentForm();
}

/**************************************************************
 * (D) NEUEN TERMIN ANLEGEN (POST)
 **************************************************************/
/* TERMIN ANLEGEN BEREITS UNTER ZEILE 
async function createNewAppointment() {
    // Termin-Daten sammeln
    const KundennummerzumTermin = document.getElementById('KundennummerzumTermin').value;
    const startVal = document.getElementById('startDateTime').value;  // datetime-local
    const endVal   = document.getElementById('endDateTime').value;    // datetime-local

    // Dauer
    const hours = parseInt(document.getElementById('durationHours').value, 10) || 0;
    const mins  = parseInt(document.getElementById('durationMinutes').value, 10) || 0;
    const totalDuration = hours * 60 + mins;

    const Dienstleistung = document.getElementById('Dienstleistung').value;
    const Preis = document.getElementById('Preis').value;
    const Abrechnungsstatus = document.getElementById('Abrechnungsstatus').value;
    const description = document.getElementById('description').value;

    const erfasstDurch = document.getElementById('erfasstDurch').value;
    const letzterBearbeiter = document.getElementById('erfaletzterBearbeitersstDurch').value;
    const Ressource = document.getElementById('Ressource').value;
    const projektId = document.getElementById('projektId').value;
    const verrechnungsTyp = document.getElementById('verrechnungsTyp').value;
    const erbringungsStatus = document.getElementById('erbringungsStatus').value;
    const rechnungsEmpfaengerNummer = document.getElementById('rechnungsEmpfaengerNummer').value;
    const fakturaNummer = document.getElementById('fakturaNummer').value;
    const fakturaBemerkung = document.getElementById('fakturaBemerkung').value;



    try {
        const response = await fetch(`${BACKEND_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                KundennummerzumTermin,
                startDateTime: startVal,
                endDateTime: endVal,
                duration: totalDuration,
                Dienstleistung,
                Preis,
                Abrechnungsstatus,
                description,
                erfasstDurch,
                letzterBearbeiter,
                Ressource,
                projektId,
                verrechnungsTyp,
                erbringungsStatus,
                fakturaBemerkung,
                fakturaNummer,
                rechnungsEmpfaengerNummer
            })
        });

        if (response.ok) {
            alert('Termin erfolgreich hinzugefügt! zeile 925');
            
            console.log(KundennummerzumTermin,
                startVal,
                endVal,
                totalDuration,
                Dienstleistung,
                Preis,
                Abrechnungsstatus,
                description,
                erfasstDurch,
                letzterBearbeiter,
                Ressource,
                projektId,
                verrechnungsTyp,
                erbringungsStatus,
                fakturaBemerkung,
                fakturaNummer,
                rechnungsEmpfaengerNummer);

            hideAppointmentForm();

            console.log('hier müsste hide appform gestartet werden');
            
            loadAppointments(); // Termine neu laden
        } else {
            alert('Fehler beim Hinzufügen des Termins');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}

*/


/**************************************************************
 * (E) TERMIN BEARBEITEN (PUT)
 **************************************************************/
//Bereits unter Allgemeine Funktionen definiert

/**************************************************************
 * (F) TERMIN LÖSCHEN (DELETE)
 **************************************************************/
//Bereits unter allgemeinen Funktionen definiert

/**************************************************************
 * (G) APPOINTMENT-FORMULAR: OPEN/CLOSE EVENTS
 **************************************************************/
// Klick auf "Termin erstellen" (Neu)
openAppointmentFormButton.addEventListener('click', function() {
    // 1) Button ausblenden
    openAppointmentFormButton.style.display = 'none';
    // 2) Felder leeren
    clearAppointmentForm();
    // 3) Formular im Neu-Modus anzeigen
    showAppointmentForm(false);
    
    // 4) Event-Listener für "Termin hinzufügen" (POST)
    const submitButton = appointmentForm.querySelector('button[type="submit"]');
    submitButton.addEventListener('click', async (e) => {
        console.log('Termin hinzufügen');
        e.preventDefault();
        await createNewAppointment(); 
    });
});

// Klick auf "Abbrechen"
cancelAppointmentFormButton.addEventListener('click', function() {
    hideAppointmentForm();
});

/**************************************************************
 * (H) LOAD APPOINTMENTS (GET) UND ANZEIGE
 **************************************************************/
async function loadAppointments() {
    try {
        const response = await fetch(`${BACKEND_URL}/appointments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (response.ok) {
            allAppointments = await response.json();
            displayAppointments(allAppointments);
            renderCalendar(); // Falls du den Kalender neu rendern willst
        } else {
            alert('Fehler beim Laden der Termine');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}

/**************************************************************
 * (I) TERMINLISTE ANZEIGEN / displayAppointments
 **************************************************************/
async function displayAppointments(appointments) {
    // Kunden laden (für Kundendatenanzeige)
    const clientsResponse = await fetch(`${BACKEND_URL}/clients`);
    const clients = await clientsResponse.json();

    const appointmentsList = document.getElementById('appointmentsList');
    appointmentsList.innerHTML = appointments.map(app => {
        const client = clients.find(c => c.Kundennummer === app.KundennummerzumTermin);
        const appStart = new Date(app.startDateTime);
        // Falls Endtermin existiert:
        const appEnd = app.endDateTime ? new Date(app.endDateTime)
                                       : new Date(appStart.getTime() + (app.duration * 60000));

        return `
            <div class="termin-card">
                <!-- Spalte A: Kundendaten -->
                <div class="termin-info">
                    <div>${client ? `${client.Vorname} ${client.Nachname}` : "Kunde nicht gefunden"}</div>
                    <div>${client ? `${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}` : ""}</div>
                    <div>${client ? `${client.Telefon}, ${client.Mail}` : ""}</div>
                </div>
                <!-- Spalte B: Termindetails -->
                <div class="termin-info">
                    <div>
                        ${appStart.toLocaleDateString()} 
                        ${appStart.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        -
                        ${appEnd.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </div>
                    <div>${app.Dienstleistung} (${app.duration} Min)</div>
                    <div>${app.description}</div>
                </div>
                <!-- Spalte C: Weitere Details -->
                <div class="termin-info">
                    <div>Preis: ${app.Preis || "nicht angegeben"}</div>
                    <div>Status: ${app.Abrechnungsstatus || "nicht angegeben"}</div>
                </div>
                <!-- Spalte D: Aktionen -->
                <div class="termin-actions">
                    <button class="action-btn appointment-edit-btn" data-app-id="${app._id}" title="Bearbeiten">✏️</button>
                    <button class="action-btn appointment-delete-btn" data-app-id="${app._id}" title="Löschen">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    // Klick auf Bearbeiten
    document.querySelectorAll('.appointment-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const appointmentId = btn.getAttribute('data-app-id');
            editAppointment(appointmentId);
        });
    });

    // Klick auf Löschen
    document.querySelectorAll('.appointment-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const appointmentId = btn.getAttribute('data-app-id');
            deleteAppointment(appointmentId);
        });
    });
}


/**************************************************************
 * (J) FILTER-FUNKTIONEN, SUCHE, ETC. (unverändert)
 **************************************************************/
// Beispiel: filterAppointments(), Filter-Buttons etc.


function filterAppointments() {
    const searchTerm = document.getElementById('searchAppointment').value.toLowerCase();
    const today = new Date();

    // 1) Termine nach "Zukunft/Vergangenheit" filtern
    let filteredAppointments = allAppointments.filter(app => {
        const appDate = new Date(app.startDateTime);

        // Keine Filter = alle Termine
        if (!filterFutureActive && !filterPastActive) return true;

        // Filterbedingungen
        if (filterFutureActive && appDate >= today) return true;
        if (filterPastActive && appDate < today) return true;

        return false;
    });

    // 2) Nach Suchbegriff filtern
    filteredAppointments = filteredAppointments.filter(app => {
        const client = allClients.find(c => c.Kundennummer === app.KundennummerzumTermin);

        // Kunde gefunden?
        return (
            (client && client.Vorname && client.Vorname.toLowerCase().includes(searchTerm)) ||
            (client && client.Nachname && client.Nachname.toLowerCase().includes(searchTerm)) ||
            (client && client.Strasse && client.Strasse.toLowerCase().includes(searchTerm)) ||
            (client && client.Ort && client.Ort.toLowerCase().includes(searchTerm)) ||
            (client && client.Telefon && client.Telefon.toLowerCase().includes(searchTerm)) ||
            (client && client.Mail && client.Mail.toLowerCase().includes(searchTerm))
        );
    });

    // 3) Sortieren nach Nähe zum heutigen Datum
    filteredAppointments.sort((a, b) => {
        const dateA = new Date(a.startDateTime);
        const dateB = new Date(b.startDateTime);
        return Math.abs(dateA - today) - Math.abs(dateB - today);
    });

    // 4) Anzeigen
    displayAppointments(filteredAppointments);
}


document.getElementById('filterPast').addEventListener('click', function () {
    filterPastActive = !filterPastActive;
    if (filterPastActive) this.classList.add('active');
    else this.classList.remove('active');
    filterAppointments();
});

document.getElementById('filterFuture').addEventListener('click', function () {
    filterFutureActive = !filterFutureActive;
    if (filterFutureActive) this.classList.add('active');
    else this.classList.remove('active');
    filterAppointments();
});

// Event-Listener für die Suche hinzufügen
document.getElementById('searchAppointment').addEventListener('input', function () {
    filterAppointments();
});

// usw.

/**************************************************************
 * (K) HILFSFUNKTION: setLocalDateTimeInput
 **************************************************************/
function setLocalDateTimeInput(dateTimeLocalStr, elementId) {
    if (!dateTimeLocalStr) {
        document.getElementById(elementId).value = '';
        return;
    }
    // Beispiel: "2025-01-02T10:00:00.000Z" => slice(0,16) => "2025-01-02T10:00"
    const localDateTime = dateTimeLocalStr.slice(0,16);
    document.getElementById(elementId).value = localDateTime;
}



/**************************************************************
 * (L) WEITERE SUCH-FUNKTIONEN, KUNDENSUCHE, ETC.
 **************************************************************/

// Funktion zur Anzeige der Suchergebnisse mit angewendeten Filtern und Sortierung
function displaySearchResults() {
    const searchResultsContainer = document.getElementById('searchClientForApointment');
    searchResultsContainer.innerHTML = ''; 

    // Wenn keine Ergebnisse
    if (searchResults.length === 0) {
        console.log("Anzahl der Suchergebnisse:", searchResults.length);
        searchResultsContainer.style.display = 'none';
        return;
    } else {
        // Hier steht "Keine suchergebnisse Gefunden" => evtl. unglücklich
        console.log("Suchergebnisse gefunden:", searchResults.length);
    }

    // Falls du hier *Termine* filterst, ersetze "client.startDateTime" 
    // Falls du hier *Kunden* filterst, entferne den Zeitvergleich
    const today = new Date();
    let filteredResults = searchResults
        .filter(client => {
            // Wenn dein Filter (Future/Past) auf *Terminen* basiert, 
            // müsstest du client.startDateTime haben. Sonst => auskommentieren
            if (!filterFutureActive && !filterPastActive) return true;

            const appointmentDate = new Date(client.startDateTime || null);
            if (filterFutureActive && appointmentDate >= today) return true;
            if (filterPastActive && appointmentDate < today) return true;

            return false;
        })
        .sort((a, b) => {
            const dateA = new Date(a.startDateTime || null);
            const dateB = new Date(b.startDateTime || null);
            return Math.abs(dateA - today) - Math.abs(dateB - today);
        });

    // Anzeige
    searchResultsContainer.style.display = 'block';
    filteredResults.forEach(client => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('search-result-item');
        resultItem.textContent = `${client.Vorname} ${client.Nachname}, ${client.Ort}, ${client.Telefon}`;

        // Klick => Kundendaten übernehmen
        resultItem.addEventListener('click', () => {
            document.getElementById('KundennummerzumTermin').value = client.Kundennummer;
            document.getElementById('KundennummerzumTerminDisplay').textContent = String(client.Kundennummer).padStart(6, '0');
            document.getElementById('KundenName').textContent = `${client.Vorname} ${client.Nachname}`;
            document.getElementById('KundenAdresse').textContent = `${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}`;
            document.getElementById('KundenTelefon').textContent = client.Telefon;
            document.getElementById('KundenMail').textContent = client.Mail;

            searchResultsContainer.innerHTML = '';
            searchResultsContainer.style.display = 'none';
            document.getElementById('searchCustomerInput').value = '';
        });

        searchResultsContainer.appendChild(resultItem);
    });
}


//Kundensuche innerhalb der Terminverwaltung:
    // Filtered search results for customer search
    let searchResults = [];

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

    // 1) Auftraggeber- und Rechnungsempfänger-Nummern sammeln
    const KundennummerzumTermin = document.getElementById('KundennummerzumTermin').value || ''; 
    // Rechnungsempfänger (nur die Nummer)
    // Achtung: Falls das Feld leer ist, parseInt("") => NaN => wir nehmen dann null
    let rechnungsEmpfaengerNummer = parseInt(document.getElementById('RechnungsempfaengerNummerDisplay').textContent, 10);
    

    // 2) Start- und Endtermin
    const startVal = document.getElementById('startDateTime').value;  // z.B. "2025-01-02T10:00"
    const endVal   = document.getElementById('endDateTime').value;    // z.B. "2025-01-02T11:30"

    // 3) Dauer (Stunden + Minuten => Gesamt-Minuten)
    const hours = parseInt(document.getElementById('durationHours').value, 10) || 0;
    const mins  = parseInt(document.getElementById('durationMinutes').value, 10) || 0;
    const totalDuration = hours * 60 + mins;

    // 4) Weitere Pflicht-/Zusatzfelder
    const Dienstleistung = document.getElementById('Dienstleistung').value;
    const Preis = document.getElementById('Preis').value;
    const Abrechnungsstatus = document.getElementById('Abrechnungsstatus').value;
    const description = document.getElementById('description').value;

    // 5) Neue Felder (Abwicklung)
    const erfasstDurch = document.getElementById('erfasstDurch').value;
    const letzterBearbeiter = document.getElementById('letzterBearbeiter').value;
    const Ressource = document.getElementById('Ressource').value;

    // Projekt-ID als Number (falls leer => null)
    let projektId = parseInt(document.getElementById('projektId').value, 10);
    if (isNaN(projektId)) {
        projektId = null;
    }

    const verrechnungsTyp = document.getElementById('verrechnungsTyp').value;
    const erbringungsStatus = document.getElementById('erbringungsStatus').value;
    const fakturaBemerkung = document.getElementById('fakturaBemerkung').value;
    const fakturaNummer = document.getElementById('fakturaNummer').value;

    // 6) Request-Body (Mongoose-Felder) zusammenstellen
    const newAppointment = {
        // Standard-Felder
        KundennummerzumTermin,
        startDateTime: startVal,
        endDateTime: endVal,
        duration: totalDuration,
        Dienstleistung,
        Preis,
        Abrechnungsstatus,
        description,

        // Abwicklung
        erfasstDurch,
        letzterBearbeiter,
        Ressource,
        projektId,
        verrechnungsTyp,
        erbringungsStatus,
        fakturaBemerkung,
        fakturaNummer,

        // Abweichender Rechnungsempfänger
        rechnungsEmpfaengerNummer
    };

    try {
        // 7) POST an dein Backend
        const response = await fetch(`${BACKEND_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(newAppointment)
        });

        if (response.ok) {
            alert('Termin erfolgreich hinzugefügt Zeile 1360!');
            hideAppointmentForm();
            loadAppointments();
        } else {
            alert('Fehler beim Hinzufügen des Termins');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
});


    /***************************************************
 * Logik für Abweichender Rechnungsempfänger
 ***************************************************/
const invoiceSearchInput = document.getElementById('searchInvoiceInput');
const invoiceResultsContainer = document.getElementById('searchClientForInvoice');
let searchResultsInvoice = [];

// Block ein- und ausblenden per Button
document.getElementById('abweichenderRechnungsempfaengerButton')
    .addEventListener('click', function() {
        const block = document.getElementById('abweichenderRechnungsempfaengerBlock');
        // Einfach umschalten
        if (block.style.display === 'none' || block.style.display === '') {
            block.style.display = 'block';
        } else {
            block.style.display = 'none';
        }
    });

// Suche für Rechnungsempfänger (analog zur Kundensuche)
invoiceSearchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    
    // Wenn nichts eingegeben => Container ausblenden & Array leeren
    if (searchTerm === '') {
        invoiceResultsContainer.style.display = 'none';
        invoiceResultsContainer.innerHTML = '';
        searchResultsInvoice = [];
        return;
    }

    // Hier wird gefiltert (allClients kann identisch sein wie bei Kundensuche)
    searchResultsInvoice = allClients
        .filter(client => 
            client.Vorname.toLowerCase().includes(searchTerm) ||
            client.Nachname.toLowerCase().includes(searchTerm) ||
            client.Ort.toLowerCase().includes(searchTerm) ||
            client.Telefon.toLowerCase().includes(searchTerm)
        )
        .slice(0, 5);

    displayInvoiceSearchResults();
});

// Escape-Taste schließt ebenfalls das Ergebnisfenster
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        invoiceResultsContainer.style.display = 'none';
        invoiceResultsContainer.innerHTML = '';
        invoiceSearchInput.value = '';
        searchResultsInvoice = [];
    }
});

/**************************************************************
 * (L) RECHNUNGSEMPFÄNGER-SUCHE
 *     Angelehnt an deine bestehende Kunden-Suchfunktion.
 **************************************************************/
function displayInvoiceSearchResults() {
    // Container für die Suchergebnisse
    const invoiceResultsContainer = document.getElementById('invoiceResultsContainer');
    invoiceResultsContainer.innerHTML = ''; 

    // Wenn keine Ergebnisse
    if (searchResultsInvoice.length === 0) {
        console.log("Anzahl der Suchergebnisse (Rechnungsempfänger):", searchResultsInvoice.length);
        invoiceResultsContainer.style.display = 'none';
        return;
    } else {
        console.log("Suchergebnisse (Rechnungsempfänger) gefunden:", searchResultsInvoice.length);
    }

    // Anzeige
    invoiceResultsContainer.style.display = 'block';
    searchResultsInvoice.forEach(client => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('search-result-item'); 
        resultItem.textContent = `${client.Vorname} ${client.Nachname}, ${client.Ort}, ${client.Telefon}`;

        // Klick => Rechnungs-Empfängerdaten übernehmen
        resultItem.addEventListener('click', () => {
            document.getElementById('RechnungsempfaengerNummerDisplay').textContent 
                = String(client.Kundennummer).padStart(6, '0');
            document.getElementById('RechnungsempfaengerName').textContent 
                = `${client.Vorname} ${client.Nachname}`;
            document.getElementById('RechnungsempfaengerAdresse').textContent 
                = `${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}`;
            document.getElementById('RechnungsempfaengerTelefon').textContent 
                = client.Telefon;
            document.getElementById('RechnungsempfaengerMail').textContent 
                = client.Mail;

            // Aufräumen
            invoiceResultsContainer.innerHTML = '';
            invoiceResultsContainer.style.display = 'none';
            invoiceSearchInput.value = '';
            searchResultsInvoice = [];
        });

        invoiceResultsContainer.appendChild(resultItem);
    });
}



/* 
  ================ HILFSFUNKTIONEN ================
  1) parseLocalDateTime(str): 
     Zerlegt "YYYY-MM-DDTHH:mm" in {y, m, d, hh, mm} (Zahlen).
  2) buildLocalDateTime(y,m,d,hh,mm): 
     Baut aus Jahr,Monat,Tag,Stunde,Minute wieder einen "YYYY-MM-DDTHH:mm"-String.
*/
function parseLocalDateTime(str) {
    // Beispiel: "2025-01-02T10:30"
    const [datePart, timePart] = str.split('T'); 
    // datePart = "2025-01-02", timePart = "10:30"
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);
    return { y, m, d, hh, mm };
}

function buildLocalDateTime(y, m, d, hh, mm) {
    // Jahr, Monat, Tag, Stunde, Minute in jeweils 2- bzw. 4-stellige Strings umwandeln
    const year  = String(y).padStart(4, '0');
    const month = String(m).padStart(2, '0');
    const day   = String(d).padStart(2, '0');
    const hour  = String(hh).padStart(2, '0');
    const min   = String(mm).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${min}`;
}

/* 
   ================ HAUPTFUNKTIONEN ================
   - calculateEndDateTime(): 
       Addiert (durationHours + durationMinutes) zum Starttermin 
       und schreibt das Ergebnis in das Feld "endDateTime".

   - calculateDuration():
       Ermittelt die Differenz (in h/min) zwischen startDateTime und endDateTime 
       und schreibt sie in durationHours / durationMinutes.
*/

// Referenzen auf die HTML-Elemente
const startInput = document.getElementById('startDateTime');
const endInput = document.getElementById('endDateTime');
const durationHoursInput = document.getElementById('durationHours');
const durationMinutesInput = document.getElementById('durationMinutes');

/**
 * Addiert (hours + mins) zum Starttermin und setzt das Endtermin-Feld.
 */
function calculateEndDateTime() {
    const startValue = startInput.value; 
    if (!startValue) return; // Nichts zu berechnen, falls Starttermin leer

    // 1) Stunden/Minuten auslesen
    const addHours = parseInt(durationHoursInput.value, 10) || 0;
    const addMins  = parseInt(durationMinutesInput.value, 10) || 0;

    // 2) Start-String zerlegen
    const { y, m, d, hh, mm } = parseLocalDateTime(startValue);

    // 3) Stunden/Minuten addieren (ohne Tages-/Monatsüberlauf)
    let newHour = hh + addHours;
    let newMin  = mm + addMins;
    // Falls die Minuten über 59 gehen
    if (newMin >= 60) {
        const overflow = Math.floor(newMin / 60);
        newHour += overflow;
        newMin = newMin % 60;
    }

    // (Da wir max. 8h brauchen, ignorieren wir, wenn newHour >= 24.)

    // 4) Endtermin zusammenbauen
    endInput.value = buildLocalDateTime(y, m, d, newHour, newMin);
}

/**
 * Errechnet aus startDateTime und endDateTime die Gesamtdauer in (h / min).
 */
function calculateDuration() {
    const startValue = startInput.value;
    const endValue = endInput.value;
    if (!startValue || !endValue) return;

    // 1) Beide Strings zerlegen
    const { y: sy, m: sm, d: sd, hh: sh, mm: smin } = parseLocalDateTime(startValue);
    const { y: ey, m: em, d: ed, hh: eh, mm: emin } = parseLocalDateTime(endValue);

    // 2) Gesamt-Minuten ab Mitternacht (jeweils)
    const startTotal = sh * 60 + smin;
    const endTotal   = eh * 60 + emin;

    // 3) Differenz (falls negativ => 0)
    let diffMinutes = endTotal - startTotal;
    if (diffMinutes < 0) diffMinutes = 0;

    // 4) In h / min umwandeln
    const hours = Math.floor(diffMinutes / 60);
    const mins  = diffMinutes % 60;

    durationHoursInput.value   = String(hours);
    durationMinutesInput.value = String(mins);
}

// Events: Wenn sich Stunden/Minuten ändern => Endtermin berechnen
durationHoursInput.addEventListener('change', calculateEndDateTime);
durationMinutesInput.addEventListener('change', calculateEndDateTime);

// Wenn Starttermin geändert => Endtermin neu berechnen
startInput.addEventListener('change', calculateEndDateTime);

// Wenn Endtermin geändert => Dauer neu berechnen
endInput.addEventListener('change', calculateDuration);



//Senden & Speichern im Backend
document.getElementById('appointmentForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Start-/Endtermin
    const startVal = document.getElementById('startDateTime').value;
    const endVal = document.getElementById('endDateTime').value;

    // Als Date-Objekt für das Backend
    const startDateObj = startVal ? new Date(startVal) : null;
    const endDateObj = endVal ? new Date(endVal) : null;

    // Dauer
    let totalMinutes = 0;
    const hours = parseInt(document.getElementById('durationHours').value) || 0;
    const mins = parseInt(document.getElementById('durationMinutes').value) || 0;
    totalMinutes = hours * 60 + mins;

    // Alle weiteren Felder
    const data = {
      startDateTime: startDateObj,
      endDateTime: endDateObj,
      duration: totalMinutes,
      description: document.getElementById('description').value,
      KundennummerzumTermin: parseInt(document.getElementById('KundennummerzumTermin').value) || 0,
      Preis: document.getElementById('Preis').value,
      Abrechnungsstatus: document.getElementById('Abrechnungsstatus').value,
      Dienstleistung: document.getElementById('Dienstleistung').value,
      erfasstDurch: document.getElementById('erfasstDurch').value,
      letzterBearbeiter: document.getElementById('letzterBearbeiter').value,
      Ressource: document.getElementById('Ressource').value,
      projektId: parseInt(document.getElementById('projektId').value) || null,
      verrechnungsTyp: document.getElementById('verrechnungsTyp').value,
      erbringungsStatus: document.getElementById('erbringungsStatus').value,
      fakturaBemerkung: document.getElementById('fakturaBemerkung').value,
      fakturaNummer: document.getElementById('fakturaNummer').value
      // usw...
    };

    // Falls abweichender Rechnungsempfänger ausgewählt wurde:
    const reNr = document.getElementById('RechnungsempfaengerNummerDisplay').textContent;
    if (reNr) {
      data.rechnungsEmpfaengerNummer = parseInt(reNr) || null;
      data.rechnungsEmpfaengerName = document.getElementById('RechnungsempfaengerName').textContent;
      data.rechnungsEmpfaengerAdresse = document.getElementById('RechnungsempfaengerAdresse').textContent;
      data.rechnungsEmpfaengerTelefon = document.getElementById('RechnungsempfaengerTelefon').textContent;
      data.rechnungsEmpfaengerMail = document.getElementById('RechnungsempfaengerMail').textContent;
    }

    // Nun per Fetch oder AJAX an dein Backend senden
    console.log('Termin-Daten zur Speicherung:', data);
    // z.B.:
    // fetch('/api/appointments', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // }).then(...)

});



    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
    //CLIENT-MANAGEMENT
    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
    
/***************************************************
 * 1) GRUNDLEGENDE SETUPS
 ***************************************************/
// Globale Variable für die Kundenliste
let allClients = [];

// Kundenformular und Terminformular beim Laden der Seite ausblenden
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('kundenFormular').style.display = 'none';

    // Kundenliste laden beim Start
    loadClients();  // allClients wird hier gefüllt
    // Falls du das brauchst, auch:
    loadAppointments();
});


/***************************************************
 * 2) CLIENT-FORMULAR: ÖFFNEN, SCHLIESSEN, LEEREN
 ***************************************************/

// Button "Kunden anlegen" → Formular öffnen (NEU-Workflow)
document.getElementById('openClientFormButton').addEventListener('click', () => {
    // 1) Diesen Button ausblenden
    document.getElementById('openClientFormButton').style.display = 'none';
    // 2) Felder leeren
    clearClientForm();
    // 3) Formular anzeigen
    showClientForm();
    // 4) Button-Text = "Kunden hinzufügen"
    const submitButton = document.querySelector('#clientForm button[type="submit"]');
    submitButton.innerText = "Kunden hinzufügen";

    // 5) Alten Listener entfernen und neuen Listener (POST) anhängen
    submitButton.replaceWith(submitButton.cloneNode(true));
    const newSubmitButton = document.querySelector('#clientForm button[type="submit"]');
    newSubmitButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await addNewClient(); // POST-Funktion
    });
});

// Funktion: Formular anzeigen (Animation)
function showClientForm() {
    const form = document.getElementById('kundenFormular');
    form.classList.remove('hidden');   // Entfernt den Zustand "komplett unsichtbar"
    form.style.display = 'block';      // Sichtbar machen
    setTimeout(() => {
        form.classList.add('show');    // Fügt die Transition ein
    }, 10); 
}

// Klick auf "Abbrechen" → Formular schließen
document.getElementById('cancelClientFormButton').addEventListener('click', function () {
    hideClientForm();
});

// Funktion zum Ausblenden des Formulars (Abbrechen oder Erfolg)
function hideClientForm() {
    const form = document.getElementById('kundenFormular');
    // Button "Kunden anlegen" wieder anzeigen
    document.getElementById('openClientFormButton').style.display = 'inline-block';

    // Smooth das Formular schließen
    form.classList.remove('show');
    setTimeout(() => {
        form.classList.add('hidden'); 
        form.style.display = 'none';
    }, 300);

    // Beschriftung zurück auf "Kunden hinzufügen"
    const submitButton = document.querySelector('#clientForm button[type="submit"]');
    submitButton.innerText = "Kunden hinzufügen";

    // Felder leeren
    clearClientForm();
}

// Formularfelder leeren
function clearClientForm() {
    document.getElementById('Vorname').value = '';
    document.getElementById('Nachname').value = '';
    document.getElementById('Strasse').value = '';
    document.getElementById('Hausnummer').value = '';
    document.getElementById('Postleitzahl').value = '';
    document.getElementById('Ort').value = '';
    document.getElementById('Telefon').value = '';
    document.getElementById('Mail').value = '';
}


/***************************************************
 * 3) NEUEN KUNDEN ANLEGEN (POST)
 ***************************************************/

// POST: Kunde hinzufügen
async function addNewClient() {
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                Vorname, 
                Nachname, 
                Strasse, 
                Hausnummer, 
                Postleitzahl, 
                Ort, 
                Telefon, 
                Mail 
            })
        });

        if (response.ok) {
            alert('Kunde erfolgreich hinzugefügt!');
            hideClientForm();
            loadClients();  // Kundenliste neu laden
        } else {
            alert('Fehler beim Hinzufügen des Kunden');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}


/***************************************************
 * 4) KUNDENLISTE LADEN UND ANZEIGEN
 ***************************************************/

// Lade alle Clients (GET)
//Bereits definiert unter Allgemeinen Funktionen

// Funktion zum Anzeigen der Kundenliste
function displayClients(clients) {
    console.log('Anzuzeigende Kunden:', clients); 
    const clientsList = document.getElementById('clientsList');
    // HTML-Output
    clientsList.innerHTML = clients
        .map(client => `
            <div class="client-card">
                <span class="client-info">${client.Vorname} ${client.Nachname}</span>
                <span class="client-info">${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}</span>
                <span class="client-info">${client.Telefon}, ${client.Mail}</span>
                <div class="client-actions">
                    <button data-client-id="${client._id}" class="action-btn edit-client-btn" title="Bearbeiten">✏️</button>
                    <button data-client-id="${client._id}" class="action-btn delete-client-btn" title="Löschen">🗑️</button>
                </div>
            </div>
        `)
        .join('');

    // Event-Listener für "Bearbeiten"
    document.querySelectorAll('.edit-client-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const clientId = btn.getAttribute('data-client-id');
            editClient(clientId); 
        });
    });

    // Event-Listener für "Löschen"
    document.querySelectorAll('.delete-client-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const clientId = btn.getAttribute('data-client-id');
            deleteClient(clientId);
        });
    });
}


/***************************************************
 * 5) KUNDEN BEARBEITEN (PUT)
 ***************************************************/

async function editClient(clientId) {
    // 1) Button "Kunden anlegen" ausblenden
    document.getElementById('openClientFormButton').style.display = 'none';

    // 2) Client-Objekt finden
    const client = allClients.find(c => c._id === clientId);
    if (!client) {
        alert('Kunde nicht gefunden');
        return;
    }

    // 3) Felder füllen
    document.getElementById('Vorname').value = client.Vorname;
    document.getElementById('Nachname').value = client.Nachname;
    document.getElementById('Strasse').value = client.Strasse;
    document.getElementById('Hausnummer').value = client.Hausnummer;
    document.getElementById('Postleitzahl').value = client.Postleitzahl;
    document.getElementById('Ort').value = client.Ort;
    document.getElementById('Telefon').value = client.Telefon;
    document.getElementById('Mail').value = client.Mail;

    // 4) Formular anzeigen
    showClientForm();

    // 5) Button-Beschriftung "Änderungen speichern"
    const submitButton = document.querySelector('#clientForm button[type="submit"]');
    submitButton.innerText = "Änderungen speichern";

    // 6) Alten Listener entfernen, neuen Listener anfügen
    submitButton.replaceWith(submitButton.cloneNode(true));
    const newSubmitButton = document.querySelector('#clientForm button[type="submit"]');
    newSubmitButton.addEventListener('click', async (e) => {
        e.preventDefault();

        // 7) Updated-Daten
        const updatedClient = {
            Vorname: document.getElementById('Vorname').value,
            Nachname: document.getElementById('Nachname').value,
            Strasse: document.getElementById('Strasse').value,
            Hausnummer: document.getElementById('Hausnummer').value,
            Postleitzahl: document.getElementById('Postleitzahl').value,
            Ort: document.getElementById('Ort').value,
            Telefon: document.getElementById('Telefon').value,
            Mail: document.getElementById('Mail').value
        };

        // 8) PUT-Request
        try {
            const response = await fetch(`${BACKEND_URL}/clients/${clientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedClient)
            });

            if (response.ok) {
                alert('Kunde erfolgreich aktualisiert');
                await loadClients(); 
                hideClientForm();
            } else {
                alert('Fehler beim Aktualisieren des Kunden');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    });
}


/***************************************************
 * 6) KUNDEN LÖSCHEN (DELETE)
 ***************************************************/

async function deleteClient(clientId) {
    if (!confirm("Möchtest du diesen Kunden wirklich löschen?")) return;

    try {
        const response = await fetch(`${BACKEND_URL}/clients/${clientId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Kunde erfolgreich gelöscht');
            await loadClients();
        } else {
            alert('Fehler beim Löschen des Kunden');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}


/***************************************************
 * 7) KUNDEN-SUCHE
 ***************************************************/
const searchClientInput = document.getElementById('searchClient');
if (!searchClientInput) {
    console.error("Das Element mit der ID 'searchClient' wurde nicht gefunden!");
} else {
    searchClientInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredClients = allClients.filter(client =>
            (client.Vorname || '').toLowerCase().includes(searchTerm) ||
            (client.Nachname || '').toLowerCase().includes(searchTerm) ||
            (client.Telefon || '').toLowerCase().includes(searchTerm) ||
            (client.Mail || '').toLowerCase().includes(searchTerm)
        );
        displayClients(filteredClients);
    });
}

//====================================================================================================================================
//====================================================================================================================================
// Absenzenverwaltung
//====================================================================================================================================
//====================================================================================================================================


/**************************************************************
 * Absenzen-/Urlaubsverwaltung (Holidays)
 *   Basierend auf:
 *   app.use('/api/absence', absenceRoutes);
 **************************************************************/

let allHolidays = []; // Globale Variable für Feiertage/Urlaube

// DOM-Elemente
const openHolidayFormButton = document.getElementById('openHolidayFormButton');
const cancelHolidayFormButton = document.getElementById('cancelHolidayFormButton');
const holidayFormContainer = document.getElementById('holidaysForm');
const holidayForm = document.getElementById('holidayForm');

// Für die Filter-Buttons (z. B. 2024, 2025) verwenden wir ein Set:
let activeYears = new Set();

/**************************************************************
 * 1) Hilfsfunktion: Deutsche Datumsformatierung
 **************************************************************/
function formatGermanDate(dateString) {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return dateString; // Fallback
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
}

/**************************************************************
 * 2) Formular-Felder leeren
 **************************************************************/
function clearHolidayForm() {
    document.getElementById('holidayDescription').value = '';
    document.getElementById('holidayFromDate').value = '';
    document.getElementById('holidayToDate').value = '';
    document.getElementById('holidayResource').value = '';
    document.getElementById('holidayStatus').value = ''; 
    // <- Dann landet "Ausstehend" als Default (siehe unten)
}

/**************************************************************
 * 3) Formular anzeigen
 **************************************************************/
function showHolidayForm(isEditMode = false) {
    // Container einblenden
    holidayFormContainer.style.display = 'block';
    setTimeout(() => {
        holidayFormContainer.classList.add('show');
    }, 10);

    const submitBtn = document.getElementById('addHolidayButton');
    submitBtn.innerText = isEditMode ? 'Änderungen speichern' : 'Speichern';

    // Alten Listener entfernen (Button klonen)
    submitBtn.replaceWith(submitBtn.cloneNode(true));
}

/**************************************************************
 * 4) Formular ausblenden
 **************************************************************/
function hideHolidayForm() {
    holidayFormContainer.classList.remove('show');
    setTimeout(() => {
        holidayFormContainer.style.display = 'none';
        // Button "Feiertag/Urlaub anlegen" wieder anzeigen
        openHolidayFormButton.style.display = 'inline-block';
    }, 300);

    // Button zurücksetzen
    const submitBtn = document.getElementById('addHolidayButton');
    submitBtn.innerText = 'Speichern';

    // Felder leeren
    clearHolidayForm();
}

/**************************************************************
 * 5) Feiertag/Urlaub neu anlegen (POST) => /absence/holidays
 **************************************************************/
async function createNewHoliday() {
    const from = document.getElementById('holidayFromDate').value;
    const to = document.getElementById('holidayToDate').value || from;
    const description = document.getElementById('holidayDescription').value;
    const resource = document.getElementById('holidayResource').value;
    // Als Fallback "Ausstehend" statt "Unbekannt", 
    // damit es ins Enum ['Genehmigt','Abgelehnt','Ausstehend'] passt
    const statusRaw = document.getElementById('holidayStatus').value;
    const status = statusRaw ? statusRaw : 'Ausstehend';

    try {
        // => /api/absence/holidays (Kleinschreibung!)
        const response = await fetch(`${BACKEND_URL}/absence/holidays`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, description, resource, status }),
        });

        if (response.ok) {
            await loadHolidays();
            renderCalendar();
            alert('Feiertag/Urlaub hinzugefügt');
            hideHolidayForm();
            
        } else {
            alert('Fehler beim Hinzufügen (Status: ' + response.status + ')');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }


}

    



/**************************************************************
 * 6) Feiertag/Urlaub bearbeiten (PUT) => /absence/holidays/:index
 **************************************************************/
async function editHoliday(index) {
    // Button "Feiertag/Urlaub anlegen" ausblenden
    openHolidayFormButton.style.display = 'none';

    console.log(`editHoliday aufgerufen für Index: ${index}`);
    console.log('Aktuelle Feiertage:', allHolidays);

    const holiday = allHolidays[index];
    if (!holiday) {
        console.error('Feiertag/Urlaub nicht gefunden:', index);
        return alert('Feiertag/Urlaub nicht gefunden');
    }

    console.log('Gefundener Feiertag:', holiday);

    // Felder befüllen
    document.getElementById('holidayDescription').value = holiday.description;
    document.getElementById('holidayFromDate').value = holiday.from;
    document.getElementById('holidayToDate').value = holiday.to;
    document.getElementById('holidayResource').value = holiday.resource || '';
    document.getElementById('holidayStatus').value = holiday.status || 'Ausstehend';

    // Formular (Edit-Modus) anzeigen
    showHolidayForm(true);

    // PUT-Listener
    const newSubmitBtn = document.getElementById('addHolidayButton');
    newSubmitBtn.innerText = 'Änderungen speichern';
    newSubmitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const updatedHoliday = {
            from: document.getElementById('holidayFromDate').value,
            to: document.getElementById('holidayToDate').value,
            description: document.getElementById('holidayDescription').value,
            resource: document.getElementById('holidayResource').value,
            status: document.getElementById('holidayStatus').value || 'Ausstehend',
        };

        try {
            // => /api/absence/holidays/:index
            const response = await fetch(`${BACKEND_URL}/absence/holidays/${index}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedHoliday),
            });

            if (response.ok) {
                await loadHolidays();
                renderCalendar();
                alert('Feiertag/Urlaub erfolgreich aktualisiert');
                hideHolidayForm();
            } else {
                alert('Fehler beim Aktualisieren (Status: ' + response.status + ')');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    });
}

/**************************************************************
 * 7) Feiertag/Urlaub löschen (DELETE) => /absence/holidays/:index
 **************************************************************/
async function deleteHoliday(index) {
    const holiday = allHolidays[index];
    if (!holiday) return alert('Feiertag/Urlaub nicht gefunden');

    if (!confirm(`Möchten Sie den Feiertag/Urlaub "${holiday.description}" wirklich löschen?`)) return;

    try {
        // => /api/absence/holidays/:index
        const response = await fetch(`${BACKEND_URL}/absence/holidays/${index}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            await loadHolidays();
            alert('Feiertag/Urlaub erfolgreich gelöscht');
        } else {
            alert('Fehler beim Löschen (Status: ' + response.status + ')');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}

/**************************************************************
 * 8) Formular-Events (Öffnen, Abbrechen)
 **************************************************************/
openHolidayFormButton.addEventListener('click', function() {
    openHolidayFormButton.style.display = 'none';
    clearHolidayForm();
    showHolidayForm(false);

    // POST-Listener
    const submitBtn = document.getElementById('addHolidayButton');
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await createNewHoliday();
    });
});

cancelHolidayFormButton.addEventListener('click', function() {
    hideHolidayForm();
});

/**************************************************************
 * 9) Feiertage/Urlaube laden (GET) => /absence
 **************************************************************/
async function loadHolidays() {
    try {
        // => /api/absence (Kleinschreibung, ohne "A" groß)
        const response = await fetch(`${BACKEND_URL}/absence`);
        if (response.ok) {
            const absence = await response.json();
            allHolidays = absence.holidays || [];
            renderHolidays(allHolidays);
        } else {
            console.error('Fehler beim Laden der Feiertage:', response.status);
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Feiertage:', error);
    }
}

/**************************************************************
 * 10) Feiertage/Urlaube anzeigen (4 Spalten, 2 Zeilen)
 **************************************************************/
function renderHolidays(holidays) {
    const holidaysList = document.getElementById('holidaysList');
    holidaysList.innerHTML = ''; // Liste zurücksetzen

    holidays.forEach((holiday, index) => {
        const fromStr = formatGermanDate(holiday.from);
        const toStr = formatGermanDate(holiday.to);

        // Spalte A (Zeile 1: description, Zeile 2: leer)
        // Spalte B (Zeile 1: "Von: ...", Zeile 2: "Bis: ...")
        // Spalte C (Zeile 1: "Ressource:", Zeile 2: "Status:")
        // Spalte D (Buttons übereinander)
        const holidayItem = document.createElement('div');
        holidayItem.classList.add('holiday-card');

        holidayItem.innerHTML = `
            <div class="holiday-col col-a">
                <div class="line1">${holiday.description}</div>
                <div class="line2"></div>
            </div>
            <div class="holiday-col col-b">
                <div class="line1">Von: ${fromStr}</div>
                <div class="line2">Bis: ${toStr}</div>
            </div>
            <div class="holiday-col col-c">
                <div class="line1">Ressource: ${holiday.resource || 'Keine Ressource'}</div>
                <div class="line2">Status: ${holiday.status || 'Ausstehend'}</div>
            </div>
            <div class="holiday-col col-d">
                <button data-index="${index}" class="action-btn holiday-edit-btn" title="Bearbeiten">✏️</button>
                <button data-index="${index}" class="action-btn holiday-delete-btn" title="Löschen">🗑️</button>
            </div>
        `;

        holidaysList.appendChild(holidayItem);
    });

    // Events zum Bearbeiten/Löschen
    document.querySelectorAll('.holiday-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const holidayIndex = btn.getAttribute('data-index');
            editHoliday(holidayIndex);
        });
    });
    document.querySelectorAll('.holiday-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const holidayIndex = btn.getAttribute('data-index');
            deleteHoliday(holidayIndex);
        });
    });
}

/**************************************************************
 * 11) Toggle-Filterbuttons für Jahre
 **************************************************************/
const filterBtn2024 = document.getElementById('filter2024');
const filterBtn2025 = document.getElementById('filter2025');

filterBtn2024.addEventListener('click', () => toggleYearFilter(2024, filterBtn2024));
filterBtn2025.addEventListener('click', () => toggleYearFilter(2025, filterBtn2025));

function toggleYearFilter(year, btnElement) {
    if (activeYears.has(year)) {
        // Entfernen, Button inaktiv
        activeYears.delete(year);
        btnElement.classList.remove('active');
    } else {
        // Hinzufügen, Button aktiv
        activeYears.add(year);
        btnElement.classList.add('active');
    }
    applyYearFilter();
}

/**************************************************************
 * 12) Filter-Logik anwenden
 **************************************************************/
function applyYearFilter() {
    if (activeYears.size === 0) {
        // Kein Filter
        renderHolidays(allHolidays);
        return;
    }
    const filtered = allHolidays.filter(holiday => {
        const fromYear = new Date(holiday.from).getFullYear();
        const toYear = new Date(holiday.to).getFullYear();
        for (let y of activeYears) {
            if (fromYear <= y && toYear >= y) return true;
        }
        return false;
    });
    renderHolidays(filtered);
}

/**************************************************************
 * 13) Standardmäßig "Bis" auf "Von" setzen
 **************************************************************/
document.getElementById('holidayFromDate').addEventListener('change', (e) => {
    const fromDate = e.target.value;
    document.getElementById('holidayToDate').value = fromDate;
});

/**************************************************************
 * 14) Initial laden
 **************************************************************/
loadHolidays();


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

