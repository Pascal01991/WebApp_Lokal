 // Importiere die Backend-URL (muss am Anfang stehen)
 import { BACKEND_URL } from './config.js';
 


 
    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
    //ALLGMEIN BENÖTIGTE ELEMENTE
    //====================================================================================================================================
    //====================================================================================================================================
    //====================================================================================================================================
   
    /***************************************************
     * 0) GLOBALE VARIABLEN
     ***************************************************/

    
    //Globale Variable für Appointments
    let allAppointmentRequests = []; // Termin-Anfragen global speichern
    let allAppointments = []; // Termine global speichern

    // Globale Variable für die Kundenliste
    let allClients = [];

    // Globale Variablen für die Arbeitszeiten und den Default Slot Length
    let workingHours = {};
    let defaultSlotLength = 30; // Standardwert, falls nicht aus der DB geladen

    // Globale Variable für die Serviceliste
    let allServices = [];
    
    const currentUserName = localStorage.getItem('loggedInUsername') || 'Unbekannt';

    /***************************************************
     * 1) GRUNDLEGENDE Elemente Users
     ***************************************************/


    // Benutzerformular beim Laden der Seite ausblenden
    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('userFormular').style.display = 'none';

        // Benutzerliste laden beim Start
        loadUsers(); // allUsers wird hier gefüllt
    });

    // Globale Variable für die Benutzerliste
    let allUsers = [];

    loadUsers();
    
    loadAppointmentRequests();

    //Service-Checkboxen
    async function initialServiceLoadAndRender() {
        await loadServices();                  // <-- hier warten
        renderAppointmentServiceCheckboxes(allServices);
    }
    
    // Dann an passender Stelle aufrufen, z.B. direkt nach DOM-Load oder wann du das Formular zum ersten Mal öffnest:
    document.addEventListener('DOMContentLoaded', () => {
        initialServiceLoadAndRender();
    });
    
    // Funktion zum Bearbeiten des Termins
// Für "Bearbeiten"-Button im Termin

    /**
     * Normalisiert eine Kundennummer, indem führende Nullen entfernt werden.
     * Beispiel: "000001" → "1"
     */
    function normalizeKundennummer(kNum) {
        return String(parseInt(kNum, 10));
    }
    
    /**
     * Formatiert eine Kundennummer als sechsstelligen String.
     * Beispiel: "1" → "000001"
     */
    function formatKundennummer(kNum) {
        return String(kNum).padStart(6, '0');
    }
    

    async function editAppointment(appointmentId) {
        // Button "Termin erstellen" ausblenden
        openAppointmentFormButton.style.display = 'none';
    
        // Terminobjekt finden
        const appointment = allAppointments.find(app => app._id === appointmentId);
        if (!appointment) {
            alert('Termin nicht gefunden');
            return;
        }
    
        // Formularfelder für den Termin befüllen
        // Kundennummer übernehmen und normalisieren
        const normalizedKundennummer = normalizeKundennummer(appointment.KundennummerzumTermin);
        document.getElementById('KundennummerzumTermin').value = normalizedKundennummer;
        document.getElementById('KundennummerzumTerminDisplay').textContent = formatKundennummer(appointment.KundennummerzumTermin || '');
    
        // Start- & Endzeit in das datetime-local-Feld schreiben
        setLocalDateTimeInput(appointment.startDateTime, 'startDateTime');
        setLocalDateTimeInput(appointment.endDateTime, 'endDateTime');
    
        // Dienstleistungs-Array laden
        let dlArray = [];
        if (appointment.Dienstleistung) {
            try {
                dlArray = JSON.parse(appointment.Dienstleistung);
            } catch (err) {
                dlArray = appointment.Dienstleistung.split(',');
            }
        }
    
        // Dauer in Stunden/Minuten berechnen
        const totalMinutes = parseInt(appointment.duration, 10) || 0;
        document.getElementById('durationHours').value = Math.floor(totalMinutes / 60);
        document.getElementById('durationMinutes').value = totalMinutes % 60;
    
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
    
        // Services laden und Checkboxen rendern
        await loadServices();
        renderAppointmentServiceCheckboxes(allServices);
        for (let i = 1; i < dlArray.length; i++) {
            if (dlArray[i] === "1") {
                const cb = document.querySelector(
                    `#appointmentServicesCheckboxContainer .appointment-service-checkbox[data-service-index="${i}"]`
                );
                if (cb) {
                    cb.checked = true;
                }
            }
        }
    
        // Den zugehörigen Kunden suchen anhand der normalisierten Kundennummer
        const client = allClients.find(c => normalizeKundennummer(c.Kundennummer) === normalizedKundennummer);
        if (client) {
            document.getElementById('KundennummerzumTermin').value = normalizeKundennummer(client.Kundennummer);
            document.getElementById('KundennummerzumTerminDisplay').textContent = formatKundennummer(client.Kundennummer);
            document.getElementById('KundenName').textContent = `${client.Vorname} ${client.Nachname}`;
            document.getElementById('KundenAdresse').textContent = `${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}`;
            document.getElementById('KundenTelefon').textContent = client.Telefon || '';
            document.getElementById('KundenMail').textContent = client.Mail || '';
        } else {
            document.getElementById('KundenName').textContent = 'Kunde nicht erfasst';
            document.getElementById('KundenAdresse').textContent = '';
            document.getElementById('KundenTelefon').textContent = '';
            document.getElementById('KundenMail').textContent = '';
        }
    
        // Rechnungs-Empfänger-Daten analog behandeln (wie in deinem Codebeispiel)
        if (appointment.rechnungsEmpfaengerNummer) {
            const recClient = allClients.find(c => normalizeKundennummer(c.Kundennummer) === normalizeKundennummer(appointment.rechnungsEmpfaengerNummer));
            const block = document.getElementById('abweichenderRechnungsempfaengerBlock');
            if (block) block.style.display = 'block';
            if (recClient) {
                document.getElementById('RechnungsempfaengerNummerDisplay').textContent = formatKundennummer(recClient.Kundennummer);
                document.getElementById('RechnungsempfaengerName').textContent = `${recClient.Vorname} ${recClient.Nachname}`;
                document.getElementById('RechnungsempfaengerAdresse').textContent = `${recClient.Strasse} ${recClient.Hausnummer}, ${recClient.Postleitzahl} ${recClient.Ort}`;
                document.getElementById('RechnungsempfaengerTelefon').textContent = recClient.Telefon;
                document.getElementById('RechnungsempfaengerMail').textContent = recClient.Mail;
            } else {
                document.getElementById('RechnungsempfaengerNummerDisplay').textContent = '';
                document.getElementById('RechnungsempfaengerName').textContent = 'Nicht gefunden';
                document.getElementById('RechnungsempfaengerAdresse').textContent = '';
                document.getElementById('RechnungsempfaengerTelefon').textContent = '';
                document.getElementById('RechnungsempfaengerMail').textContent = '';
            }
        } else {
            document.getElementById('abweichenderRechnungsempfaengerBlock').style.display = 'none';
            document.getElementById('RechnungsempfaengerNummerDisplay').textContent = '';
            document.getElementById('RechnungsempfaengerName').textContent = '';
            document.getElementById('RechnungsempfaengerAdresse').textContent = '';
            document.getElementById('RechnungsempfaengerTelefon').textContent = '';
            document.getElementById('RechnungsempfaengerMail').textContent = '';
        }
    
        // Formular im Edit-Modus anzeigen
        showAppointmentForm(true);
    
        // Button "Änderungen speichern" (PUT) neu binden
        const appointmentForm = document.getElementById('appointmentForm');
        const submitButton = appointmentForm.querySelector('button[type="submit"]');
        submitButton.replaceWith(submitButton.cloneNode(true));  // Event-Listener entfernen
        const newSubmitButton = appointmentForm.querySelector('button[type="submit"]');
        newSubmitButton.innerText = 'Änderungen speichern';
        newSubmitButton.addEventListener('click', async (e) => {
            e.preventDefault();
    
            // Neue Werte auslesen und aktualisiertes Appointment-Objekt zusammenstellen
            const startVal = document.getElementById('startDateTime').value;
            const endVal = document.getElementById('endDateTime').value;
            const hours = parseInt(document.getElementById('durationHours').value, 10) || 0;
            const mins = parseInt(document.getElementById('durationMinutes').value, 10) || 0;
            const totalDuration = hours * 60 + mins;
    
            const updatedDlArray = new Array(allServices.length).fill("0");
            updatedDlArray[0] = "1";
            const checkedBoxes = document.querySelectorAll('#appointmentServicesCheckboxContainer .appointment-service-checkbox:checked');
            checkedBoxes.forEach(cb => {
                const idx = parseInt(cb.dataset.serviceIndex, 10);
                updatedDlArray[idx] = "1";
            });
            const dlString = JSON.stringify(updatedDlArray);
    
            const updatedAppointment = {
                KundennummerzumTermin: document.getElementById('KundennummerzumTermin').value,
                startDateTime: startVal,
                endDateTime: endVal,
                duration: totalDuration,
                Dienstleistung: dlString,
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
                    renderCalendarWithDelay();
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
                renderCalendarWithDelay();
                alert('Termin erfolgreich gelöscht');
                loadAppointments();
            } else {
                alert('Fehler beim Löschen des Termins');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    }


    /**************************************************************
    *AppointmentForm Serviceses
    **************************************************************/
/**
 * Erstellt eine Liste von Checkboxen für die angegebenen Services.
 * Checkbox linksbündig, Text direkt daneben.
 * @param {Array} services - Array der Services (z.B. allServices)
 */
// Nach dem Rendern der Checkboxen die Preisberechnung aktivieren
function renderAppointmentServiceCheckboxes(services) {
    const container = document.getElementById('appointmentServicesCheckboxContainer');
    container.innerHTML = '';

    for (let i = 1; i < services.length; i++) { // Index 0 wird nicht genutzt
        const service = services[i];

        const label = document.createElement('label');
        label.className = 'service-checkbox-label';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.serviceIndex = i;
        checkbox.className = 'appointment-service-checkbox';

        // Text als Span für bessere Kontrolle
        const textSpan = document.createElement('span');
        textSpan.textContent = `${service.serviceName}`;
        
        // Reihenfolge: Checkbox, dann Text
        label.appendChild(checkbox);
        label.appendChild(textSpan);
        container.appendChild(label);
    }
    
    // Event-Listener für die Preisberechnung nach dem Rendering der Checkboxen anhängen
    attachPriceCalculation(services);
    
    console.log("renderCheckbox ausgeführt");
}






//====================================================================================================================================
//====================================================================================================================================
//====================================================================================================================================
//HOME
//====================================================================================================================================
//====================================================================================================================================
//====================================================================================================================================
//Aktueller Benutzer in den DOM laden:
    
    console.log('current user: ' + currentUserName);
   

    document.addEventListener('DOMContentLoaded', function() {
        const storedUsername = localStorage.getItem('loggedInUsername') || 'Unbekannt';
        document.getElementById('loggedInUsername').textContent = storedUsername;
      
        
      });




//====================================================================================================================================      
//====================================================================================================================================
//====================================================================================================================================
//Buchungsanfragen
//====================================================================================================================================
//====================================================================================================================================
    
    

/**************************************************************
 * (H) LOAD APPOINTMENT REQUESTS (GET) UND ANZEIGE
 **************************************************************/
async function loadAppointmentRequests() {
    try {
        const response = await fetch(`${BACKEND_URL}/appointmentrequests`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (response.ok) {
            allAppointmentRequests = await response.json();
            displayAppointmentRequests(allAppointmentRequests);
        } else {
            alert('Fehler beim Laden der Termin-Anfragen');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}

/**************************************************************
 * (I) TERMIN-ANFRAGEN ANZEIGEN / displayAppointmentRequests
 **************************************************************/
/**
 * Zeigt alle Appointment Requests in einer Liste an und hängt Event-Listener
 * für Freigeben, Ablehnen und Bearbeiten an.
 *
 * @param {Array} appointmentRequests - Array aus Appointment Requests (z.B. aus dem Backend geladen)
 */
async function displayAppointmentRequests(appointmentRequests) {
    const requestsList = document.getElementById('appointmentRequestsList');
    

    // 2) Falls du hier noch nicht allServices geladen hast:
    if (!allServices || allServices.length === 0) {
        await loadServices(); 
        // Jetzt haben wir in allServices das Array aller Services
    }

    // HTML für jede Request generieren
    requestsList.innerHTML = appointmentRequests.map(req => {
        // Start-/End-Zeiten ausrechnen bzw. formattieren
        const start = new Date(req.startDateTime);
        const end = req.endDateTime 
                    ? new Date(req.endDateTime) 
                    : new Date(start.getTime() + (req.duration * 60000));

        const dlString = req.Dienstleistung; 
                    // => '["1","0","0","1","0"]'
                
            
        const dlArray = JSON.parse(dlString);
                    // => dlArray = ["1","0","0","1","0"]  (ein echtes JavaScript-Array mit length=5)
                    let additionalServicesHTML = '';
                    for (let i = 1; i < dlArray.length; i++) {
                        if (dlArray[i] === "1") {
                            // => allServices[i] muss existieren
                            if (allServices[i]) {
                                additionalServicesHTML += `<div>${allServices[i].serviceName}</div>`;
                            } else {
                                // Falls dein Termin alt ist, aber das System inzwischen mehr/weniger Services hat,
                                // kann das passieren. Ggf. abfangen oder 'Unbekannter Service #...'
                                additionalServicesHTML += `<div>Unbekannter Service #${i}</div>`;
                            }
                        }
                    }
                    if (!additionalServicesHTML) {
                        additionalServicesHTML = '<div>Keine weiteren Services aktiviert</div>';
                    }
                    console.log('dlArray.length' + dlArray.length);

        return `
            <div class="termin-request-card">
                <!-- Spalte A: Termin-Details -->
                <div class="request-info">
                    <div>
                        ${start.toLocaleDateString()} 
                        ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        -
                        ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>Dienstleistung: ${additionalServicesHTML || "nicht angegeben"}</div>
                    <div>Beschreibung: ${req.description || "Keine Beschreibung"}</div>
                </div>

                <!-- Spalte B: Weitere Infos -->
                <div class="request-info">
                    <div>Preis: ${req.Preis || "nicht angegeben"}</div>
                    <div>Mail: ${req.MailAppointmentRequests || "keine E-Mail"}</div>
                    <div>Ressource: ${req.Ressource || "keine Ressource angegeben"}</div>
                </div>

                <!-- Spalte C: Aktionen -->
                <div class="request-actions">
                    <div class="check_approve-actions">
                        <!-- Freigeben-Button -->
                        <button 
                            class="action-btn request-approve-btn" 
                            data-req-id="${req._id}" 
                            title="Freigeben">
                            ✅
                        </button>

                        <!-- Ablehnen-Button -->
                        <button 
                            class="action-btn request-reject-btn" 
                            data-req-id="${req._id}" 
                            title="Ablehnen">
                            ❌
                        </button>
                    </div>
                    
                    <!-- Bearbeiten-Button -->
                    <button 
                        class="action-btn request-edit-btn" 
                        data-req-id="${req._id}" 
                        title="Bearbeiten">
                        ✏️
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Event-Listener für: Freigeben
    document.querySelectorAll('.request-approve-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const requestId = btn.getAttribute('data-req-id');
            approveAppointmentRequest(requestId, appointmentRequests);
        });
    });

    // Event-Listener für: Ablehnen
    document.querySelectorAll('.request-reject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const requestId = btn.getAttribute('data-req-id');
            rejectAppointmentRequest(requestId, appointmentRequests);
        });
    });

    // Event-Listener für: Bearbeiten
    document.querySelectorAll('.request-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const requestId = btn.getAttribute('data-req-id');
            editAppointmentRequest(requestId, appointmentRequests);
        });
    });
}

/**************************************************************
TERMIN-ANFRAGEN FREIGEBEN
 **************************************************************/
/**
 * Wandelt einen Appointment Request in ein neues Appointment um
 * und sendet dieses an das Backend. Anschließend kann der Request
 * entfernt werden (z.B. via delete im Backend).
 *
 * @param {string} requestId - Die ID des Requests, der genehmigt werden soll
 * @param {Array} appointmentRequests - Array aller vorhandenen Requests
 */
async function approveAppointmentRequest(requestId, appointmentRequests) {
    // Request aus dem Array holen
    const req = appointmentRequests.find(r => r._id === requestId);
    if (!req) {
        alert('Request nicht gefunden!');
        return;
    }

    // Hier baust du dir aus den Request-Daten das gewünschte newAppointment,
    // so wie du es für dein /appointments-Backend erwartest.
    // Die Felder sind analog zu deiner Vorgabe:
    // ------------------------------------------------------------------------
    //   KundennummerzumTermin,
    //   startDateTime: finalStart,
    //   endDateTime: "",
    //   duration: totalDuration,
    //   description: `Öffentliche Buchungsplattform (Kunde: ${personalData.firstName} ${personalData.lastName})`,
    //   MailAppointmentRequests: personalData.email,
    //   Preis: String(totalPrice),
    //   Dienstleistung: JSON.stringify(servicesArray),
    //   erfasstDurch: "öffentliche Buchungsplattform",
    //   Ressource: selectedUser?.username || ""
    // ------------------------------------------------------------------------
    // Da deine Request-Objekte evtl. andere Felder enthalten, bitte anpassen.

    const personalData = {
        firstName: req.firstName || 'VornameUnbekannt',
        lastName: req.lastName || 'NachnameUnbekannt',
        email: req.MailAppointmentRequests || 'keine Email'
    };

    
    const dienstleistungString = req.Dienstleistung || '[]';  // Direkt als String übernehmen
    const totalPrice = req.totalPrice || 0;
    const selectedUser = { username: req.Ressource || '' };
    const description = req.description || `Öffentliche Buchungsplattform (Kunde: ${personalData.firstName} ${personalData.lastName})`;

    // Falls du in deinem Request abweichend startDateTime schon hast,
    // kannst du das direkt verwenden:
    const finalStart = req.startDateTime;
    const totalDuration = req.duration;

    // Du kannst dieses Objekt nach Belieben anpassen
    const newAppointment = {
        KundennummerzumTermin: req.KundennummerzumTermin || '',
        startDateTime: finalStart,
        endDateTime: req.endDateTime || '',  // optional
        duration: totalDuration,
        description: description,
        //description: `Öffentliche Buchungsplattform (Kunde: ${personalData.firstName} ${personalData.lastName})`,
        MailAppointmentRequests: personalData.email,
        Preis: String(totalPrice),
        Dienstleistung: dienstleistungString,
        erfasstDurch: "öffentliche Buchungsplattform",
        Ressource: selectedUser.username
    };

    // An dein Backend senden
    try {
        const response = await fetch(`${BACKEND_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(newAppointment)
        });

        if (!response.ok) {
            throw new Error('Fehler beim Anlegen des neuen Termins');
        }

        // Wenn das POST erfolgreich war, Request ggf. im Backend löschen
        // oder seinen Status auf "genehmigt" setzen. Beispiel: DELETE:
        await fetch(`${BACKEND_URL}/appointmentrequests/${requestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        // Im Frontend-Array entfernen
        const index = appointmentRequests.findIndex(r => r._id === requestId);
        if (index !== -1) {
            appointmentRequests.splice(index, 1);
        }

        // UI neu rendern
        displayAppointmentRequests(appointmentRequests);
        loadAppointments();
        renderCalendarWithDelay();
        alert('Termin erfolgreich aus Request erstellt und Request entfernt!');
        
    } catch (err) {
        console.error(err);
        alert('Fehler: ' + err.message);
    }
}

/**************************************************************
TERMIN-ANFRAGEN ABLEHNEN
 **************************************************************/
/**
 * Entfernt (löscht) einen Appointment Request, z.B. wenn der Admin
 * ihn ablehnt. Kann im Backend per DELETE passieren.
 *
 * @param {string} requestId - Die ID des Requests, der gelöscht werden soll
 * @param {Array} appointmentRequests - Array aller vorhandenen Requests
 */
async function rejectAppointmentRequest(requestId, appointmentRequests) {
    // Im Backend löschen (optional, je nach API)
    try {
        const response = await fetch(`${BACKEND_URL}/appointmentrequests/${requestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Fehler beim Löschen des Requests');
        }

        // Auch im Frontend-Array entfernen
        const index = appointmentRequests.findIndex(r => r._id === requestId);
        if (index !== -1) {
            appointmentRequests.splice(index, 1);
        }

        // Liste neu rendern
        displayAppointmentRequests(appointmentRequests);

        alert('Request abgelehnt und entfernt!');
    } catch (error) {
        console.error(error);
        alert('Fehler beim Entfernen des Requests: ' + error.message);
    }
}

/**************************************************************
TERMIN-ANFRAGEN BEARBEITEN VOR FREIGEBEN
 **************************************************************/
/**
 * Öffnet dein bestehendes Terminformular und befüllt es mit Daten
 * aus dem gewählten Appointment Request. Der Nutzer kann es dann
 * bearbeiten und am Ende bestätigen, wobei der ursprüngliche Request
 * in einen Termin umgewandelt (POST) und danach gelöscht wird.
 *
 * @param {string} requestId - Die ID des Requests
 * @param {Array} appointmentRequests - Array aller Requests
 */
async function editAppointmentRequest(requestId, appointmentRequests) {
    const req = appointmentRequests.find(r => r._id === requestId);
    if (!req) {
        alert('Request nicht gefunden!');
        return;
    }
    
    console.log("[DEBUG] editAppointmentRequest aufgerufen. Request:", req);

    // Sicherstellen, dass die Services geladen sind
    await loadServices();
    renderAppointmentServiceCheckboxes(allServices);
    showAppointmentForm();

    // -------------------------
    // Formularfelder befüllen: Kundennummer
    // -------------------------
    const kundennummerRaw = req.KundennummerzumTermin;
    const normalizedKundennummer = normalizeKundennummer(kundennummerRaw);
    console.log("[DEBUG] KundennummerzumTermin aus Request (normalisiert):", normalizedKundennummer);
    document.getElementById('KundennummerzumTermin').value = normalizedKundennummer;

    // Kundendetails anzeigen anhand der Kundennummer
    const client = allClients.find(c => normalizeKundennummer(c.Kundennummer) === normalizedKundennummer);
    if (client) {
        console.log("[DEBUG] Kunde gefunden:", client);
        // Anzeige im Formular: hier sowohl das Eingabefeld als auch ein Display-Feld
        document.getElementById('KundennummerzumTerminDisplay').textContent = formatKundennummer(client.Kundennummer);
        document.getElementById('KundenName').textContent = `${client.Vorname} ${client.Nachname}`;
        document.getElementById('KundenAdresse').textContent = `${client.Strasse} ${client.Hausnummer}, ${client.Postleitzahl} ${client.Ort}`;
        document.getElementById('KundenTelefon').textContent = client.Telefon || '';
        document.getElementById('KundenMail').textContent = client.Mail || '';
    } else {
        console.warn("[DEBUG] Kein Kunde gefunden für Kundennummer:", normalizedKundennummer);
        document.getElementById('KundennummerzumTerminDisplay').textContent = normalizedKundennummer;
        document.getElementById('KundenName').textContent = 'Kunde nicht erfasst';
        document.getElementById('KundenAdresse').textContent = '';
        document.getElementById('KundenTelefon').textContent = '';
        document.getElementById('KundenMail').textContent = '';
    }

    // -------------------------
    // Weitere Formularfelder befüllen
    // -------------------------
    if (req.startDateTime) {
        document.getElementById('startDateTime').value = req.startDateTime.slice(0, 16);
    }
    if (req.endDateTime) {
        document.getElementById('endDateTime').value = req.endDateTime.slice(0, 16);
    }
    const totalMinutes = req.duration || 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    document.getElementById('durationHours').value = hours;
    document.getElementById('durationMinutes').value = mins;
    
    document.getElementById('Preis').value = req.Preis || '';
    document.getElementById('Abrechnungsstatus').value = req.Abrechnungsstatus || '';
    document.getElementById('description').value = req.description || '';
    document.getElementById('erfasstDurch').value = req.erfasstDurch || '';
    document.getElementById('letzterBearbeiter').value = req.letzterBearbeiter || '';
    document.getElementById('Ressource').value = req.Ressource || '';
    
    if (req.projektId) {
        document.getElementById('projektId').value = req.projektId;
    }
    document.getElementById('verrechnungsTyp').value = req.verrechnungsTyp || '';
    document.getElementById('erbringungsStatus').value = req.erbringungsStatus || '';
    document.getElementById('fakturaBemerkung').value = req.fakturaBemerkung || '';
    document.getElementById('fakturaNummer').value = req.fakturaNummer || '';

    // -------------------------
    // DIENSTLEISTUNG CHECKBOXEN BEFÜLLEN
    // -------------------------
    let dlArray = [];
    if (req.Dienstleistung) {
        try {
            dlArray = JSON.parse(req.Dienstleistung);
        } catch (err) {
            dlArray = req.Dienstleistung.split(',');
        }
    }
    for (let i = 1; i < dlArray.length; i++) {
        if (dlArray[i] === "1") {
            const cb = document.querySelector(
                `#appointmentServicesCheckboxContainer .appointment-service-checkbox[data-service-index="${i}"]`
            );
            if (cb) cb.checked = true;
        }
    }

    // -------------------------
    // Submit-Handler einrichten
    // -------------------------
    const appointmentForm = document.getElementById('appointmentForm');
    const oldSubmitButton = appointmentForm.querySelector('button[type="submit"]');
    const newSubmitButton = oldSubmitButton.cloneNode(true);
    oldSubmitButton.parentNode.replaceChild(newSubmitButton, oldSubmitButton);
    newSubmitButton.innerText = 'Bearbeiteter Termin Bestätigen';

    newSubmitButton.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
            const newAppointment = {
                MailAppointmentRequests: req.MailAppointmentRequests,
                erfasstDurch: "öffentliche Buchungsplattform",
                Ressource: req.Ressource || '',
                KundennummerzumTermin: document.getElementById('KundennummerzumTermin').value,
                startDateTime: document.getElementById('startDateTime').value,
                endDateTime: document.getElementById('endDateTime').value,
                duration: parseInt(document.getElementById('durationHours').value, 10) * 60 +
                          parseInt(document.getElementById('durationMinutes').value, 10),
                Preis: document.getElementById('Preis').value,
                Abrechnungsstatus: document.getElementById('Abrechnungsstatus').value,
                description: document.getElementById('description').value,
                Dienstleistung: (() => {
                    const updatedDLArray = new Array(allServices.length).fill("0");
                    updatedDLArray[0] = "1";
                    document.querySelectorAll('#appointmentServicesCheckboxContainer .appointment-service-checkbox:checked')
                        .forEach(cb => {
                            updatedDLArray[parseInt(cb.dataset.serviceIndex, 10)] = "1";
                        });
                    return JSON.stringify(updatedDLArray);
                })(),
                projektId: document.getElementById('projektId').value || null,
                verrechnungsTyp: document.getElementById('verrechnungsTyp').value,
                erbringungsStatus: document.getElementById('erbringungsStatus').value,
                fakturaBemerkung: document.getElementById('fakturaBemerkung').value,
                fakturaNummer: document.getElementById('fakturaNummer').value,
                rechnungsEmpfaengerNummer: document.getElementById('RechnungsempfaengerNummerDisplay').textContent || null
            };

            console.log("[DEBUG] Sende an Backend:", newAppointment);

            const response = await fetch(`${BACKEND_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newAppointment)
            });

            if (!response.ok) throw new Error(`HTTP-Error: ${response.status}`);

            // Request löschen
            await fetch(`${BACKEND_URL}/appointmentrequests/${requestId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const idx = appointmentRequests.findIndex(r => r._id === requestId);
            if (idx !== -1) appointmentRequests.splice(idx, 1);
            
            displayAppointmentRequests(appointmentRequests);
            loadAppointments();
            renderCalendarWithDelay();
            hideAppointmentForm();
            alert('Termin erfolgreich freigegeben!');
        } catch (err) {
            console.error("[DEBUG] Fehler bei der Terminfreigabe:", err);
            alert(`Fehler: ${err.message}`);
        }
    });
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
    
    let dayView = false;                         // false = Wochenansicht, true = Tagesansicht


    //speicherung der arbeitszeiten
  /*  let workingHours = {            //Später aus DB
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

    */
















    //Laden der Fabren der User

    let userColors = []; // Globale Variable, um die Benutzer und ihre Farben zu speichern

    async function loadUserColors() {
        try {
            const response = await fetch(`${BACKEND_URL}/users`); // API-Aufruf
            const users = await response.json(); // Benutzerliste aus der API
            userColors = users.map(user => ({ username: user.username, color: user.color })); // Nur relevante Daten speichern
            console.log("Benutzerfarben geladen:", userColors);
        } catch (error) {
            console.error("Fehler beim Laden der Benutzerfarben:", error);
        }
    }

    //Ausfindig machen der jeweiligen Farbe
    function getUserColor(resourceName) {
        // Benutzer anhand des Namens finden
        const user = userColors.find(u => u.username === resourceName);
    
        // Debugging-Log vor dem Return
        if (user) {
            console.log('Farbe gefunden:', user.color);
        } else {
            console.log('Benutzer nicht gefunden, Fallback-Farbe wird verwendet.');
            console.log('userColors:', userColors);

        }
    
        // Falls der Benutzer existiert, die Farbe zurückgeben, ansonsten eine Fallback-Farbe
        return user ? user.color : "#00FFFF"; // Fallback-Farbe
    }
    


    

    /*******************************************************
     * Initialisierung
     *******************************************************/
    document.addEventListener("DOMContentLoaded", async () => {
        // Buttons / CheckBox-EventListener etc. setzen:
        document.getElementById('viewToggle').addEventListener('change', toggleView);
        document.getElementById('prevBtn').addEventListener('click', () => {
        if (dayView) {
            // Tagesansicht -> 1 Tag zurück
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            // Wochenansicht -> 7 Tage zurück
            currentDate.setDate(currentDate.getDate() - 7);
        }
        renderCalendar(); 
        });
        document.getElementById('nextBtn').addEventListener('click', () => {
        if (dayView) {
            // Tagesansicht -> 1 Tag vor
            currentDate.setDate(currentDate.getDate() + 1);
        } else {
            // Wochenansicht -> 7 Tage vor
            currentDate.setDate(currentDate.getDate() + 7);
        }
        renderCalendar();
        });
    
    
        // Hier könntest du Clients oder Termine laden, z.B.:
        //   allAppointments = await fetchAppointmentsFromBackend();
        //   clients = await fetchClientsFromBackend();
        //   ...
        //   Danach:
        renderCalendar();
    });


    /*******************************************************
     * Umschalten: Tagesansicht <-> Wochenansicht
     *******************************************************/
    function toggleView() {
        const toggle = document.getElementById('viewToggle');
        dayView = toggle.checked; // z.B. wenn 'checked' == true => Wochenansicht, 
                                //     aber du kannst es auch umdrehen
        updateNavigationButtons();
        renderCalendar();
    }
    
    /**
     * Passt die Beschriftung der Vor/Zurück-Buttons an.
     * Je nach dayView entweder "Tag" oder "Woche".
     */
    function updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (dayView) {
        prevBtn.textContent = "Vorheriger Tag";
        nextBtn.textContent = "Nächster Tag";
        } else {
        prevBtn.textContent = "Vorherige Woche";
        nextBtn.textContent = "Nächste Woche";
        }
    }






    
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

    /*******************************************************
 * Haupt-Funktion: renderCalendar()
 * -> Ruft je nach Modus renderDay oder renderWeek auf
 *******************************************************/
function renderCalendarWithDelay() {
    setTimeout(renderCalendar, 500);
}


/*******************************************************
 * Haupt-Funktion: renderCalendar()
 * -> Ruft je nach Modus renderDay oder renderWeek auf
 *******************************************************/
async function renderCalendar() {
    console.log('renderCalender ausgeführt');
    loadUserColors()
    if (dayView) {
      renderDay();
    } else {
      renderWeek();
      console.log('renderweek aufgerufen');
    }
  }
/*******************************************************
 * Tagesansicht
 *  - Zeigt nur den aktuellen Tag an
 *  - Jeder aktivierte Benutzer (Ressource) bekommt eine eigene Spalte
 *  - Termine außerhalb der Arbeitszeit werden berücksichtigt
 *  - Startet nicht mehr fix bei 06:00, sondern nutzt denselben Mechanismus 
 *    wie in renderWeek (Fallback 08:00–18:00).
 *******************************************************/
async function renderDay() {
    // 1) Kalender leeren
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
  
    // 2) Slots vom Backend holen (Arbeitszeit + isAvailable + holidayResources)
    const slots = await fetchAvailableSlots();
    if (!slots || !slots.length) {
      console.warn('Keine Slots zum Anzeigen gefunden (Tagesansicht).');
    }
  
    // 3) Aktuellen Tag bestimmen (0 Uhr)
    const dayDate = new Date(currentDate);
    dayDate.setHours(0, 0, 0, 0);
  
    // 4) Nutzer (Ressourcen) ermitteln
    const selectedUsers = getSelectedUsers();
  
    // 5) Grid: 1 Zeitspalte + pro Benutzer 1 Spalte
    calendar.style.gridTemplateColumns = `80px repeat(${selectedUsers.length}, 1fr)`;
  
    // Leere Ecke oben links
    const emptyCorner = document.createElement('div');
    emptyCorner.textContent = "";
    calendar.appendChild(emptyCorner);
  
    // Tages-Header je Benutzer (z.B. "MASTER - 2025-01-12")
    for (const userResource of selectedUsers) {
      const dayHeader = document.createElement('div');
      dayHeader.classList.add('day-header');
      dayHeader.textContent = `${userResource.toUpperCase()} - ${formatDate(dayDate)}`;
      calendar.appendChild(dayHeader);
    }
  
    // 6) Slots nur für **diesen Tag** (falls dein Backend mehrere Tage liefert)
    const daySlots = slots.filter(slot => {
      const slotDate = new Date(slot.startDateTime);
      return slotDate.toDateString() === dayDate.toDateString();
    });
  
    // 7) Tages-Termine (z. B. aus allAppointments) filtern,
    //    damit wir Zeiten außerhalb der Arbeitszeit ermitteln können
    const startOfDay = new Date(dayDate);
    const endOfDay = new Date(dayDate);
    endOfDay.setHours(23, 59, 59, 999);
  
    // Du hast global z.B. allAppointments
    const appointmentsThisDay = allAppointments.filter(app => {
      const appStart = new Date(app.startDateTime);
      return appStart >= startOfDay && appStart <= endOfDay;
    });
  
    // Nur aktive Ressourcen (Benutzer)
    const filteredAppointments = appointmentsThisDay.filter(app => {
      return selectedUsers.includes(app.Ressource);
    });
  
    // 8) Erzeuge ein Array an Startzeiten (Slots + Appointments), um minTime/maxTime zu bestimmen
    const slotTimes = daySlots.map(slot => {
      const d = new Date(slot.startDateTime);
      return d.getHours() * 60 + d.getMinutes();
    });
    const appointmentTimes = filteredAppointments.map(app => {
      const d = new Date(app.startDateTime);
      return d.getHours() * 60 + d.getMinutes();
    });
    const combinedTimes = [...slotTimes, ...appointmentTimes];
  
    // 9) Fallback z. B. 8:00–18:00 (passt du an, wie du willst)
    let minTime = 8 * 60;   // 08:00
    let maxTime = 18 * 60;  // 18:00
  
    // Wenn wir tatsächlich frühere/spätere Daten haben => anpassen
    if (combinedTimes.length > 0) {
      const calcMin = Math.min(...combinedTimes);
      const calcMax = Math.max(...combinedTimes);
  
      if (calcMin < minTime) minTime = calcMin;
      if (calcMax > maxTime) maxTime = calcMax;
    }
  
    const startHour = Math.floor(minTime / 60);
    const endHour = Math.ceil(maxTime / 60);
  
    // 10) Slots in eine Map legen: "hour-minute" => slotInfo
    //     (Da wir keinen `slot.ressource` nutzen, gehört jeder Slot potenziell allen.)
    const slotsMap = {};
    daySlots.forEach(slot => {
      const slotDate = new Date(slot.startDateTime);
      const hour = slotDate.getHours();
      const minute = slotDate.getMinutes();
      const key = `${hour}-${minute}`;
      slotsMap[key] = slot;
    });
  
    // 11) defaultSlotLength (z.B. 15/30 Min)
    const defaultSlotLength = parseInt(document.getElementById('defaultAppointmentLength').value, 10) || 30;
    const slotsPerHour = 60 / defaultSlotLength;
  
    // 12) Zeilen erzeugen: stündlich + pro User + pro Slot
    for (let hour = startHour; hour <= endHour; hour++) {
      // Zeit-Spalte
      const timeLabel = document.createElement('div');
      timeLabel.classList.add('time-slot');
      timeLabel.textContent = (hour < 10 ? '0' + hour : hour) + ':00';
      calendar.appendChild(timeLabel);
  
      // Pro Benutzer
      for (const userResource of selectedUsers) {
        const cell = document.createElement('div');
        cell.classList.add('hour-cell');
        cell.style.position = 'relative';
        cell.dataset.userResource = userResource;
        cell.dataset.hour = hour;
  
        // Container (damit man absolute Positionierung nutzen kann)
        const cellContainer = document.createElement('div');
        cellContainer.style.position = 'relative';
        cellContainer.style.height = '100%';
  
        // Schleife über die Blöcke (z.B. 15/30-Min-Schritte)
        for (let s = 0; s < slotsPerHour; s++) {
          const minute = s * defaultSlotLength;
          const key = `${hour}-${minute}`;
          const slotInfo = slotsMap[key]; // evtl. undefined
  
          // Neuer Div
          const slotDiv = document.createElement('div');
          slotDiv.classList.add('time-slot-div');
          slotDiv.style.position = 'absolute';
          slotDiv.style.top = (s * (100 / slotsPerHour)) + '%';
          slotDiv.style.height = (100 / slotsPerHour) + '%';
          slotDiv.style.left = '0';
          slotDiv.style.right = '0';
          slotDiv.style.zIndex = '1';
  
          /*****************************
           *  HOLIDAY / AVAILABLE / UNAVAILABLE
           *****************************/
          if (slotInfo) {
            const holidayRes = slotInfo.holidayResources || [];
            const isHolidayAll = holidayRes.includes('all');
            const userIsHoliday = holidayRes.includes(userResource);
  
            // => Holiday-Klassen
            if (isHolidayAll) {
              slotDiv.classList.add('unavailable-holiday-all');
            } else if (userIsHoliday) {
              slotDiv.classList.add('unavailable-holiday-user');
            }
  
            // => Verfügbarkeit (aus slotInfo.isAvailable[userResource])
            let userIsAvailable = false;
            if (slotInfo.isAvailable && typeof slotInfo.isAvailable === 'object') {
              userIsAvailable = !!slotInfo.isAvailable[userResource];
            }
            // falls holiday => userIsAvailable = false
            if (isHolidayAll || userIsHoliday) {
              userIsAvailable = false;
            }
  
            // => CSS-Klasse
            if (userIsAvailable) {
              slotDiv.classList.add('available-slot');
            } else {
              slotDiv.classList.add('unavailable-slot');
            }
          } else {
            // kein Slot => außerhalb der Arbeitszeit => unavailable
            slotDiv.classList.add('unavailable-slot');
          }
  
          // Klick-Event
          slotDiv.addEventListener('click', function () {
            handleSlotClick(dayDate, userResource, hour, minute, defaultSlotLength);
          });
  
          cellContainer.appendChild(slotDiv);
        }
        cell.appendChild(cellContainer);
        calendar.appendChild(cell);
      }
    }
  
    // 13) Abschließend die Termine platzieren
    displayDayAppointments(dayDate, selectedUsers);
  }
  
  
  
  
  /*******************************************************
   * Termine für den Tag platzieren
   *******************************************************/
 
function displayDayAppointments(day, selectedUsers) {
    // 1) Finde alle Termine, die an *diesem Tag* sind
    const dayStart = new Date(day);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
  
    // Filter: nur Termine, die in selectedUsers und innerhalb dieses Tages liegen
    const appointmentsThisDay = allAppointments.filter(app => {
      const start = new Date(app.startDateTime);
      const end = app.endDateTime
        ? new Date(app.endDateTime)
        : new Date(start.getTime() + app.duration * 60000);
  
      // Check Resource
      // Falls dein Feld "app.Ressource" lautet, nimm 'app.Ressource'
      const inSelectedUser = selectedUsers.includes(app.Ressource);
  
      // Check Datum
      const overlapsDay = (start <= dayEnd && end >= dayStart);
  
      return inSelectedUser && overlapsDay;
    });
  
    // 2) Finde überlappende Termine (damit wir sie nebeneinander platzieren können)
    const overlappingGroups = findOverlappingAppointments(appointmentsThisDay);
  
    // 3) Platziere jede Gruppe
    overlappingGroups.forEach(group => {
      const groupSize = group.length;
      group.forEach((app, index) => {
        const appStart = new Date(app.startDateTime);
        const appEnd = app.endDateTime
          ? new Date(app.endDateTime)
          : new Date(appStart.getTime() + app.duration * 60000);
  
        const hour = appStart.getHours();
        // Finde die passende hour-cell:
        //   in der Tagesansicht haben wir ein data-userResource + data-hour
        const userResource = app.Ressource; // z.B. "user3"
        const selector = `.hour-cell[data-hour='${hour}'][data-user-resource='${userResource}']`;
        const hourCell = document.querySelector(selector);
        if (!hourCell) return;
  
        // Termin-DIV erzeugen
        const appointmentDiv = document.createElement('div');
        appointmentDiv.classList.add('appointment');
        appointmentDiv.setAttribute('data-app-id', app._id);
  
        // CSS: z.B. zeitlich korrekt positionieren
        const durationHours = (appEnd - appStart) / (1000*60*60);
        appointmentDiv.style.position = "absolute";
        appointmentDiv.style.top = `${(appStart.getMinutes() / 60) * 100}%`;
        appointmentDiv.style.height = `${durationHours * 100}%`;
        appointmentDiv.style.width = `${100 / groupSize}%`;
        appointmentDiv.style.left = `${(100 / groupSize) * index}%`;
        appointmentDiv.style.zIndex = "2";
  
        // Farbe
        appointmentDiv.style.backgroundColor = getUserColor(app.Ressource);
  
        // Inhalt (Kunde, Dienstleistung etc.)
        // Falls du "app.KundennummerzumTermin" hast, suche den Client:
        const clientAppointment = clients.find(c => c.Kundennummer === app.KundennummerzumTermin);
  
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
  
        const appointmentContent = document.createElement('div');
        //AUS UNTENSTEHENDEM STRING VORÜBERGEHEND ENTFERNT: ${app.Preis ?? ''} ${app.Dienstleistung ?? ''}
        appointmentContent.innerHTML = `
          <div>
            ${
              clientAppointment
                ? `<strong>${clientAppointment.Vorname} ${clientAppointment.Nachname}</strong><br>
                   `
                : "Kunde nicht erfasst"
            }
          </div>
        `;
  
        appointmentDiv.appendChild(iconContainer);
        appointmentDiv.appendChild(appointmentContent);
  
        hourCell.appendChild(appointmentDiv);
      });
    });
  }
  
  
  /*******************************************************
 * Wochenansicht
 *******************************************************/
async function renderWeek() {
    // 1) Zuerst Kalender-HTML leeren
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
  
    // 2) Asynchron Slots (Arbeitszeit) vom Backend laden
    const slots = await fetchAvailableSlots();
    if (!slots || !slots.length) {
      console.warn('Keine Slots zum Anzeigen gefunden (eventuell keine Arbeitszeiten definiert?).');
    }
  
    // 3) Bestimme Start und Ende der aktuellen Woche
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 Tage
  
    // 4) Lade/Filtere Termine dieser Woche
    //    Wir greifen auf die globale allAppointments zu (wie in displayWeekAppointments).
    //    Achtung: Falls allAppointments leer ist, musst du ggf. ein fetch() machen.
    const appointmentsThisWeek = allAppointments.filter(app => {
      const appStartDate = new Date(app.startDateTime);
      return appStartDate >= startOfWeek && appStartDate < endOfWeek;
    });
  
    // 5) Auf aktuell gewählte User (Ressourcen) filtern
    const selectedUsers = getSelectedUsers();
    const filteredAppointments = appointmentsThisWeek.filter(app => {
      return selectedUsers.includes(app.Ressource);
    });
  
    // 6) Erzeuge aus slots und appointmentsTogether ein gemeinsames Array aller Startzeiten
    //    - slots → wir holen Stunde+Minute raus
    //    - appointments → wir holen Stunde+Minute raus
    const slotTimes = slots.map(slot => {
      const d = new Date(slot.startDateTime);
      return d.getHours() * 60 + d.getMinutes();
    });
  
    const appointmentTimes = filteredAppointments.map(app => {
      const d = new Date(app.startDateTime);
      return d.getHours() * 60 + d.getMinutes();
    });
  
    // Kombiniere die Zeiten
    const combinedTimes = [...slotTimes, ...appointmentTimes];
  
    // 7) Ermittle minTime / maxTime (Fälle: keine Daten => fallback 8:00–18:00)
    let minTime = 8 * 60;   // Standard = 08:00
    let maxTime = 18 * 60;  // Standard = 18:00
    if (combinedTimes.length > 0) {
      const calculatedMin = Math.min(...combinedTimes);
      const calculatedMax = Math.max(...combinedTimes);
      minTime = calculatedMin < minTime ? calculatedMin : minTime;
      maxTime = calculatedMax > maxTime ? calculatedMax : maxTime;
    }
  
    const startHour = Math.floor(minTime / 60);
    const endHour = Math.ceil(maxTime / 60);
  
    // 8) Grid-Layout: 8 Spalten (Zeitspalte + 7 Tage)
    calendar.style.gridTemplateColumns = '80px repeat(7, 1fr)';
  
    // Leere Ecke oben links
    const emptyCorner = document.createElement('div');
    emptyCorner.textContent = "";
    calendar.appendChild(emptyCorner);
  
    // Tagesüberschriften (Montag - Sonntag)
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      const dayHeader = document.createElement('div');
      dayHeader.classList.add('day-header');
      dayHeader.textContent = getDayName(day) + ', ' + formatDate(day);
      calendar.appendChild(dayHeader);
    }
  
    // 9) Map für Slots anlegen (um hinterher schnell abzufragen, ob holiday/available)
    const slotsMap = {};
    slots.forEach(slot => {
      // dayIndex aus Datum (Montag=0)
      const date = new Date(slot.startDateTime);
      const dayIndex = (date.getDay() + 6) % 7;
      const hour = date.getHours();
      const minute = date.getMinutes();
      const key = `${dayIndex}-${hour}-${minute}`;
      slotsMap[key] = slot;
    });
  
    // 10) defaultSlotLength z. B. 15/30 Min
    const defaultSlotLength = parseInt(document.getElementById('defaultAppointmentLength').value, 10) || 30;
    const slotsPerHour = 60 / defaultSlotLength;
  
    // 11) Zeilen erzeugen: für jede volle Stunde und Tag 0..6
    for (let hour = startHour; hour <= endHour; hour++) {
      // Zeit-Spalte links
      const timeLabel = document.createElement('div');
      timeLabel.classList.add('time-slot');
      timeLabel.textContent = (hour < 10 ? '0' + hour : hour) + ':00';
      calendar.appendChild(timeLabel);
  
      // Für 7 Tage ...
      for (let i = 0; i < 7; i++) {
        const cell = document.createElement('div');
        cell.classList.add('hour-cell');
        cell.style.position = 'relative';
        cell.dataset.dayIndex = i;
        cell.dataset.hour = hour;
  
        // Container für die Slots pro Stunde
        const cellContainer = document.createElement('div');
        cellContainer.style.position = 'relative';
        cellContainer.style.height = '100%';
  
        // Innerhalb der Stunde die Blöcke (z. B. 2 × 30min oder 4 × 15min)
        for (let s = 0; s < slotsPerHour; s++) {
          const minute = s * defaultSlotLength;
          const key = `${i}-${hour}-${minute}`;
          const slotInfo = slotsMap[key];
  
          // Div für diesen Zeitblock
          const slotDiv = document.createElement('div');
          slotDiv.classList.add('time-slot-div');
          slotDiv.style.position = 'absolute';
          slotDiv.style.top = (s * (100 / slotsPerHour)) + '%';
          slotDiv.style.height = (100 / slotsPerHour) + '%';
          slotDiv.style.left = '0';
          slotDiv.style.right = '0';
          slotDiv.style.zIndex = '1';
  
          // holiday/unavailable/available?
          if (slotInfo) {
            const holidayRes = slotInfo.holidayResources || [];
            const isHolidayAll = holidayRes.includes('all');
            const activeHolidayRes = holidayRes.filter(user => selectedUsers.includes(user));
            const isHolidayPartial = !isHolidayAll && activeHolidayRes.length > 0;
  
            // Holiday-Logik ...
            if (isHolidayAll && selectedUsers.length > 0) {
              slotDiv.classList.add('unavailable-holiday-all');
            } else if (isHolidayPartial) {
              slotDiv.classList.add('unavailable-holiday-user');
            }
  
            let allUnavailable = true;
            if (slotInfo.isAvailable && typeof slotInfo.isAvailable === 'object') {
              allUnavailable = selectedUsers.every(user =>
                !slotInfo.isAvailable[user] || activeHolidayRes.includes(user)
              );
            }
            if (!allUnavailable) {
              slotDiv.classList.add('available-slot');
            } else {
              slotDiv.classList.add('unavailable-slot');
            }
          } else {
            // Kein Slot => außerhalb der Arbeitszeit => unbekannt => als unavailable kennzeichnen
            slotDiv.classList.add('unavailable-slot');
          }
  
          // Klick-Event -> handleSlotClick
          slotDiv.addEventListener('click', function() {
            handleSlotClick(startOfWeek, i, hour, minute, defaultSlotLength);
          });
  
          cellContainer.appendChild(slotDiv);
        }
  
        cell.appendChild(cellContainer);
        calendar.appendChild(cell);
      }
    }
  
    // 12) Jetzt die Termine in die Zellen "malen"
    //     (Wird in displayWeekAppointments() gemacht.)
    displayWeekAppointments(startOfWeek);
  }
  
  
  
  /**
   * Termine für die Woche platzieren
   */
  async function displayWeekAppointments(startOfWeek) {
    console.log('displayWeekAppointments ausgeführt');
    
    // Lade die Clients nur einmal, falls noch nicht geschehen
    if (!clients || clients.length === 0) {
        const clientsResponse = await fetch(`${BACKEND_URL}/clients`);
        clients = await clientsResponse.json();
    }

    // Filtere Termine dieser Woche (Montag bis Sonntag)
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    const appointmentsThisWeek = allAppointments.filter(app => {
        const appStartDate = new Date(app.startDateTime);
        return appStartDate >= startOfWeek && appStartDate < endOfWeek;
    });

    // NEU: Filtere Termine basierend auf der ausgewählten Ressource
    const selectedUsers = getSelectedUsers();
    const filteredAppointments = appointmentsThisWeek.filter(app => {
        return selectedUsers.includes(app.Ressource); // Nur Termine anzeigen, deren Ressource aktiv ist
    });

    // Finde Gruppen überlappender Termine
    const overlappingGroups = findOverlappingAppointments(filteredAppointments);

    // Platziere jede Gruppe im Kalender
    overlappingGroups.forEach(group => {
        const groupSize = group.length;
        group.forEach((app, index) => {
            // Start/End aus DB
            const appStartDate = new Date(app.startDateTime);
            const appEndDate = app.endDateTime
                ? new Date(app.endDateTime)
                : new Date(appStartDate.getTime() + app.duration * 60000);

            // Berechne, an welchem Tag im Grid das liegt (Montag=0, Sonntag=6)
            const dayIndex = (appStartDate.getDay() + 6) % 7;
            const startHour = appStartDate.getHours();
            const endHour = appEndDate.getHours();

            // Für jede Stunde zwischen StartHour und EndHour
            for (let hour = startHour; hour <= endHour; hour++) {
                const calendar = document.getElementById('calendar');
                // Achtung: Template-String mit Backticks!
                const cellSelector = `.hour-cell[data-day-index='${dayIndex}'][data-hour='${hour}']`;
                const hourCell = calendar.querySelector(cellSelector);

                if (hourCell) {
                    // Zeichne den Termin nur einmal in der ersten Stunde
                    if (hour === startHour) {
                        const appointmentDiv = document.createElement('div');
                        appointmentDiv.classList.add('appointment');
                        appointmentDiv.setAttribute('data-app-id', app._id);

                        // Gesamtdauer in Stunden
                        const durationHours = (appEndDate.getTime() - appStartDate.getTime()) / (60 * 60 * 1000);

                        // Dynamische CSS (z.B. für mehrere überlappende Termine)
                        // Achtung: überall Backticks benutzen!
                        appointmentDiv.style.gridRow = `span ${Math.ceil(durationHours)}`;
                        appointmentDiv.style.top = `${(appStartDate.getMinutes() / 60) * 100}%`;
                        appointmentDiv.style.height = `${durationHours * 100}%`;
                        appointmentDiv.style.width = `${100 / groupSize}%`;
                        appointmentDiv.style.left = `${(100 / groupSize) * index}%`;
                        appointmentDiv.style.zIndex = '2';

                        // Terminfarbe basierend auf dem Resource-Feld
                        appointmentDiv.style.backgroundColor = getUserColor(app.Ressource);

                        // Icons
                        const iconContainer = document.createElement('div');
                        iconContainer.classList.add('appointment-icons');
                        iconContainer.innerHTML = `
                            <span class="icon edit-icon" title="Bearbeiten">✏️</span>
                            <span class="icon delete-icon" title="Löschen">🗑️</span>
                        `;
                        // Klicks
                        iconContainer.querySelector('.edit-icon').addEventListener('click', () => {
                            editAppointment(app._id);
                        });
                        iconContainer.querySelector('.delete-icon').addEventListener('click', () => {
                            deleteAppointment(app._id);
                        });

                        // Text-Inhalt (Client + Dienstleistung)
                        const clientAppointment = clients.find(client => client.Kundennummer === app.KundennummerzumTermin);
                        const appointmentContent = document.createElement('div');
                        //AUS UNTENSTEHENDEM STRING VORÜBERGEHEND ENTFERNT: ${app.Preis ?? ''} ${app.Dienstleistung} ?? ''
                        appointmentContent.innerHTML = `
                            <div>
                                ${
                                    clientAppointment 
                                        ? `<strong>${clientAppointment.Vorname} ${clientAppointment.Nachname}</strong>
                                           <br>
                                           `
                                        : "Kunde nicht erfasst"
                                }
                            </div>
                        `;

                        appointmentDiv.appendChild(iconContainer);
                        appointmentDiv.appendChild(appointmentContent);
                        hourCell.appendChild(appointmentDiv);
                    }
                }
            }
        });
    });

    // Interne Funktion zur Erkennung von Überschneidungen
    function logOverlappingAppointments() {
        // Falls du hier noch etwas debuggen willst ...
    }
    logOverlappingAppointments();
}
  


    /*******************************************************
     * Hilfsfunktionen für 
     *******************************************************/

    /**
     * Gibt ein Array der ausgewählten User-Resources (z.B. ["user1", "user2"]) zurück.
     */// Umbenannte Funktion
    function DisplayUsersButtons(users) {
        const container = document.getElementById('user-buttons-container');
        container.innerHTML = '';

        users.forEach(user => {
            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('user-filter-button', 'active');
            button.textContent = user.username;
            button.dataset.username = user.username;
            
            button.addEventListener('click', () => {
                button.classList.toggle('active');
                renderCalendar(); // Verwenden Sie Ihre existierende renderCalendar-Funktion
            });
            
            container.appendChild(button);
        });
    }
    // Angepasste Auswahlfunktion
        function getSelectedUsers() {
            return Array.from(document.querySelectorAll('.user-filter-button.active'))
                        .map(btn => btn.dataset.username);
        }
            /**
     * Formatierte Zeit (HH:MM)
     */
    function formatTime(date) {
        const h = date.getHours().toString().padStart(2,'0');
        const min = date.getMinutes().toString().padStart(2,'0');
        return `${h}:${min}`;
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
    function handleSlotClick(startOfWeek, dayIndex, hour, minute, defaultSlotLength) {
        const selectedDate = new Date(startOfWeek);
        selectedDate.setDate(startOfWeek.getDate() + dayIndex);
        selectedDate.setHours(hour, minute, 0, 0);
    
        const workingHoursForDay = workingHours[getDayName(selectedDate).toLowerCase()];
        let alertMessage = null;
        
        clearAppointmentForm(currentUserName);
        console.log('clearaufgeführt')
        // Arbeitszeitprüfung
        if (!isWithinWorkingHours(selectedDate, workingHoursForDay)) {
            alertMessage = "Achtung Termin befindet sich ausserhalb der definierten Arbeitszeit.";
        }
    
        // Konfliktprüfung
        const overlappingAppointment = allAppointments.some(app => {
            const appStart = new Date(app.startDateTime);
            const appEnd = new Date(appStart.getTime() + app.duration * 60000);
            const slotEnd = new Date(selectedDate.getTime() + defaultSlotLength * 60000);
            return (selectedDate < appEnd && appStart < slotEnd);
        });
    
        if (overlappingAppointment) {
            alertMessage = "Achtung Termin überschneidet anderen Termin.";
        }
    
        if (alertMessage) {
            alert(alertMessage);
        }
    
        // In der handleSlotClick-Funktion oder einer Hilfsfunktion:
        function isSlotAvailableForUser(slot, user) {
            // Prüft, ob der Slot für den angegebenen User verfügbar ist
            const isHoliday = slot.holidayResources?.includes(user) || 
                             slot.holidayResources?.includes('all');
            
            const isAvailable = slot.isAvailable?.[user] !== false;
            
            return !isHoliday && isAvailable;
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
        const defHours = Math.floor(defaultSlotLength / 60);
        const defMins = defaultSlotLength % 60;
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
        cKOoOfl9206lZzZNFG(); // Kalender mit Terminen anzeigen
        displayAppointments(allAppointments); // Terminliste anzeigen
    }
/*    
// Nun kannst du auf die clients-Daten in displayAppointmentsOnCalendar zugreifen:
async function displayAppointmentsOnCalendar() {
    const startOfWeek = getStartOfWeek(currentDate);
    console.log('displayAppointmentsOnCalendar() ausgeführt');
    // Lade die Clients nur einmal, falls noch nicht geschehen
    if (!clients || clients.length === 0) {
        const clientsResponse = await fetch(`${BACKEND_URL}/clients`);
        clients = await clientsResponse.json();
    }

    // Filtere Termine der aktuellen Woche
    const appointmentsThisWeek = allAppointments.filter(app => {
        const appStartDate = new Date(app.startDateTime);
        const isInWeek = appStartDate >= startOfWeek && 
                       appStartDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        // Geänderte Zeile: Überprüfung auf Ressource statt user
        const isUserSelected = getSelectedUsers().includes(app.Ressource);
        return isInWeek && isUserSelected;        
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

            const dayIndex = (appStartDate.getDay() + 6) % 7; // Montag=0, Sonntag=6
//console.log('Behandele appStartDate:' + appStartDate)
            const startHour = appStartDate.getHours();
            const endHour = appEndDate.getHours();

            for (let hour = startHour; hour <= endHour; hour++) {
                const calendar = document.getElementById('calendar');
                const cellSelector = `.hour-cell[data-day-index='${dayIndex}'][data-hour='${hour}']`;
                const hourCell = calendar.querySelector(cellSelector);
                


                if (hourCell) {

                    if (hour === startHour) 
                        {
                            
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
                        
                        //AUS DEM STRING VORÜBERGEHEND ENTFERNT DA NICHT KORREKT ANGEZEIGT
                        //<br> ${app.Preis} ${app.Dienstleistung}
                        
                        appointmentContent.innerHTML = `
                            <div>
                                ${clientAppointment
                                    ? `<strong>${clientAppointment.Vorname} ${clientAppointment.Nachname}</strong>
                                       `
                                    : "Kunde nicht gefunden"
                                }
                            </div>`;

                        appointmentDiv.appendChild(iconContainer);
                        appointmentDiv.appendChild(appointmentContent);

                        hourCell.appendChild(appointmentDiv);
                        
                    }
                    else {
                        
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
*/




    
    
    
    
    // Aufruf der Initialisierung, um die Daten zu laden und die Kalender- sowie Terminansichten zu aktualisieren
    initializeAppointments();
    

 



   
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
function clearAppointmentForm(currentUserName) { 
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
    document.getElementById('erfasstDurch').value = currentUserName;

    document.getElementById('projektId').value = '';
    document.getElementById('verrechnungsTyp').value = '-- bitte wählen --';
    document.getElementById('erbringungsStatus').value = '-- bitte wählen --';
    document.getElementById('fakturaBemerkung').value = '';
    document.getElementById('fakturaNummer').value = '';

    // Aktuellen Benutzer im Dropdown "Ressource" auswählen
    const dropdown = document.getElementById('Ressource');
    if (dropdown) {
        dropdown.value = currentUserName; // Setze den aktuellen Benutzer
        console.log(`Dropdown-Wert auf "${currentUserName}" gesetzt.`);
    } else {
        console.warn('Dropdown "Ressource" nicht gefunden.');
    }

    // Checkboxen alle entchecken
    const checkboxes = document.querySelectorAll('#appointmentServicesCheckboxContainer .appointment-service-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
    });
}


// Dropdown mit Benutzern füllen und aktuellen Benutzer wählen
function populateDropdownWithUsersForAppointmentForm(users) {
    const dropdown = document.getElementById('Ressource');
    dropdown.innerHTML = ''; // Bestehende Optionen entfernen

    // Alle Benutzer hinzufügen
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.username; // Verwende die ID oder den Benutzernamen als Wert
        option.textContent = user.username; // Benutzernamen anzeigen

        // Option hinzufügen
        dropdown.appendChild(option);
    });
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
    clearAppointmentForm(currentUserName);
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
    clearAppointmentForm(currentUserName);
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
    // 1) Kunden laden (für Kundendatenanzeige)
    const clientsResponse = await fetch(`${BACKEND_URL}/clients`);
    const clients = await clientsResponse.json();

    // 2) Falls du hier noch nicht allServices geladen hast:
    if (!allServices || allServices.length === 0) {
        await loadServices(); 
        // Jetzt haben wir in allServices das Array aller Services
    }

    const appointmentsList = document.getElementById('appointmentsList');
    
    appointmentsList.innerHTML = appointments.map(app => {
        const client = clients.find(c => c.Kundennummer === app.KundennummerzumTermin);

    // Aus dem Termin: "Haarschnitt,Färben,Nagelpflege"
    
        const dlString = app.Dienstleistung; 
        // => '["1","0","0","1","0"]'
    
        //Folgende umwandlung muss entfernt werden und dafür aber sicherstellen dass die werte direkt im richtigen format daher kommen.
    let dlArray = [];
    if (dlString.startsWith('[') && dlString.endsWith(']')) {
        // Gültiger JSON-String => Parsen
        dlArray = JSON.parse(dlString);
    } else {
        // Kommagetrennter String => Umwandeln in Array
        dlArray = dlString.split(',');
    }

        // Falls es ein JSON-String ist: dlArray = JSON.parse(app.Dienstleistung)


        // Index 0 ignorieren wir hier (oder du zeigst ihn woanders separat).
        // Wir bauen uns eine Liste aller aktiven Services ab Index 1:
        let additionalServicesHTML = '';
        for (let i = 1; i < dlArray.length; i++) {
            if (dlArray[i] === "1") {
                // => allServices[i] muss existieren
                if (allServices[i]) {
                    additionalServicesHTML += `<div>${allServices[i].serviceName}</div>`;
                } else {
                    // Falls dein Termin alt ist, aber das System inzwischen mehr/weniger Services hat,
                    // kann das passieren. Ggf. abfangen oder 'Unbekannter Service #...'
                    additionalServicesHTML += `<div>Unbekannter Service #${i}</div>`;
                }
            }
        }
        if (!additionalServicesHTML) {
            additionalServicesHTML = '<div>Keine weiteren Services aktiviert</div>';
        }
        console.log('dlArray.length' + dlArray.length);

        // Start/Endzeit berechnen
        const appStart = new Date(app.startDateTime);
        const appEnd = app.endDateTime 
            ? new Date(app.endDateTime)
            : new Date(appStart.getTime() + (app.duration * 60000));
        
        

        return `
            <div class="termin-card">
                <!-- Spalte A: Kundendaten -->
                <div class="termin-info">
                    ${client ? `${client.Vorname} ${client.Nachname}` : "Kunde nicht erfasst"}
                    <!-- usw. -->
                </div>
                <!-- Spalte B: Services ab Index 1 -->
                <div class="termin-info">
                    ${additionalServicesHTML}
                </div>
                <!-- Spalte C: weitere Termindetails -->
                <div class="termin-info">
                    <div>
                        ${appStart.toLocaleDateString()} 
                        ${appStart.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        -
                        ${appEnd.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                    </div>
                    <div>Dauer: ${app.duration} Min</div>
                    <div>Preis: ${app.Preis || ''}</div>
                    <div>Status: ${app.Abrechnungsstatus || ''}</div>
                    <div>${app.description || ''}</div>
                </div>
                <!-- Spalte D: Aktionen -->
                <div class="termin-actions">
                    <button class="action-btn appointment-edit-btn" data-app-id="${app._id}">✏️</button>
                    <button class="action-btn appointment-delete-btn" data-app-id="${app._id}">🗑️</button>
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


    // 5.5) Abfrage der Checkboxen => Wir bauen ein Array mit "0"/"1" in der Länge allServices
    //    Zunächst ein Basis-Array mit "0" füllen:
    const dlArray = new Array(allServices.length).fill("0"); 

    // 5.5.a) Index0 soll immer "1" sein (laut Vorgabe, "immer aktiv")
    dlArray[0] = "1";

    // 5.5.b) Für alle angehakten Checkboxen => "1"
    const checkedBoxes = document.querySelectorAll('#appointmentServicesCheckboxContainer .appointment-service-checkbox:checked');
    checkedBoxes.forEach(cb => {
        // das data-service-index sagt uns, um welchen Service-Index es geht
        const idx = parseInt(cb.dataset.serviceIndex, 10);
        dlArray[idx] = "1";
    });

    // 6) Request-Body (Mongoose-Felder) zusammenstellen
    const newAppointment = {
        // Standard-Felder
        KundennummerzumTermin,
        startDateTime: startVal,
        endDateTime: endVal,
        duration: totalDuration,
        Dienstleistung: JSON.stringify(dlArray),
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
            renderCalendarWithDelay();
            alert('Termin erfolgreich hinzugefügt!');
            hideAppointmentForm();
            loadAppointments();
        } else {
            alert('Fehler beim Hinzufügen des Termins'+ response);
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

function updateTotalPrice(services) {
    const checkboxes = document.querySelectorAll('.appointment-service-checkbox');
    let totalPrice = 0;

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const index = checkbox.dataset.serviceIndex;
            totalPrice += services[index].servicePrice; // Preis addieren
        }
    });

    // Den berechneten Preis in das Feld mit der ID "Preis" schreiben
    const priceField = document.getElementById('Preis');
    if (priceField) {
        priceField.value = totalPrice.toFixed(2); // Preis als Zahl mit zwei Dezimalstellen anzeigen
    }
}

function attachPriceCalculation(services) {
    const checkboxes = document.querySelectorAll('.appointment-service-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateTotalPrice(services);
        });
    });
}



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
        alert('Kunde nicht erfasst');
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
 * 1) Hilfsfunktion: Deutsche Datumsformatierung und DropDowninitialisierung
 **************************************************************/
function formatGermanDate(dateString) {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return dateString; // Fallback
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
}
/*
function populateDropdownWithUsersForHolidayForm(users) {
    const dropdown = document.getElementById('holidayResourceDropdown');
    dropdown.innerHTML = ''; // Bestehende Optionen entfernen

    // Option "-- bitte wählen --" hinzufügen
    const defaultOption = document.createElement('option');
    defaultOption.value = ""; // Kein Wert für die Auswahl
    defaultOption.textContent = "-- bitte wählen --";
    defaultOption.disabled = true; // Auswahl nicht möglich
    defaultOption.selected = true; // Standardauswahl
    dropdown.appendChild(defaultOption);

    // Option "Alle (Betriebsurlaub)" hinzufügen
    const allOption = document.createElement('option');
    allOption.value = "all";
    allOption.textContent = "Alle (Betriebsurlaub)";
    dropdown.appendChild(allOption);

    // Alle Benutzer hinzufügen
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.username; // Verwende den Benutzernamen als Wert
        option.textContent = user.publicName || user.username; // Zeige den öffentlichen Namen oder Benutzernamen
        dropdown.appendChild(option);
    });

    // Event-Listener für die Auswahl im Dropdown
    dropdown.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        document.getElementById('holidayResource').value = selectedValue;
    });
}*/


// Dropdown mit Benutzern füllen und aktuellen Benutzer wählen
function populateDropdownWithUsersForHolidayForm(users) {
    const dropdown = document.getElementById('holidayResourceDropdown');
    dropdown.innerHTML = ''; // Bestehende Optionen entfernen

    // Option "Alle (Betriebsurlaub)" hinzufügen
    const allOption = document.createElement('option');
    allOption.value = 'all'; // Wert für "Alle"
    allOption.textContent = 'Alle (Betriebsurlaub)'; // Text der Option
    dropdown.appendChild(allOption);

    // Alle Benutzer hinzufügen
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.username; // Verwende die ID oder den Benutzernamen als Wert
        option.textContent = user.username; // Benutzernamen anzeigen

        // Option hinzufügen
        dropdown.appendChild(option);
    });
}





/**************************************************************
 * 2) Formular-Felder leeren
 **************************************************************/
function clearHolidayForm() {
    // Text- und Datumsfelder leeren
    document.getElementById('holidayDescription').value = '';
    document.getElementById('holidayFromDate').value = '';
    document.getElementById('holidayToDate').value = '';

    // Dropdown für Ressource zurücksetzen
    const resourceDropdown = document.getElementById('holidayResourceDropdown');
    if (resourceDropdown) {
        resourceDropdown.value = ''; // Standardoption auswählen
    }

    // Genehmigungsstatus zurücksetzen
    document.getElementById('holidayStatus').value = ''; 
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
    const resource = document.getElementById('holidayResourceDropdown').value;
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

    // Sicherstellen, dass das Dropdown initialisiert wurde
    const dropdown = document.getElementById('holidayResourceDropdown');
    if (!dropdown || dropdown.options.length === 0) {
        console.error('Dropdown ist noch nicht initialisiert');
        return alert('Dropdown-Optionen nicht verfügbar. Bitte erneut versuchen.');
    }

    // Prüfen, ob die Ressource im Dropdown existiert
    const resourceExists = Array.from(dropdown.options).some(
        (option) => option.value === holiday.resource
    );
    if (!resourceExists && holiday.resource) {
        console.warn(`Ressource "${holiday.resource}" nicht im Dropdown gefunden. Fügt sie hinzu.`);
        const newOption = document.createElement('option');
        newOption.value = holiday.resource;
        newOption.textContent = holiday.resource;
        dropdown.appendChild(newOption);
    }

    // Felder befüllen
    document.getElementById('holidayDescription').value = holiday.description || '';
    document.getElementById('holidayFromDate').value = holiday.from || '';
    document.getElementById('holidayToDate').value = holiday.to || '';
    document.getElementById('holidayResourceDropdown').value = holiday.resource || '';
    document.getElementById('holidayStatus').value = holiday.status || 'Ausstehend';

    // Formular (Edit-Modus) anzeigen
    showHolidayForm(true);

    // PUT-Listener
    const newSubmitBtn = document.getElementById('addHolidayButton');
    newSubmitBtn.innerText = 'Änderungen speichern';
    newSubmitBtn.replaceWith(newSubmitBtn.cloneNode(true)); // Verhindert doppelte Listener
    document.getElementById('addHolidayButton').addEventListener('click', async (e) => {
        e.preventDefault();

        const updatedHoliday = {
            from: document.getElementById('holidayFromDate').value,
            to: document.getElementById('holidayToDate').value,
            description: document.getElementById('holidayDescription').value,
            resource: document.getElementById('holidayResourceDropdown').value,
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
                renderCalendarWithDelay();
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
            renderCalendarWithDelay();
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
    // SaveTimeSettings.js
    
    let settingsId = null;

    // Diese Funktion lädt die Settings aus dem Backend und füllt die Tabelle.
    function loadTimeSettings() {
        // GET /api/settings (oder /settings, je nachdem wie du es in app.js konfigurierst)
        fetch(`${BACKEND_URL}/settings`)
          .then(response => {
            if (!response.ok) {
              // Falls der Status kein 200er Code ist (bspw. 404, 500, etc.)
              throw new Error(`HTTP-Error: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            // data sollte ein Settings-Objekt sein
            settingsId = data._id;  // MongoDB-Dokument-ID
            workingHours = data.workingHours;
            defaultSlotLength = data.defaultSlotLength;
  
            // Tage array
            const days = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag','sonntag'];
  
            days.forEach(day => {
              // Falls im DB-Dokument irgendetwas fehlt, initialisiere es notfalls leer
              const dayData = workingHours[day] || {};
              
              // Checkbox 'active'
              const activeEl = document.getElementById(`${day}Active`);
              if (activeEl) {
                activeEl.checked = dayData.active || false;
              }
  
              // morning
              const morningStart = document.getElementById(`${day}MorningStart`);
              if (morningStart && dayData.morning) {
                morningStart.value = dayData.morning.start || '';
              }
              const morningEnd = document.getElementById(`${day}MorningEnd`);
              if (morningEnd && dayData.morning) {
                morningEnd.value = dayData.morning.end || '';
              }
  
              // afternoon
              const afternoonStart = document.getElementById(`${day}AfternoonStart`);
              if (afternoonStart && dayData.afternoon) {
                afternoonStart.value = dayData.afternoon.start || '';
              }
              const afternoonEnd = document.getElementById(`${day}AfternoonEnd`);
              if (afternoonEnd && dayData.afternoon) {
                afternoonEnd.value = dayData.afternoon.end || '';
              }
              /* Funktioniert nicht und aktuell nicht benötigt desshalb auskommentiert
              // optional
              const optionalStart = document.getElementById(`${day}OptionalStart`);
              if (optionalStart && dayData.optional) {
                optionalStart.value = dayData.optional.start || '';
              }
              const optionalEnd = document.getElementById(`${day}OptionalEnd`);
              if (optionalEnd && dayData.optional) {
                optionalEnd.value = dayData.optional.end || '';
              }*/
            });
  
            // defaultSlotLength in Formularfeld eintragen
            const defaultLenEl = document.getElementById('defaultAppointmentLength');
            if (defaultLenEl) {
              defaultLenEl.value = defaultSlotLength;
            }
          })
          .catch(err => {
            console.error('Fehler beim Laden der Time Settings:', err);
          });
      }
  
      // Diese Funktion liest die Werte aus der Tabelle aus und schickt sie per PUT an /api/settings/:id
      function saveTimeSettings() {
        // Falls kein settingsId gesetzt ist, brechen wir ab (oder man nutzt POST, falls man mehrere Documents will)
        if (!settingsId) {
          console.error('Keine Settings-ID gefunden – kann nicht aktualisieren.');
          return;
        }
  
        const days = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag','sonntag'];
        days.forEach(day => {
          const active = document.getElementById(`${day}Active`)?.checked ?? false;
          
          const morningStart = document.getElementById(`${day}MorningStart`)?.value || null;
          const morningEnd = document.getElementById(`${day}MorningEnd`)?.value || null;
  
          const afternoonStart = document.getElementById(`${day}AfternoonStart`)?.value || null;
          const afternoonEnd = document.getElementById(`${day}AfternoonEnd`)?.value || null;

          /* Funktioniert nicht und aktuell nicht benötigt desshalb auskommentiert
          const optionalStart = document.getElementById(`${day}OptionalStart`)?.value || null;
          const optionalEnd = document.getElementById(`${day}OptionalEnd`)?.value || null;
            */
          // Baue das Objekt neu auf
          workingHours[day] = {
            active: active,
            morning: {
              start: morningStart,
              end: morningEnd
            },
            afternoon: {
              start: afternoonStart,
              end: afternoonEnd
            },
            /* Funktioniert nicht und aktuell nicht benötigt desshalb auskommentiert
            optional: {
              start: optionalStart,
              end: optionalEnd
              
            }*/
          };
        });
  
        // defaultSlotLength aus dem Formularfeld auslesen
        const defaultLenEl = document.getElementById('defaultAppointmentLength');
        if (defaultLenEl) {
          defaultSlotLength = parseInt(defaultLenEl.value, 10) || 30;
        }
  
        // JSON für den PUT-Aufruf
        const settingsData = {
          workingHours,
          defaultSlotLength
        };
  
        // PUT /api/settings/:id
        fetch(`${BACKEND_URL}/settings/${settingsId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settingsData)
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP-Error: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          renderCalendarWithDelay();
          console.log('Time Settings erfolgreich gespeichert:', data);
        })
        .catch(err => {
          console.error('Fehler beim Speichern der Time Settings:', err);
        });
      }
  
      // Event-Listener auf den "Speichern"-Button
      document.getElementById('saveTimeSettings').addEventListener('click', saveTimeSettings);
  
      // Beim Laden der Seite die Daten vom Backend laden
      document.addEventListener('DOMContentLoaded', loadTimeSettings);


/***************************************************
 FARBAUSWAHL
 ***************************************************/


    //FARBAUSWAHL THEMA DESIGN DARKMODE
    // Funktion zum Aktualisieren der Themenfarbe
    function updateThemeColor(color) {
        document.documentElement.style.setProperty('--theme-color', color);
        // Optional: Speichere die Farbe in localStorage
        localStorage.setItem('themeColor', color);
    }


/***************************************************
DARKMODE
 ***************************************************/

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

//====================================================================================================================================
//====================================================================================================================================
//====================================================================================================================================
//USER-MANAGEMENT
//====================================================================================================================================
//====================================================================================================================================
//====================================================================================================================================

/***************************************************
 * 1) GRUNDLEGENDE SETUPS
 ***************************************************/

// Siehe Allgemein

function validatePassword(password) {
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{10,}$/;
    return regex.test(password);
}

/***************************************************
 * 2) USER-FORMULAR: ÖFFNEN, SCHLIESSEN, LEEREN
 ***************************************************/
// Button "Neuen Benutzer anlegen" → Formular öffnen
// ACHTUNG: async, damit wir await verwenden können
document.getElementById('openUserFormButton').addEventListener('click', async () => {
    // 1) Diesen Button ausblenden
    document.getElementById('openUserFormButton').style.display = 'none';
    // 2) Felder leeren
    clearUserForm();
    // 3) Formular anzeigen
    showUserForm();
    // 4) Button-Text = "Benutzer hinzufügen"
    const submitButton = document.querySelector('#userForm button[type="submit"]');
    submitButton.innerText = "Benutzer hinzufügen";

    // 5) Alten Listener entfernen und neuen Listener (POST) anhängen
    submitButton.replaceWith(submitButton.cloneNode(true));
    const newSubmitButton = document.querySelector('#userForm button[type="submit"]');
    newSubmitButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await addNewUser(); // POST-Funktion
    });

    // 6) Services laden und Checkboxen generieren
    //    NUR möglich, weil wir diese Funktion jetzt async machen
    const services = await loadAllServices();
    renderServiceCheckboxes(services);
});

// Funktion: Formular anzeigen (Animation)
function showUserForm() {
    const form = document.getElementById('userFormular');
    form.classList.remove('hidden');
    form.style.display = 'block';
    setTimeout(() => {
        form.classList.add('show');
    }, 10); 
}

// Klick auf "Abbrechen" → Formular schließen
document.getElementById('cancelUserFormButton').addEventListener('click', function () {
    hideUserForm();
});

// Funktion zum Ausblenden des Formulars
function hideUserForm() {
    const form = document.getElementById('userFormular');
    // Button "Neuen Benutzer anlegen" wieder anzeigen
    document.getElementById('openUserFormButton').style.display = 'inline-block';

    // Smooth ausblenden
    form.classList.remove('show');
    setTimeout(() => {
        form.classList.add('hidden'); 
        form.style.display = 'none';
    }, 300);

    // Beschriftung zurücksetzen
    const submitButton = document.querySelector('#userForm button[type="submit"]');
    submitButton.innerText = "Benutzer hinzufügen";

    // Felder leeren
    clearUserForm();
}

// Formularfelder leeren
function clearUserForm() {
    document.getElementById('userID').value = '';
    document.getElementById('username').value = '';
    document.getElementById('publicName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('color').value = '#FFD1DC'; // Standardfarbe (z. B. Rosa)
    }
    /*
    

  userID
  username
  email
  password 
  activeModuls
  roles
  availableServices
  UserSpecificSettings
  color

*/


/***************************************************
 * 3) NEUEN BENUTZER ANLEGEN (POST)
 ***************************************************/
async function addNewUser() {
    // Eingaben abrufen
    const userID = document.getElementById('userID').value;
    const username = document.getElementById('username').value;
    const publicName = document.getElementById('publicName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    // Passwortvalidierung
    if (!validatePassword(password)) {
        alert('Passwort muss mindestens 10 Zeichen lang sein und Groß-/Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.');
        return;
    }
    
    const color = document.getElementById('color').value; // Farbauswahl

    // ausgewählte Services ermitteln
    const checkboxes = document.querySelectorAll('#servicesCheckboxContainer .service-checkbox:checked');
    const selectedServices = Array.from(checkboxes).map(cb => cb.value);

    // User-Daten zusammenstellen
    const newUserData = {
        userID,
        username,
        publicName,
        email,
        password,
        color, // Farbe hinzufügen
        availableServices: selectedServices // Services hinzufügen
    };

    try {
        const response = await fetch(`${BACKEND_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUserData)
        });

        if (response.ok) {
            alert('Benutzer erfolgreich hinzugefügt!');
            hideUserForm();
            loadUsers(); // Benutzerliste neu laden
        } else {
            alert('Fehler beim Hinzufügen des Benutzers');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}



/***************************************************
 * 4) BENUTZERLISTE LADEN UND ANZEIGEN (GET)
 ***************************************************/
async function loadUsers() {
    try {
        const response = await fetch(`${BACKEND_URL}/users`);
        if (!response.ok) throw new Error('Netzwerk-Fehler beim Laden der Benutzer');
        
        const users = await response.json();
        allUsers = users.slice(1); // Admin entfernen
        
        // Hinzugefügt: Buttons erstellen
        DisplayUsersButtons(allUsers);
        displayUsers(allUsers); // Ihre existierende Liste
        populateDropdownWithUsersForAppointmentForm(allUsers, currentUserName);
        populateDropdownWithUsersForHolidayForm(allUsers);
    } catch (error) {
        console.error('Fehler beim Laden der Benutzer:', error);
    }
}


// Funktion zum Anzeigen der Benutzerliste
function displayUsers(users) {
    const userList = document.getElementById('userList');
    userList.innerHTML = users
        .map(user => `
            <div class="user-card">
                <span class="user-info"><strong>${user.userID}</strong> – ${user.username}</span>
                <span class="user-info">E-Mail: ${user.email || 'Keine Angabe'}</span>
                <div class="user-actions">
                    <button data-user-id="${user._id}" class="action-btn edit-user-btn" title="Bearbeiten">✏️</button>
                    <button data-user-id="${user._id}" class="action-btn delete-user-btn" title="Löschen">🗑️</button>
                </div>
            </div>
        `)
        .join('');

    // Event-Listener für "Bearbeiten"
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-user-id');
            editUser(userId); 
        });
    });

    // Event-Listener für "Löschen"
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-user-id');
            deleteUser(userId);
        });
    });
}


/***************************************************
 * 4.5) SERVICES LADEN UND CHECKBOXEN RENDERN
 ***************************************************/
// Du hast bereits eine "loadServices" im SERVICE-MANAGEMENT-Block.
// Wir machen hier eine separate "loadAllServices()" für den User-Form-Dialog.
// Oder du könntest "loadServices()" aus dem Service-Block wiederverwenden - 
// mit dem Unterschied, dass dort `allServices` befüllt wird.
//
// Da du schon "loadAllServices()" geschrieben hast, nutzen wir die:
async function loadAllServices() {
    try {
        const response = await fetch(`${BACKEND_URL}/services`);
        if (!response.ok) throw new Error('Fehler beim Laden der Services');
        return await response.json(); // Array von Services
    } catch (error) {
        console.error('Fehler beim Laden der Services:', error);
        return [];
    }
}

function renderServiceCheckboxes(services) {
    const container = document.getElementById('servicesCheckboxContainer');
    container.innerHTML = ''; // Erst mal leeren, falls vorher was drin war

    services.forEach(service => {
        const label = document.createElement('label');
        label.style.display = 'block'; // jede Checkbox in neuer Zeile

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = service.serviceID;  // oder service._id
        checkbox.className = 'service-checkbox';

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + service.serviceName));
        container.appendChild(label);
    });
}


/***************************************************
 * 5) BENUTZER BEARBEITEN (PUT)
 ***************************************************/
async function editUser(userId) {
    // 1) Button "Neuen Benutzer anlegen" ausblenden
    document.getElementById('openUserFormButton').style.display = 'none';

    // 2) Benutzer-Objekt finden
    const user = allUsers.find(u => u._id === userId);
    if (!user) {
        alert('Benutzer nicht gefunden');
        return;
    }

    // 3) Felder füllen
    document.getElementById('userID').value   = user.userID || '';
    document.getElementById('username').value = user.username || '';
    document.getElementById('publicName').value = user.publicName || '';
    document.getElementById('email').value    = user.email || '';
    document.getElementById('color').value    = user.color || '';
    
    /*
    

  userID
  username
  email
  password 
  activeModuls
  roles
  availableServices
  UserSpecificSettings
  color

*/
    // 4) Formular anzeigen
    showUserForm();

    // 5) Button "Änderungen speichern" ...
    const submitButton = document.querySelector('#userForm button[type="submit"]');
    submitButton.innerText = "Änderungen speichern";
    submitButton.replaceWith(submitButton.cloneNode(true));
    const newSubmitButton = document.querySelector('#userForm button[type="submit"]');

    // 6) Services laden und Checkboxen erstellen
    const services = await loadAllServices();
    renderServiceCheckboxes(services);

    // 7) Checkboxen "vorbelegen"
    //    Falls user.availableServices ein Array mit z.B. service._id oder serviceName enthält:
    if (Array.isArray(user.availableServices)) {
        user.availableServices.forEach(svc => {
            // Finde die Checkbox, die den Wert "svc" hat
            const checkbox = document.querySelector(`#servicesCheckboxContainer .service-checkbox[value="${svc}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    newSubmitButton.addEventListener('click', async (e) => {
    e.preventDefault();

    // 1. Passwort nur hinzufügen, wenn nicht leer
    const passwordInput = document.getElementById('password').value.trim();

// 2. Grundlegende Benutzerdaten abrufen
    const updatedUser = {
    userID: document.getElementById('userID').value,
    username: document.getElementById('username').value,
    publicName: document.getElementById('publicName').value,
    email: document.getElementById('email').value,
    color: document.getElementById('color').value,
};
    // 2.5 Passwortvalidierung nur wenn Passwort geändert wurde
    if (passwordInput !== "") {
        if (!validatePassword(passwordInput)) {
            alert('Passwort muss mindestens 10 Zeichen lang sein und Groß-/Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.');
            return;
        }
        updatedUser.password = passwordInput;
    }

    

    if (passwordInput !== "") {
        updatedUser.password = passwordInput;
    }

    // 3. Ausgewählte Services erfassen
    const checkboxes = document.querySelectorAll('#servicesCheckboxContainer .service-checkbox:checked');
    const selectedServices = Array.from(checkboxes).map(cb => cb.value);
    console.log('Ausgewählte Services:', selectedServices); // Debugging
    // 4. Services hinzufügen
    updatedUser.availableServices = selectedServices;

console.log('Services in updatedUser eingefügt:', updatedUser.availableServices); // Debugging
console.log('Aktualisierte Benutzerdaten (nach Einfügen der Services):', updatedUser);

const requestBody = JSON.stringify(updatedUser);
console.log('Daten, die an die API gesendet werden:', requestBody);
    // 5. PUT-Request senden
    try {
        const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser),
        });

        if (response.ok) {
            alert('Benutzer erfolgreich aktualisiert');
            await loadUsers(); // Benutzerliste neu laden
            hideUserForm();
        } else {
            alert('Fehler beim Aktualisieren des Benutzers');
        }
    } catch (err) {
        console.error('Fehler:', err);
        alert('Fehler beim Speichern der Änderungen');
    }
});
}



/***************************************************
 * 6) BENUTZER LÖSCHEN (DELETE)
 ***************************************************/
async function deleteUser(userId) {
    if (!confirm("Möchtest du diesen Benutzer wirklich löschen?")) return;

    try {
        const response = await fetch(`${BACKEND_URL}/users/${userId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Benutzer erfolgreich gelöscht');
            await loadUsers();
        } else {
            alert('Fehler beim Löschen des Benutzers');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}


//====================================================================================================================================
//====================================================================================================================================
//====================================================================================================================================
//SERVICE-MANAGEMENT
//====================================================================================================================================
//====================================================================================================================================
//====================================================================================================================================

/***************************************************
 * 1) GRUNDLEGENDE SETUPS
 ***************************************************/

// Serviceformular beim Laden der Seite ausblenden
document.addEventListener('DOMContentLoaded', function() {
    // Falls separat eingebunden, ggf. ein eigenes DOMContentLoaded-Event
    document.getElementById('serviceFormular').style.display = 'none';

    // Serviceliste laden beim Start
    loadServices(); // allServices wird hier gefüllt
});


/***************************************************
 * 2) SERVICE-FORMULAR: ÖFFNEN, SCHLIESSEN, LEEREN
 ***************************************************/
// Button "Neuen Service anlegen" → Formular öffnen
document.getElementById('openServiceFormButton').addEventListener('click', () => {
    document.getElementById('openServiceFormButton').style.display = 'none';
    clearServiceForm();
    showServiceForm();

    const submitButton = document.querySelector('#serviceForm button[type="submit"]');
    submitButton.innerText = "Service hinzufügen";

    // Alten Listener entfernen und neuen (POST) anhängen
    submitButton.replaceWith(submitButton.cloneNode(true));
    const newSubmitButton = document.querySelector('#serviceForm button[type="submit"]');
    newSubmitButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await addNewService(); // POST-Funktion
    });
});

// Formular anzeigen (Animation)
function showServiceForm() {
    const form = document.getElementById('serviceFormular');
    form.classList.remove('hidden');
    form.style.display = 'block';
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
}

// Klick auf "Abbrechen" → Formular schließen
document.getElementById('cancelServiceFormButton').addEventListener('click', function () {
    hideServiceForm();
});

// Formular ausblenden
function hideServiceForm() {
    const form = document.getElementById('serviceFormular');
    document.getElementById('openServiceFormButton').style.display = 'inline-block';

    form.classList.remove('show');
    setTimeout(() => {
        form.classList.add('hidden');
        form.style.display = 'none';
    }, 300);

    const submitButton = document.querySelector('#serviceForm button[type="submit"]');
    submitButton.innerText = "Service hinzufügen";

    clearServiceForm();
}

// Formularfelder leeren
function clearServiceForm() {
    
    document.getElementById('serviceName').value = '';
    document.getElementById('serviceDescription').value = '';
    document.getElementById('servicePrice').value = '';
    document.getElementById('serviceDuration').value = '';
}


/***************************************************
 * 3) NEUEN SERVICE ANLEGEN (POST)
 ***************************************************/
async function addNewService() {
    const serviceName = document.getElementById('serviceName').value;
    const serviceDescription = document.getElementById('serviceDescription').value;
    const servicePrice = parseFloat(document.getElementById('servicePrice').value) || 0;
    const serviceDuration = parseInt(document.getElementById('serviceDuration').value) || 0;

    try {
        const response = await fetch(`${BACKEND_URL}/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serviceName, serviceDescription, servicePrice, serviceDuration })
        });

        if (response.ok) {
            alert('Service erfolgreich hinzugefügt!');
            hideServiceForm();
            loadServices();
        } else {
            alert('Fehler beim Hinzufügen des Service');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}


/***************************************************
 * 4) SERVICELISTE LADEN UND ANZEIGEN (GET)
 ***************************************************/
async function loadServices() {
    try {
        const response = await fetch(`${BACKEND_URL}/services`);
        if (!response.ok) throw new Error('Netzwerk-Fehler beim Laden der Services');

        allServices = await response.json();
        displayServices(allServices);
    } catch (error) {
        console.error('Fehler beim Laden der Services:', error);
    }
}

function displayServices(services) {
    const serviceList = document.getElementById('serviceList');
    serviceList.innerHTML = services
        .map(srv => `
            <div class="service-card">
                <span class="service-info">${srv.serviceName} – ${srv.serviceDuration} Min – ${srv.servicePrice} CHF</span>
                <div class="service-actions">
                    <button data-service-id="${srv._id}" class="action-btn edit-service-btn" title="Bearbeiten">✏️</button>
                    <button data-service-id="${srv._id}" class="action-btn delete-service-btn" title="Löschen">🗑️</button>
                </div>
            </div>
        `)
        .join('');

    // Event-Listener für "Bearbeiten"
    document.querySelectorAll('.edit-service-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceId = btn.getAttribute('data-service-id');
            editService(serviceId);
        });
    });

    // Event-Listener für "Löschen"
    document.querySelectorAll('.delete-service-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceId = btn.getAttribute('data-service-id');
            deleteService(serviceId);
        });
    });
}



/***************************************************
 * 5) SERVICE BEARBEITEN (PUT)
 ***************************************************/
async function editService(serviceId) {
    // 1) Button "Neuen Service anlegen" ausblenden
    document.getElementById('openServiceFormButton').style.display = 'none';

    // 2) Service-Objekt finden
    const service = allServices.find(s => s._id === serviceId);
    if (!service) {
        alert('Service nicht gefunden');
        return;
    }

    // 3) Felder mit vorhandenen Daten füllen
    /*document.getElementById('serviceID').value = service.serviceID || '';*/
    document.getElementById('serviceName').value = service.serviceName || '';
    document.getElementById('serviceDescription').value = service.serviceDescription || '';
    document.getElementById('servicePrice').value = service.servicePrice || 0;
    document.getElementById('serviceDuration').value = service.serviceDuration || 0;
console.log('FElder werden befüllt mit: ' + service.serviceID + service.serviceName);
    // 4) Formular anzeigen
    showServiceForm();

    // 5) Button-Beschriftung ändern
    const submitButton = document.querySelector('#serviceForm button[type="submit"]');
    submitButton.innerText = "Änderungen speichern";

    // 6) Alten Listener entfernen, neuen Listener anfügen
    submitButton.replaceWith(submitButton.cloneNode(true));
    const newSubmitButton = document.querySelector('#serviceForm button[type="submit"]');
    newSubmitButton.addEventListener('click', async (e) => {
        e.preventDefault();

        // 7) Updated-Daten
        const updatedService = {
            /*serviceID: document.getElementById('serviceID').value,*/
            serviceName: document.getElementById('serviceName').value,
            serviceDescription: document.getElementById('serviceDescription').value,
            servicePrice: parseFloat(document.getElementById('servicePrice').value) || 0,
            serviceDuration: parseInt(document.getElementById('serviceDuration').value) || 0
        };

        // 8) PUT-Request
        try {
            const response = await fetch(`${BACKEND_URL}/services/${serviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedService)
            });

            if (response.ok) {
                renderCalendar();
                alert('Service erfolgreich aktualisiert');
                await loadServices();
                hideServiceForm();
            } else {
                alert('Fehler beim Aktualisieren des Service');
            }
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    });
}


/***************************************************
 * 6) SERVICE LÖSCHEN (DELETE)
 ***************************************************/
async function deleteService(serviceId) {
    if (!confirm("Möchtest du diesen Service wirklich löschen?")) return;

    try {
        const response = await fetch(`${BACKEND_URL}/services/${serviceId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Service erfolgreich gelöscht');
            await loadServices();
        } else {
            alert('Fehler beim Löschen des Service');
        }
    } catch (err) {
        alert('Fehler: ' + err.message);
    }
}
