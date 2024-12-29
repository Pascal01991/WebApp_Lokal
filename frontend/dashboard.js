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
    // ...
    setLocalDateTimeInput(appointment.dateTime);
    document.getElementById('duration').value = appointment.duration || '';
    document.getElementById('Dienstleistung').value = appointment.Dienstleistung || '';
    document.getElementById('Preis').value = appointment.Preis || '';
    document.getElementById('Abrechnungsstatus').value = appointment.Abrechnungsstatus || '';
    document.getElementById('description').value = appointment.description || '';

    // 4) den zugehörigen Kunden suchen und Kundendaten befüllen
    //     (Voraussetzung: `allClients` ist geladen.)
    const client = allClients.find(c => c.Kundennummer === appointment.KundennummerzumTermin);
    if (client) {
        document.getElementById('KundennummerzumTermin').value = client.Kundennummer
        document.getElementById('KundennummerzumTerminDisplay').textContent = String(client.Kundennummer).padStart(6, '0');
        document.getElementById('KundenName').textContent = `${client.Vorname} ${client.Nachname}`;
        document.getElementById('KundenAdresse').textContent = `${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}`;
        document.getElementById('KundenTelefon').textContent = client.Telefon || '';
        document.getElementById('KundenMail').textContent = client.Mail || '';
        // Falls du das Feld .MailAppointment hast:
        // document.getElementById('MailAppointment').value = client.Mail || '';
    } else {
        // Falls kein passender Kunde gefunden wird
        document.getElementById('KundenName').textContent = 'Kunde nicht gefunden';
        document.getElementById('KundenAdresse').textContent = '';
        document.getElementById('KundenTelefon').textContent = '';
        document.getElementById('KundenMail').textContent = '';
    }

    // 5) Formular anzeigen (Edit-Modus)
    showAppointmentForm(true);

    // 6) Button "Änderungen speichern" → PUT
    const submitButton = appointmentForm.querySelector('button[type="submit"]');
    submitButton.replaceWith(submitButton.cloneNode(true));
    const newSubmitButton = appointmentForm.querySelector('button[type="submit"]');
    newSubmitButton.innerText = 'Änderungen speichern';
    newSubmitButton.addEventListener('click', async (e) => {
        e.preventDefault();

        const updatedAppointment = {
            KundennummerzumTermin: document.getElementById('KundennummerzumTermin').value,
            dateTime: document.getElementById('dateTime').value,
            duration: document.getElementById('duration').value,
            Dienstleistung: document.getElementById('Dienstleistung').value,
            Preis: document.getElementById('Preis').value,
            Abrechnungsstatus: document.getElementById('Abrechnungsstatus').value,
            description: document.getElementById('description').value
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
    
        // Feiertage und Slots initialisieren
        // Slots asynchron vom Backend laden
        const slots = await fetchAvailableSlots();
        if (!slots.length) {
            console.warn('Keine Slots zum Anzeigen gefunden.');
            return;
        }

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
            const date = new Date(slot.dateTime);
            const hour = date.getHours();
            const minute = date.getMinutes();
            const key = `${slot.dayIndex}-${hour}-${minute}`;
            slotsMap[key] = slot;
        });
    
        const allTimes = slots.map(slot => {
            const date = new Date(slot.dateTime);
            return date.getHours() * 60 + date.getMinutes();
        });
    
        const minTime = Math.min(...allTimes);
        const maxTime = Math.max(...allTimes);
    
        const startHour = Math.floor(minTime / 60);
        const endHour = Math.ceil(maxTime / 60);
    
        const defaultLength = parseInt(document.getElementById('defaultAppointmentLength').value, 10);
        const slotsPerHour = 60 / defaultLength;
    
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
                dateTime: dateToLocalString(slot.dateTime),
                duration: slot.duration
            };
        });
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

    document.getElementById('dateTime').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('Dienstleistung').value = '';
    document.getElementById('Preis').value = '';
    document.getElementById('Abrechnungsstatus').value = '';
    document.getElementById('description').value = '';
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

    // Felder leeren
    clearAppointmentForm();
}

/**************************************************************
 * (D) NEUEN TERMIN ANLEGEN (POST)
 **************************************************************/
async function createNewAppointment() {
    // Termin-Daten sammeln
    const KundennummerzumTermin = document.getElementById('KundennummerzumTermin').value;
    const dateTime = document.getElementById('dateTime').value;
    const duration = document.getElementById('duration').value;
    const Dienstleistung = document.getElementById('Dienstleistung').value;
    const Preis = document.getElementById('Preis').value;
    const Abrechnungsstatus = document.getElementById('Abrechnungsstatus').value;
    const description = document.getElementById('description').value;
    // Falls du MailAppointment nutzt:
    // const MailAppointment = document.getElementById('MailAppointment').value || '';

    try {
        const response = await fetch(`${BACKEND_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                KundennummerzumTermin,
                dateTime,
                duration,
                Dienstleistung,
                Preis,
                Abrechnungsstatus,
                description
                // MailAppointment
            })
        });

        if (response.ok) {
            alert('Termin erfolgreich hinzugefügt!');
            hideAppointmentForm();
            loadAppointments(); // Termine neu laden
        } else {
            alert('Fehler beim Hinzufügen des Termins');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}



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
                    <div>${new Date(app.dateTime).toLocaleDateString()} 
                         ${new Date(app.dateTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
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
function setLocalDateTimeInput(dateTimeLocalStr) {
    // Dein bereits vorhandener Code...
    // Wandelt "YYYY-MM-DDTHH:mm:ss" in ein datetime-local-Eingabeformat
    // und setzt document.getElementById('dateTime').value = ...
    const [datePart, timePart] = dateTimeLocalStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);

    const timeParts = timePart.split(':').map(Number);
    const hour = timeParts[0];
    const minute = timeParts[1];
    const second = timeParts[2] || 0;

    const date = new Date(year, month - 1, day, hour, minute, second);
    if (isNaN(date.getTime())) {
        console.error("Ungültiges Datum:", dateTimeLocalStr);
        return;
    }

    const localDateTime = `${year.toString().padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
    document.getElementById('dateTime').value = localDateTime;
}

/**************************************************************
 * (L) WEITERE SUCH-FUNKTIONEN, KUNDENSUCHE, ETC.
 *     Belässt du einfach in deinem Code, wenn sie schon vorhanden sind.
 **************************************************************/
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

let allHolidays = []; // Globale Variable für Feiertage/Urlaube

// Feiertage/Urlaube laden
async function loadHolidays() {
    try {
        const response = await fetch(`${BACKEND_URL}/settings`);
        if (response.ok) {
            const settings = await response.json();
            allHolidays = settings.holidays || []; // Feiertage speichern
            renderHolidays(allHolidays);
        } else {
            console.error('Fehler beim Laden der Feiertage');
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Feiertage:', error);
    }
}

// Feiertage/Urlaube anzeigen
function renderHolidays(holidays) {
    const holidaysList = document.getElementById('holidaysList');
    holidaysList.innerHTML = ''; // Liste zurücksetzen

    holidays.forEach((holiday, index) => {
        const holidayItem = document.createElement('div');
        holidayItem.classList.add('holiday-item');

        holidayItem.innerHTML = `
            <div class="holiday-column description-column">
                <span>${holiday.description}</span>
            </div>
            <div class="holiday-column date-column">
                <span>Von: ${holiday.from}</span>
                <span>Bis: ${holiday.to}</span>
            </div>
            <div class="holiday-column resource-column">
                <span>Ressource: ${holiday.resource || 'Keine Ressource'}</span>
                <span>Status: ${holiday.status || 'Unbekannt'}</span>
            </div>
            <div class="holiday-column actions-column">
                <button data-index="${index}" class="action-btn holiday-edit-btn" title="Bearbeiten">✏️</button>
                <button data-index="${index}" class="action-btn holiday-delete-btn" title="Löschen">🗑️</button>

            </div>
        `;

        holidaysList.appendChild(holidayItem);
    });

        
    // Event-Listener für Feiertags-Buttons
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



// Anzeigen des Absenzenformulars
function showHolidayForm() {
    const form = document.getElementById('holidaysForm');
    form.classList.remove('hidden');
    form.style.display = 'block';
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
    document.getElementById('openHolidayFormButton').style.display = 'none';
}

// Formular ausblenden
document.getElementById('cancelHolidayFormButton').addEventListener('click', () => {
    const form = document.getElementById('holidaysForm');
    form.classList.remove('show');
    setTimeout(() => {
        form.style.display = 'none';
        document.getElementById('openHolidayFormButton').style.display = 'inline-block';
    }, 300);
});

// Absenz anlegen
document.getElementById('openHolidayFormButton').addEventListener('click', showHolidayForm);

// Feiertag/Urlaub hinzufügen
document.getElementById('addHolidayButton').addEventListener('click', async (e) => {
    e.preventDefault();
    const from = document.getElementById('holidayFromDate').value;
    const to = document.getElementById('holidayToDate').value || from;
    const description = document.getElementById('holidayDescription').value;
    const resource = document.getElementById('holidayResource').value;
    const status = document.getElementById('holidayStatus').value || 'Unbekannt';

    const response = await fetch(`${BACKEND_URL}/settings/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, description, resource, status }),
    });

    if (response.ok) {
        await loadHolidays();
        alert('Feiertag/Urlaub hinzugefügt');
    } else {
        alert('Fehler beim Hinzufügen');
    }
});

// Feiertag/Urlaub bearbeiten
window.editHoliday = async function (index) {
    console.log(`editHoliday aufgerufen für Index: ${index}`);
    console.log('Aktuelle Feiertage:', allHolidays); // Logge den Inhalt der Liste

    const holiday = allHolidays[index];
    if (!holiday) {
        console.error('Feiertag/Urlaub nicht gefunden:', index);
        return alert('Feiertag/Urlaub nicht gefunden');
    }

    console.log('Gefundener Feiertag:', holiday);

    // Formular öffnen
    showHolidayForm();

    // Daten ins Formular übertragen
    document.getElementById('holidayDescription').value = holiday.description;
    document.getElementById('holidayFromDate').value = holiday.from;
    document.getElementById('holidayToDate').value = holiday.to;
    document.getElementById('holidayResource').value = holiday.resource || '';
    document.getElementById('holidayStatus').value = holiday.status || '';

    const submitButton = document.getElementById('addHolidayButton');
    submitButton.innerText = "Änderungen speichern";
    submitButton.onclick = async function (e) {
        e.preventDefault();
        const updatedHoliday = {
            description: document.getElementById('holidayDescription').value,
            from: document.getElementById('holidayFromDate').value,
            to: document.getElementById('holidayToDate').value,
            resource: document.getElementById('holidayResource').value,
            status: document.getElementById('holidayStatus').value,
        };

        try {
            const response = await fetch(`${BACKEND_URL}/settings/holidays/${holiday._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedHoliday),
            });

            if (response.ok) {
                await loadHolidays();
                submitButton.innerText = "Speichern";
                submitButton.onclick = null;
                alert('Feiertag/Urlaub erfolgreich aktualisiert');
            } else {
                alert('Fehler beim Aktualisieren');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    };
};


// Feiertag/Urlaub löschen
async function deleteHoliday(index) {
    const holiday = allHolidays[index];
    if (!holiday) return alert('Feiertag/Urlaub nicht gefunden');

    if (!confirm(`Möchten Sie den Feiertag/Urlaub "${holiday.description}" wirklich löschen?`)) return;

    try {
        const response = await fetch(`${BACKEND_URL}/settings/holidays/${holiday._id}`, { method: 'DELETE' });
        if (response.ok) {
            await loadHolidays();
            alert('Feiertag/Urlaub erfolgreich gelöscht');
        } else {
            alert('Fehler beim Löschen');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}

// Standardmäßig "Bis" auf "Von" setzen
document.getElementById('holidayFromDate').addEventListener('change', (e) => {
    const fromDate = e.target.value;
    document.getElementById('holidayToDate').value = fromDate;
});

// Initial laden
loadHolidays();

// Filterbuttons für Jahre
document.getElementById('filter2024').addEventListener('click', () => filterHolidays(2024));
document.getElementById('filter2025').addEventListener('click', () => filterHolidays(2025));

function filterHolidays(year) {
    const filteredHolidays = allHolidays.filter(holiday => {
        const fromYear = new Date(holiday.from).getFullYear();
        const toYear = new Date(holiday.to).getFullYear();
        return fromYear <= year && toYear >= year;
    });

    renderHolidays(filteredHolidays);
}





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

