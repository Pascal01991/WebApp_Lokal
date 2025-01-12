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
                const response = await fetch(${BACKEND_URL}/availability/slots?currentDate=${currentDate.toISOString()});
                if (!response.ok) {
                    throw new Error(Fehler beim Laden der Slots: ${response.statusText});
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
                const key = ${slot.dayIndex}-${hour}-${minute};
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
                        const key = ${i}-${hour}-${minute};
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
        return ${year}-${month}-${day}T${hour}:${minute};
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
                const response = await fetch(${BACKEND_URL}/clients);
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
            const clientsResponse = await fetch(${BACKEND_URL}/clients);
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
                    const cellSelector = .hour-cell[data-day-index='${dayIndex}'][data-hour='${hour}'];
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
                            appointmentDiv.style.gridRow = span ${Math.ceil(durationHours)};
                            appointmentDiv.style.top = ${(appStartDate.getMinutes() / 60) * 100}%;
                            appointmentDiv.style.height = ${durationHours * 100}%;
                            appointmentDiv.style.width = ${100 / groupSize}%;
                            appointmentDiv.style.left = ${(100 / groupSize) * index}%;
                            appointmentDiv.style.zIndex = '2';
    
                            // Icons
                            const iconContainer = document.createElement('div');
                            iconContainer.classList.add('appointment-icons');
                            iconContainer.innerHTML = 
                                <span class="icon edit-icon" title="Bearbeiten">✏️</span>
                                <span class="icon delete-icon" title="Löschen">🗑️</span>
                            ;
                            iconContainer.querySelector('.edit-icon').addEventListener('click', () => {
                                editAppointment(app._id);
                            });
                            iconContainer.querySelector('.delete-icon').addEventListener('click', () => {
                                deleteAppointment(app._id);
                            });
    
                            // Inhalte
                            const clientAppointment = clients.find(client => client.Kundennummer === app.KundennummerzumTermin);
                            const appointmentContent = document.createElement('div');
                            appointmentContent.innerHTML = 
                                <div>
                                    ${clientAppointment
                                        ? <strong>${clientAppointment.Vorname} ${clientAppointment.Nachname}</strong>
                                           <br>
                                           ${app.Preis} ${app.Dienstleistung}
                                        : "Kunde nicht gefunden"
                                    }
                                </div>;
    
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
    
    
    // Nun kannst du auf die clients-Daten in displayAppointmentsOnCalendar zugreifen:
    async function displayAppointmentsOnCalendar() {
        const startOfWeek = getStartOfWeek(currentDate);
        
        // Lade die Clients nur einmal, falls noch nicht geschehen
        if (!clients || clients.length === 0) {
            const clientsResponse = await fetch(${BACKEND_URL}/clients);
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
                    const cellSelector = .hour-cell[data-day-index='${dayIndex}'][data-hour='${hour}'];
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
                            appointmentDiv.style.gridRow = span ${Math.ceil(durationHours)};
                            appointmentDiv.style.top = ${(appStartDate.getMinutes() / 60) * 100}%;
                            appointmentDiv.style.height = ${durationHours * 100}%;
                            appointmentDiv.style.width = ${100 / groupSize}%;
                            appointmentDiv.style.left = ${(100 / groupSize) * index}%;
                            appointmentDiv.style.zIndex = '2';
    
                            // Icons
                            const iconContainer = document.createElement('div');
                            iconContainer.classList.add('appointment-icons');
                            iconContainer.innerHTML = 
                                <span class="icon edit-icon" title="Bearbeiten">✏️</span>
                                <span class="icon delete-icon" title="Löschen">🗑️</span>
                            ;
                            iconContainer.querySelector('.edit-icon').addEventListener('click', () => {
                                editAppointment(app._id);
                            });
                            iconContainer.querySelector('.delete-icon').addEventListener('click', () => {
                                deleteAppointment(app._id);
                            });
    
                            // Inhalte
                            const clientAppointment = clients.find(client => client.Kundennummer === app.KundennummerzumTermin);
                            const appointmentContent = document.createElement('div');
                            appointmentContent.innerHTML = 
                                <div>
                                    ${clientAppointment
                                        ? <strong>${clientAppointment.Vorname} ${clientAppointment.Nachname}</strong>
                                           <br>
                                           ${app.Preis} ${app.Dienstleistung}
                                        : "Kunde nicht gefunden"
                                    }
                                </div>;
    
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
    