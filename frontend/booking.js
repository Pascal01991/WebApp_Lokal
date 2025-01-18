/********************************************
 * booking.js
 * Beispiel: Public Booking Workflow
 ********************************************/

// --- Globale Variablen, um Zwischenschritte zu speichern --- //
let allServices = [];     // Array aller Dienste (Backend)
let selectedServices = []; // Array aus "0"/"1" je Index, ob ausgewählt
let allUsers = [];        // Array aller User (Backend)
let selectedUser = null;  // Merkt sich den ausgewählten Mitarbeiter

let selectedDate = null;    // Das Datum (z.B. "2025-01-20")
let selectedPeriod = null;  // "morning" oder "afternoon"
let selectedSlot = null;    // Konkreter Slot-Objekt

// Merkt sich außerdem den Namen/Vornamen/Mail
let personalData = {
  firstName: "",
  lastName: "",
  email: ""
};

// Starte Standardmäßig mit "Index0" = "1" => immer aktiv:
function initSelectedServices() {
  // Initialisiere alle Services auf "0"
  selectedServices = allServices.map(() => "0");
  
  // Index 0 soll *immer* "1" sein
  const idx0 = allServices.findIndex(s => s.serviceID === 0);
  if (idx0 >= 0) {
    selectedServices[idx0] = "1";
  }
}

// Hilfsfunktion: hole Services vom Server
async function loadServices() {
  try {
    const response = await fetch('/api/services');
    const data = await response.json();
    allServices = data; 
    console.log("Services geladen:", allServices);
    initSelectedServices();
    renderServicesList();
  } catch (err) {
    console.error("Fehler beim Laden der Services:", err);
  }
}

// Zeige Services in Schritt 1 an (außer serviceID 0)
function renderServicesList() {
  const container = document.getElementById('servicesList');
  container.innerHTML = "<h3>Verfügbare Dienstleistungen</h3>";

  // Filter: serviceID != 0 => soll angezeigtes Checkbox sein
  allServices.forEach(service => {
    if (service.serviceID !== 0) {
      // Erzeuge Checkbox
      const label = document.createElement('label');
      label.style.display = "block";

      // Wir brauchen einen Input (Checkbox)
      const checkbox = document.createElement('input');
      checkbox.type = "checkbox";
      checkbox.value = service.serviceID; // identifiziert diesen Service
      checkbox.checked = (selectedServices[service.serviceID] === "1");

      checkbox.addEventListener('change', () => {
        // "1" oder "0" setzen in selectedServices
        selectedServices[service.serviceID] = checkbox.checked ? "1" : "0";
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${service.serviceName} (${service.servicePrice} CHF)`));

      container.appendChild(label);
    }
  });
}

// Hole User (Mitarbeiter) vom Server
async function loadUsers() {
  try {
    const response = await fetch('/api/users');
    const data = await response.json();
    allUsers = data;
    console.log("User geladen:", allUsers);
    renderUsersList();
  } catch (err) {
    console.error("Fehler beim Laden der User:", err);
  }
}

// Zeige User in Schritt 1 an (per Radio-Button)
function renderUsersList() {
  const container = document.getElementById('usersList');
  container.innerHTML = "<h3>Mitarbeiter (Ressource) wählen</h3>";

  allUsers.forEach(user => {
    const label = document.createElement('label');
    label.style.display = "block";

    const radio = document.createElement('input');
    radio.type = "radio";
    radio.name = "selectedUser";
    radio.value = user.username;

    radio.addEventListener('change', () => {
      selectedUser = user; // Ganzes User-Objekt merken
    });

    label.appendChild(radio);
    label.appendChild(document.createTextNode(` ${user.publicName}`));
    container.appendChild(label);
  });
}

// --- Schritt 2: Woche anzeigen und Vormittag/Nachmittag klickbar --- //

// Hilfsfunktion: Hole Start der Woche (Mo) relativ zum gewählten Tag
function getStartOfWeek(date) {
  // Wir gehen mal davon aus, dass 'date' ein normales Date-Objekt ist
  const day = date.getDay(); // So=0, Mo=1, ...
  const diff = (day === 0 ? -6 : 1 - day);
  const startOfWeek = new Date(date);
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  startOfWeek.setHours(0,0,0,0);
  return startOfWeek;
}

// Diese Funktion rendert die Tabelle der Woche (Mo-So)
function renderWeekSelection() {
  const current = new Date(); // Oder das gewählte Datum
  const startOfWeek = getStartOfWeek(current);

  const weekHeader = document.getElementById('weekHeader');
  const rowVormittag = document.getElementById('rowVormittag');
  const rowNachmittag = document.getElementById('rowNachmittag');

  // Header leeren (1. Spalte bleibt)
  weekHeader.innerHTML = "<th></th>"; 
  rowVormittag.innerHTML = "<td>Vormittag</td>";
  rowNachmittag.innerHTML = "<td>Nachmittag</td>";

  // Für die 7 Tage
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);

    const dayNum = day.getDate();
    const monthNum = day.getMonth() + 1;
    // Wochentag
    const weekday = ["So","Mo","Di","Mi","Do","Fr","Sa"][day.getDay()];

    // Kopf-Spalte
    const th = document.createElement('th');
    th.textContent = `${weekday} ${dayNum}.${monthNum}`;
    weekHeader.appendChild(th);

    // Vormittag
    const tdV = document.createElement('td');
    const btnV = document.createElement('button');
    btnV.textContent = "Wählen";
    btnV.addEventListener('click', () => {
      selectedDate = formatDate(day); // z.B. "2025-01-17"
      selectedPeriod = "morning";
      goToStep3();
    });
    tdV.appendChild(btnV);
    rowVormittag.appendChild(tdV);

    // Nachmittag
    const tdN = document.createElement('td');
    const btnN = document.createElement('button');
    btnN.textContent = "Wählen";
    btnN.addEventListener('click', () => {
      selectedDate = formatDate(day);
      selectedPeriod = "afternoon";
      goToStep3();
    });
    tdN.appendChild(btnN);
    rowNachmittag.appendChild(tdN);
  }
}

// Kleiner Helfer: formatiere Datum als "YYYY-MM-DD"
function formatDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2,'0');
  const d = String(dateObj.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

// --- Schritt 3: Slots laden & anzeigen --- //

// Hier laden wir die Availability-Slots (die komplette Woche).
// Dann filtern wir nur die, die zum selectedDate + Period passen.
async function goToStep3() {
  // Schritt 2 verstecken, Schritt 3 zeigen
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3').style.display = 'block';

  // Slots laden (für die ganze Woche)
  // Query-Parameter: currentDate=selectedDate => wir nehmen den Montag der gewählten Woche
  const url = `/api/availability/slots?currentDate=${formatDate(new Date(selectedDate))}`;
  try {
    const response = await fetch(url);
    const allSlots = await response.json();

    console.log("Slots erhalten:", allSlots);
    renderSlots(allSlots);
  } catch (err) {
    console.error("Fehler beim Laden der Slots:", err);
  }
}

// Hier filtern wir z.B. die Slots auf den gewählten Tag (selectedDate)
// und ob morgens / nachmittags (selectedPeriod).
// Dann zeigen wir sie dem User als Buttons.
function renderSlots(allSlots) {
  const container = document.getElementById('slotsContainer');
  container.innerHTML = "";

  // a) Filter nach passendem Datum
  //    Wir erinnern uns, dass `slot.startDateTime` z.B. "2025-01-17T08:00"
  // b) Vormittag => 0-12 Uhr, Nachmittag => 12-24 Uhr
  // c) Zeitzone: +1h für Anzeige

  let filtered = allSlots.filter(slot => {
    // Gleiche Tag?
    // slot.startDateTime = "2025-01-17T08:00"
    // => extrahiere YYYY-MM-DD
    const slotDate = slot.startDateTime.split('T')[0]; // "2025-01-17"
    if (slotDate !== selectedDate) return false;
    
    // Zeit?
    const timePart = slot.startDateTime.split('T')[1]; // "08:00"
    const hour = parseInt(timePart.split(':')[0]);
    // if period = "morning" => hour < 12
    // if period = "afternoon" => hour >= 12
    if (selectedPeriod === "morning" && hour >= 12) return false;
    if (selectedPeriod === "afternoon" && hour < 12) return false;
    
    // Nur anzeigen, wenn isAvailable = true für den gewählten Mitarbeiter
    if (!selectedUser) return false;
    // Schauen wir in slot.isAvailable[ user.username ]
    // (Achtung: Wenn das Availability-Objekt so heißt wie in der Hilfe.)
    if (!slot.isAvailable || slot.isAvailable[selectedUser.username] !== true) {
      return false;
    }
    
    return true;
  });
  
  // Sortiere nach Uhrzeit aufsteigend
  filtered.sort((a,b) => {
    return a.startDateTime.localeCompare(b.startDateTime);
  });
  
  // Berechne die gesamte benötigte Dauer (inkl. index 0)
  const totalDuration = calculateTotalDuration();

  // Filter die Slots basierend auf der benötigten Dauer
  filtered = filtered.filter(slot => {
    const slotStart = new Date(slot.startDateTime);
    const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);

    // Überprüfe, ob alle Slots innerhalb der Verfügbarkeit liegen
    // Dies erfordert eine zusätzliche Backend-Logik, um sicherzustellen,
    // dass der gesamte Zeitraum frei ist. 
    // Hier vereinfachen wir und zeigen nur einzelne Slots an.

    return true; // Placeholder: Implementiere echte Logik, falls nötig
  });

  // Für jeden Slot einen Button
  filtered.forEach(slot => {
    const btn = document.createElement('button');
    // +1 Stunde "manuell" für Anzeige
    const dateObj = new Date(slot.startDateTime);
    dateObj.setHours(dateObj.getHours() + 1); // +1
    const hh = String(dateObj.getHours()).padStart(2,'0');
    const mm = String(dateObj.getMinutes()).padStart(2,'0');
    btn.textContent = `${hh}:${mm} Uhr`;
    
    btn.addEventListener('click', () => {
      selectedSlot = slot;
      goToStep4();
    });
    
    container.appendChild(btn);
  });

  if (filtered.length === 0) {
    container.textContent = "Keine freien Slots verfügbar.";
  }
}

// Berechne die gesamte benötigte Dauer (inkl. index 0)
function calculateTotalDuration() {
  // Index 0 ist immer aktiv, addiere seine Dauer
  let total = 0;
  allServices.forEach(service => {
    if (selectedServices[service.serviceID] === "1") {
      total += service.serviceDuration;
    }
  });
  return total;
}

// --- Schritt 4: Persönliche Daten abfragen --- //
function goToStep4() {
  document.getElementById('step3').style.display = 'none';
  document.getElementById('step4').style.display = 'block';
}

function initStep4() {
  const form = document.getElementById('personalDataForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Werte auslesen
    personalData.firstName = document.getElementById('firstName').value;
    personalData.lastName = document.getElementById('lastName').value;
    personalData.email = document.getElementById('email').value;
    
    // weiter zu Schritt 5
    goToStep5();
  });
}

// --- Schritt 5: Zusammenfassung & POST zum Server --- //
function goToStep5() {
  document.getElementById('step4').style.display = 'none';
  document.getElementById('step5').style.display = 'block';

  // Zeige Zusammenfassung: Dienste, Datum, Slot, Name etc.
  const summary = document.getElementById('summaryContainer');
  summary.innerHTML = "";

  const chosenServices = getChosenServices(); // Array aus { serviceID, name, price, duration, chosen:"1|0" }
  const totalPrice = chosenServices.reduce((sum, s) => sum + (s.chosen === "1" ? s.servicePrice : 0), 0);
  const totalDuration = chosenServices.reduce((sum, s) => sum + (s.chosen === "1" ? s.serviceDuration : 0), 0);

  // Textlich zusammenfassen
  // 1) Dienstleistungen
  const servicesText = chosenServices.map(s => {
    return `Index ${s.serviceID}: "${s.chosen}" (${s.serviceName})`;
  });
  
  // 2) Datum & Zeit
  //    selectedSlot.startDateTime => +1h
  const slotDateObj = new Date(selectedSlot.startDateTime);
  slotDateObj.setHours(slotDateObj.getHours() + 1);
  const slotTimeString = slotDateObj.toISOString().substring(0,16).replace('T',' ');

  summary.innerHTML = `
    <p><strong>Datum/Uhrzeit:</strong> ${slotTimeString}</p>
    <p><strong>Gewählter Mitarbeiter:</strong> ${selectedUser.publicName}</p>
    <p><strong>Vorname/Nachname:</strong> ${personalData.firstName} ${personalData.lastName}</p>
    <p><strong>E-Mail:</strong> ${personalData.email}</p>
    <p><strong>Dienstleistungen (Index: "gewählt"):</strong> [${servicesText.join(', ')}]</p>
    <p><strong>Gesamtpreis:</strong> ${totalPrice} CHF</p>
    <p><strong>Gesamtdauer:</strong> ${totalDuration} Minuten</p>
  `;
}

// Hilfsfunktion: erzeuge Array, das zu jedem Service serviceID + name + price + chosen enthält
function getChosenServices() {
  // Wir wollen z.B. so was haben: 
  // allServices = [
  //   {serviceID:0, serviceName:"Basis", servicePrice:20, serviceDuration:15}, 
  //   {serviceID:1, serviceName:"Haarschnitt", servicePrice:50, serviceDuration:30},
  //   ...
  // ]
  // selectedServices = ["1","1","0","1"] (String-Array)
  // => wir mappen das zusammen:
  return allServices.map(s => {
    return {
      serviceID: s.serviceID,
      serviceName: s.serviceName,
      servicePrice: Number(s.servicePrice),
      serviceDuration: Number(s.serviceDuration),
      chosen: selectedServices[s.serviceID] || "0"
    };
  });
}

// Termin absenden => POST /api/appointments
async function confirmBooking() {
  const chosenServices = getChosenServices();
  const totalPrice = chosenServices.reduce((sum, s) => sum + (s.chosen === "1" ? s.servicePrice : 0), 0);
  const totalDuration = chosenServices.reduce((sum, s) => sum + (s.chosen === "1" ? s.serviceDuration : 0), 0);

  // Wir bauen das Array z. B. ["1","0","1","1"] als String
  // Je nachdem, wie du es brauchst: JSON-String, oder Komma-getrennt, ...
  // Hier machen wir JSON-String:
  const servicesString = JSON.stringify(selectedServices);

  // startDateTime => wir speichern OHNE die +1h (Server hat UTC?),
  //   oder wenn du willst, kannst du +1h wieder abziehen, 
  //   je nachdem, wie dein Server es erwartet.
  //   Angenommen, wir geben "2025-01-17T08:00" (UTC) an.
  let finalStartDateTime = selectedSlot.startDateTime; 

  // Das Payload-Objekt:
  const payload = {
    startDateTime: finalStartDateTime,
    endDateTime: "",  // optional
    duration: totalDuration,
    description: `Öffentliche Buchungsplattform (Kunde: ${personalData.firstName} ${personalData.lastName})`, 
    Preis: String(totalPrice),
    Dienstleistung: servicesString,
    Ressource: selectedUser.username,
    erfasstDurch: "öffentliche Buchungsplattform"
  };

  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Fehler beim Speichern des Termins");
    }
    const savedAppt = await response.json();
    console.log("Termin gespeichert:", savedAppt);

    // Erfolg anzeigen:
    document.getElementById('step5').style.display = 'none';
    const resultDiv = document.getElementById('bookingResult');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = "<h3>Vielen Dank!</h3><p>Deine Buchung war erfolgreich.</p>";
  } catch (err) {
    console.error("Fehler bei Buchung:", err);
    alert("Fehler bei der Buchung: " + err.message);
  }
}

// Buchung abbrechen => zurück zu Schritt 1 oder komplett beenden
function cancelBooking() {
  // Einfach reload, oder redirect:
  window.location.reload();
}

// --- Initialisierung der Steps & Buttons ---
function initStepNavigation() {
  // Schritt 1 => Schritt 2
  document.getElementById('toStep2').addEventListener('click', () => {
    if (!selectedUser) {
      alert("Bitte einen Mitarbeiter auswählen.");
      return;
    }
    // Schritt 1 ausblenden, Schritt 2 einblenden
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    renderWeekSelection();
  });
  
  // Schritt 2 => zurück zu Schritt 1
  document.getElementById('backToStep1').addEventListener('click', () => {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
  });

  // Schritt 3 => zurück zu Schritt 2
  document.getElementById('backToStep2').addEventListener('click', () => {
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
  });

  // Schritt 4 => zurück zu Schritt 3
  document.getElementById('backToStep3').addEventListener('click', () => {
    document.getElementById('step4').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
  });

  // Schritt 5: Buttons
  document.getElementById('confirmBooking').addEventListener('click', confirmBooking);
  document.getElementById('cancelBooking').addEventListener('click', cancelBooking);
}

// --- Haupt-Init-Funktion, wird nach Laden ausgeführt ---
async function initBooking() {
  initStepNavigation();
  initStep4();

  await loadServices(); 
  await loadUsers();

  // Schritt 1 ist sichtbar, rest ausgeblendet
  document.getElementById('step1').style.display = 'block';
}

// Starte
document.addEventListener('DOMContentLoaded', initBooking);
