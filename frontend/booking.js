/********************************************
 * booking.js
 ********************************************/

/*
  Annahmen bzw. Routen:
   - /api/services => Liefert Array von Services, z.B.:
     [
       {
         "serviceID": 0,
         "serviceName": "Basis-Termin",
         "servicePrice": 20,
         "serviceDuration": 15
       },
       {
         "serviceID": 1,
         "serviceName": "Haare Färben",
         "servicePrice": 30,
         "serviceDuration": 30
       },
       ...
     ]
   - /api/users => Liefert Array von Usern, z.B.:
     [
       {
         "username": "max",
         "publicName": "Max Mustermann",
         // optional: "servicesOffered": [0,1,2] => falls wir das pflegen
       },
       ...
     ]
   - /api/availability/slots?currentDate=YYYY-MM-DD => Liefert Slots für die angefragte Woche
   - /api/appointmentRequests (POST) => Speichert ins AppointmentRequestsSchema

  WICHTIG:
   - Index 0 (serviceID = 0) gilt IMMER als aktiv. Wir zeigen sie nicht an, rechnen sie aber immer ein.
   - Wenn ein User den/die gewählten Services nicht abdecken kann (z.B. der User hat 
     "servicesOffered" und es passt nicht), wird er/sie disabled.
   - In Schritt 2: wir haben "vorherige Woche", "nächste Woche", 
     schon geladene Slots => wir sehen, welche Tage noch frei sind.

  SCHRITTE:
   1) Services + Users laden
   2) Gewählte Services -> Filtern User -> disable/enable
   3) Datum => StartOfWeek + 7 Tage => "vorherige" / "nächste" => 
      Holen Slots => Markieren Vormittag/Nachmittag disabled/enabled
      (Wenn Tag < heute => disable)
      (Wenn in dem Vormittag KEIN Slot => disable)
      (Falls alle 7 Tage = disable => automatisch "nächsteWoche")
   4) Slots-liste -> Zeitauswahl
   5) Pers. Daten
   6) Zusammenfassung
   7) POST -> appointmentRequests

*/

// --- Globale States ---
let allServices = [];
let selectedServices = []; // "1"/"0" pro serviceID
let allUsers = [];
let selectedUser = null;

let displayedWeekStart = null; // Montag der aktuell angezeigten Woche
let loadedSlots = [];          // Alle Slots dieser Woche (aus /api/availability/slots)
let selectedDate = null;       // "YYYY-MM-DD"
let selectedPeriod = null;     // "morning"/"afternoon"
let selectedSlot = null;

let personalData = {
  firstName: "",
  lastName: "",
  email: ""
};

// Standard: serviceID=0 immer "1"
function initSelectedServices() {
  selectedServices = allServices.map(() => "0");
  const idx0 = allServices.findIndex(s => s.serviceID === 0);
  if (idx0 >= 0) {
    selectedServices[idx0] = "1"; 
  }
}

/***********************************************************
 * 1) SERVICES & USERS LADEN
 ***********************************************************/
async function loadServices() {
  try {
    const res = await fetch('/api/services');
    const data = await res.json();
    allServices = data;
    console.log("allServices:", allServices);
    initSelectedServices();
    renderServicesList();
  } catch (err) {
    console.error("Fehler beim Laden der Services:", err);
  }
}

function renderServicesList() {
  const container = document.getElementById('servicesList');
  container.innerHTML = "<h3>Verfügbare Dienstleistungen</h3>";

  // Zeige alle (außer ID=0)
  allServices.forEach(service => {
    if (service.serviceID !== 0) {
      const label = document.createElement('label');
      label.style.display = "block";

      const checkbox = document.createElement('input');
      checkbox.type = "checkbox";
      checkbox.value = service.serviceID;
      checkbox.checked = (selectedServices[service.serviceID] === "1");

      checkbox.addEventListener('change', () => {
        selectedServices[service.serviceID] = checkbox.checked ? "1" : "0";
        // Nach dem Klick ggf. Users updaten (disable/enable)
        updateUsersList();
      });

      label.appendChild(checkbox);
      label.appendChild(
        document.createTextNode(` ${service.serviceName} (${service.servicePrice} CHF)`)
      );
      container.appendChild(label);
    }
  });
}

// ----------------------------------------------------------

async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    const data = await res.json();
    allUsers = data.slice(1); // Entfernt den Benutzer mit Index 0 (Admin)
    console.log("allUsers:", allUsers);
    renderUsersList();
  } catch (err) {
    console.error("Fehler beim Laden der Users:", err);
  }
}

function renderUsersList() {
  const container = document.getElementById('usersList');
  container.innerHTML = "<h3>Mitarbeiter wählen</h3>";

  allUsers.forEach(user => {
    const label = document.createElement('label');
    label.style.display = "block";

    const radio = document.createElement('input');
    radio.type = "radio";
    radio.name = "selectedUser";
    radio.value = user.username;

    radio.addEventListener('change', () => {
      selectedUser = user;
    });

    label.appendChild(radio);
    label.appendChild(document.createTextNode(` ${user.publicName}`));
    container.appendChild(label);
  });

  // Wenn wir das erste Mal laden, direkt updateUsersList
  updateUsersList();
}

// ----------------------------------------------------------
// Diese Funktion disabled die User, die die aktuellen 
// ausgewählten Services NICHT alle anbieten (o.ä. Logik)
function updateUsersList() {
    // Sammle IDs der gewählten Services (als Zahlen):
    const chosen = getChosenServices().filter(s => s.chosen === "1");
    const chosenIDs = chosen.map(s => s.serviceID); // z.B. [1, 3]
  
    const container = document.getElementById('usersList');
    const labels = container.querySelectorAll('label');
    
    labels.forEach(label => {
      const radio = label.querySelector('input[type=radio]');
      if (!radio) return;
      // Finde den passenden User
      const user = allUsers.find(u => u.username === radio.value);
      if (!user) return;
  
      // Prüfe, ob user ALLE chosenIDs anbietet
      const canDoAll = canUserDoAllServices(user, chosenIDs);
  
      if (!canDoAll) {
        label.classList.add('disabled');
        radio.checked = false;
        radio.disabled = true;
        // Falls selectedUser = user => nullen wir es
        if (selectedUser && selectedUser.username === user.username) {
          selectedUser = null;
        }
      } else {
        label.classList.remove('disabled');
        radio.disabled = false;
      }
    });
  }
  

function canUserDoAllServices(user, chosenIDs) {
    /*
      user.availableServices: Array von Strings (z.B. ["0", "2", "3"])
      chosenIDs: Array von Zahlen (z.B. [0, 3]) oder evtl. gemischt
    */

    // Falls user.availableServices gar nicht definiert (oder kein Array):
    if (!Array.isArray(user.availableServices)) {
        return false;
    }

    // Wandle die gewählten IDs in Strings um:
    const chosenIDsAsStrings = chosenIDs.map(id => String(id));

    // Prüfe, ob *alle* gewählten IDs im availableServices-Array vorkommen
    return chosenIDsAsStrings.every(idStr => user.availableServices.includes(idStr));
}


/***********************************************************
 * 2) DATUMS-AUSWAHL (WOCHE)
 ***********************************************************/
function initWeekNavigation() {
  // setze displayedWeekStart = aktueller Montag
  displayedWeekStart = getStartOfWeek(new Date());
  document.getElementById('prevWeek').addEventListener('click', () => {
    // Gehe eine Woche zurück
    // Aber nicht in die Vergangenheit? => Du sagst "bereits vergangene Tage sperren".
    // Wir erlauben "zurück", ABER man kann die Vergangenheit ausgrauen. 
    // Optional kannst du es komplett blocken, wenn man nicht zurück soll.
    displayedWeekStart.setDate(displayedWeekStart.getDate() - 7);
    loadAndRenderWeek();
  });

  document.getElementById('nextWeek').addEventListener('click', () => {
    displayedWeekStart.setDate(displayedWeekStart.getDate() + 7);
    loadAndRenderWeek();
  });
}

function getStartOfWeek(date) {
  const day = date.getDay(); // So=0, Mo=1, ...
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0,0,0,0);
  return monday;
}

async function loadAndRenderWeek() {
  // Zuerst Slots für diese displayedWeekStart laden
  // => /api/availability/slots?currentDate=YYYY-MM-DD
  const isoDate = formatDate(displayedWeekStart); // e.g. "2025-01-13"
  try {
    const res = await fetch(`/api/availability/slots?currentDate=${isoDate}`);
    const data = await res.json();
    loadedSlots = data;
    console.log("SLOTS LOADED for week:", isoDate, loadedSlots);

    // Dann Tabelle rendern
    renderWeekTable();
    // Dann checken: sind ALLE Tage disabled => dann nächste Woche
    if (areAllDaysDisabled()) {
      // Automatic next week
      alert('Diese Woche keine verfügbaren Slots für die gewälten Optionen! Siehe Slots in kommender Woche!');
      displayedWeekStart.setDate(displayedWeekStart.getDate() + 7);
      await loadAndRenderWeek();
    }
  } catch (err) {
    console.error("Fehler beim Laden der Slots:", err);
  }
}

function renderWeekTable() {
  const currentWeekLabel = document.getElementById('currentWeekLabel');
  // Zeige den Montag + Datum
  const endOfWeek = new Date(displayedWeekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  currentWeekLabel.textContent = `Woche ${formatDate(displayedWeekStart)} - ${formatDate(endOfWeek)}`;

  const weekHeader = document.getElementById('weekHeader');
  const rowV = document.getElementById('rowVormittag');
  const rowN = document.getElementById('rowNachmittag');

  // Clear
  weekHeader.innerHTML = "<th></th>";
  rowV.innerHTML = "<td>Vormittag</td>";
  rowN.innerHTML = "<td>Nachmittag</td>";

  for (let i=0; i<7; i++) {
    const day = new Date(displayedWeekStart);
    day.setDate(day.getDate() + i);

    const wd = ["So","Mo","Di","Mi","Do","Fr","Sa"][day.getDay()];
    const dayNum = day.getDate();
    const monthNum = day.getMonth()+1;

    // Head
    const th = document.createElement('th');
    th.textContent = `${wd} ${dayNum}.${monthNum}`;
    weekHeader.appendChild(th);

    // Vormittag
    const tdV = document.createElement('td');
    const btnV = document.createElement('button');
    btnV.textContent = "Wählen";
    btnV.addEventListener('click', () => {
      selectedDate = formatDate(day);
      selectedPeriod = "morning";
      goToStep3();
    });
    tdV.appendChild(btnV);
    rowV.appendChild(tdV);

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
    rowN.appendChild(tdN);

    // 1) Vergangene Tage ausgrauen
    const today = new Date();
    if (day < stripTime(today)) {
      btnV.classList.add('disabled');
      btnV.disabled = true;
      btnN.classList.add('disabled');
      btnN.disabled = true;
    } else {
      // 2) Check: Gibt es für VORMITTAG oder NACHMITTAG mind. 1 verfügbaren Slot 
      const morningHasSlots = checkMorningAvailability(day);
      if (!morningHasSlots) {
        btnV.classList.add('disabled');
        btnV.disabled = true;
      }
      const afternoonHasSlots = checkAfternoonAvailability(day);
      if (!afternoonHasSlots) {
        btnN.classList.add('disabled');
        btnN.disabled = true;
      }
    }
  }
}

// Hilfsfunktionen, um zu prüfen, ob es in den loadedSlots 
// mind. 1 Slot für diesen Tag + morning/afternoon gibt
function checkMorningAvailability(dateObj) {
    const requiredDuration = calculateTotalDuration(); 
    if (!selectedUser) return true;  // oder false, je nach Bedarf
    if (requiredDuration <= 0) return false; // kein Service gewählt => ?
  
    const dateStr = formatDate(dateObj);
    const userName = selectedUser.username;
  
    // 1) Alle Morning-Slots des Tages sammeln, die für den User verfügbar sind
    const morningSlots = loadedSlots.filter(slot => {
      const slotDate = slot.startDateTime.split('T')[0];
      if (slotDate !== dateStr) return false;
  
      // morning => hour < 12
      const hour = parseInt(slot.startDateTime.split('T')[1].split(':')[0]);
      if (hour >= 12) return false;
  
      // Muss für diesen User frei sein
      if (!slot.isAvailable || !slot.isAvailable[userName]) return false;
  
      return true;
    });
  
    // 2) Chronologisch sortieren
    morningSlots.sort((a, b) => {
      return a.startDateTime.localeCompare(b.startDateTime);
    });
  
    // 3) Prüfen, ob ab einem der Slots die requiredDuration zusammenkommt
    for (let i = 0; i < morningSlots.length; i++) {
      if (hasSufficientConsecutiveSlots(morningSlots, i, requiredDuration)) {
        // Sobald wir eine passende Kette finden, können wir true zurückgeben
        return true;
      }
    }
  
    // Keine ausreichende Kette gefunden
    return false;
  }
  

  function checkAfternoonAvailability(dateObj) {
    const requiredDuration = calculateTotalDuration(); 
    if (!selectedUser) return true;
    if (requiredDuration <= 0) return false;
  
    const dateStr = formatDate(dateObj);
    const userName = selectedUser.username;
  
    // 1) Alle Afternoon-Slots
    const afternoonSlots = loadedSlots.filter(slot => {
      const slotDate = slot.startDateTime.split('T')[0];
      if (slotDate !== dateStr) return false;
  
      const hour = parseInt(slot.startDateTime.split('T')[1].split(':')[0]);
      if (hour < 12) return false;
  
      if (!slot.isAvailable || !slot.isAvailable[userName]) return false;
  
      return true;
    });
  
    // 2) sortieren
    afternoonSlots.sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
  
    // 3) Kettenprüfung
    for (let i = 0; i < afternoonSlots.length; i++) {
      if (hasSufficientConsecutiveSlots(afternoonSlots, i, requiredDuration)) {
        return true;
      }
    }
  
    return false;
  }
  

// Prüfen, ob alle Buttons in der Woche disabled sind 
function areAllDaysDisabled() {
  const rowV = document.getElementById('rowVormittag').querySelectorAll('button');
  const rowN = document.getElementById('rowNachmittag').querySelectorAll('button');

  const allButtons = [...rowV, ...rowN];
  return allButtons.every(btn => btn.disabled);
}

/***********************************************************
 * 3) SLOT-AUSWAHL
 ***********************************************************/
function goToStep3() {
  // step2 -> step3
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step3').style.display = 'block';

  renderSlotsForSelectedDay();
}

function renderSlotsForSelectedDay() {
    const container = document.getElementById('slotsContainer');
    container.innerHTML = "";
  
    const requiredDuration = calculateTotalDuration();
    const userName = selectedUser?.username;
    if (!userName) {
      container.textContent = "Kein Mitarbeiter gewählt!";
      return;
    }
  
    // 1) Alle Slots, die zum gewählten Tag + morning/afternoon + user passen
    let filtered = loadedSlots.filter(slot => {
      const slotDay = slot.startDateTime.split('T')[0];
      if (slotDay !== selectedDate) return false;
  
      const hour = parseInt(slot.startDateTime.split('T')[1].split(':')[0]);
      if (selectedPeriod === "morning" && hour >= 12) return false;
      if (selectedPeriod === "afternoon" && hour < 12) return false;
  
      if (!slot.isAvailable || !slot.isAvailable[userName]) return false;
      return true;
    });
  
    // 2) Sortieren
    filtered.sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
  
    // 3) Nur die Slots anbieten, ab denen genug Zeit ist
    const validStartSlots = [];
    for (let i = 0; i < filtered.length; i++) {
      if (hasSufficientConsecutiveSlots(filtered, i, requiredDuration)) {
        validStartSlots.push(filtered[i]);
      }
    }
  
    if (validStartSlots.length === 0) {
      container.textContent = "Keine freien Slots für die gewählte Dauer verfügbar.";
      return;
    }
  
    // 4) Button erstellen für jede mögliche Startzeit
    validStartSlots.forEach(slot => {
      const btn = document.createElement('button');
      const local = offsetByOneHour(slot.startDateTime);
      const hhmm = local.toISOString().substring(11,16); 
      btn.textContent = hhmm + " Uhr";
  
      btn.addEventListener('click', () => {
        selectedSlot = slot;
        goToStep4();
      });
  
      container.appendChild(btn);
    });
  }
  

/***********************************************************
 * 4) PERSÖNLICHE DATEN
 ***********************************************************/
function goToStep4() {
  document.getElementById('step3').style.display = 'none';
  document.getElementById('step4').style.display = 'block';
}

function initStep4() {
  const form = document.getElementById('personalDataForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    personalData.firstName = document.getElementById('firstName').value;
    personalData.lastName = document.getElementById('lastName').value;
    personalData.email = document.getElementById('email').value;
    goToStep5();
  });
}

/***********************************************************
 * 5) ZUSAMMENFASSUNG & POST
 ***********************************************************/
function goToStep5() {
    document.getElementById('step4').style.display = 'none';
    document.getElementById('step5').style.display = 'block';
  
    const summaryContainer = document.getElementById('summaryContainer');
    summaryContainer.innerHTML = "";
  
    const chosen = getChosenServices(); // array
    const totalPrice = chosen.reduce((acc, s) => acc + (s.chosen === "1" ? s.servicePrice : 0), 0);
    const totalDuration = chosen.reduce((acc, s) => acc + (s.chosen === "1" ? s.serviceDuration : 0), 0);
  
    // StartTime (+1h Anzeige)
    const localDate = offsetByOneHour(selectedSlot.startDateTime);
    const dateStr = localDate.toISOString().replace('T', ' ').substring(0, 16);
  
    // Liste der Dienstleistungen im Format "ServiceName (ServicePrice CHF)"
    const servicesText = chosen
      .filter(s => s.chosen === "1") // Nur ausgewählte Dienstleistungen anzeigen
      .map(s => `${s.serviceName} (${s.servicePrice} CHF)`); // Formatierung
  
    const html = `
      <p><strong>Datum/Uhrzeit:</strong> ${dateStr}</p>
      <p><strong>Mitarbeiter:</strong> ${selectedUser?.publicName || ''}</p>
      <p><strong>Name:</strong> ${personalData.firstName} ${personalData.lastName}</p>
      <p><strong>Email:</strong> ${personalData.email}</p>
      <p><strong>Dienstleistungen:</strong> ${servicesText.join(', ')}</p>
      <p><strong>Gesamtpreis:</strong> ${totalPrice} CHF</p>
      <p><strong>Geschätzte Dauer:</strong> ca. ${totalDuration} Minuten</p>
    `;
    summaryContainer.innerHTML = html;
  }

function confirmBooking() {
  const chosen = getChosenServices();
  const totalPrice = chosen.reduce((acc, s) => acc + (s.chosen==="1"? s.servicePrice:0), 0);
  const totalDuration = chosen.reduce((acc, s) => acc + (s.chosen==="1"? s.serviceDuration:0), 0)
  ;

  // Wir bauen das Array ["1","0","1"] etc. 
  // => In der Reihenfolge serviceID: 0..max
  // Da "allServices" evtl. unsortiert sein kann, 
  //   ist es hilfreich, es an serviceID zu koppeln.
  // Hier behelfen wir uns so:
  const maxID = Math.max(...allServices.map(s=>s.serviceID));
  // Erzeuge passendes Array der Länge (maxID+1)
  let servicesArray = new Array(maxID+1).fill("0");
  for (let s of allServices) {
    if (selectedServices[s.serviceID]==="1") {
      servicesArray[s.serviceID] = "1";
    }
  }

  // StartDateTime = original (UTC)
    let finalStart = selectedSlot.startDateTime; // ISO-String
    let startDate = new Date(finalStart); // In ein Date-Objekt umwandeln

    // totalDuration ist in Minuten, daher in Millisekunden umrechnen
    let endDate = new Date(startDate.getTime() + totalDuration * 60 * 1000); // Endzeit berechnen

    // Datum und Uhrzeit manuell formatieren
    const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Monat auf 2 Ziffern
    const day = String(date.getDate()).padStart(2, '0'); // Tag auf 2 Ziffern
    const hours = String(date.getHours()).padStart(2, '0'); // Stunden auf 2 Ziffern
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Minuten auf 2 Ziffern
    return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Start- und Endzeit formatieren
    let finalEnd = formatDateTime(endDate);

    const payload = {
    startDateTime: finalStart, // Original Startzeit
    endDateTime: finalEnd, // Manuell formatierte Endzeit
    duration: totalDuration,
    description: `Öffentliche Buchungsplattform (Kunde: ${personalData.firstName} ${personalData.lastName})`,
    MailAppointmentRequests: personalData.email,
    Preis: String(totalPrice),
    Dienstleistung: JSON.stringify(servicesArray),
    erfasstDurch: "öffentliche Buchungsplattform",
    Ressource: selectedUser?.username || "",
    };

    console.log("Payload für POST:", payload);


  console.log("Sende POST /api/appointmentRequests =>", payload);

  fetch('/api/appointmentRequests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  })
  .then(async (res) => {
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.error || "Fehler beim POSTen");
    }
    return res.json();
  })
  .then((saved) => {
    console.log("Termin-Anfrage gespeichert:", saved);
    // Step5 ausblenden, Erfolg
    document.getElementById('step5').style.display = 'none';
    const r = document.getElementById('bookingResult');
    r.style.display = 'block';
    r.innerHTML = "<h3>Vielen Dank!</h3><p>Deine Buchungsanfrage wurde übermittelt.</p>";
  })
  .catch(err => {
    console.error("Buchung fehlgeschlagen:", err);
    alert("Fehler: " + err.message);
  });
}

function cancelBooking() {
  window.location.reload();
}

/***********************************************************
 * HILFSFUNKTIONEN
 ***********************************************************/
// Services => array pro Service
function getChosenServices() {
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

// Summe der gewählten Services (inkl. ID=0)
function calculateTotalDuration() {
  const chosen = getChosenServices().filter(s => s.chosen==="1");
  return chosen.reduce((sum, s) => sum + s.serviceDuration, 0);
}

function stripTime(dateObj) {
  const d = new Date(dateObj);
  d.setHours(0,0,0,0);
  return d;
}

function formatDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth()+1).padStart(2,'0');
  const d = String(dateObj.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

// Offset by +1h
function offsetByOneHour(dateTimeStr) {
  // dateTimeStr = "2025-01-17T08:00"
  const d = new Date(dateTimeStr);
  d.setHours(d.getHours() + 1);
  return d;
}

/**
 * Prüft, ob ab sortedSlots[startIndex] für requiredDuration 
 * (z.B. 90 Min) durchgängig Slots verfügbar sind.
 * 
 * Annahme: Jeder Slot hat 'slot.duration' (z.B. 30) und 
 *          'startDateTime' (ISO-String).
 */
function hasSufficientConsecutiveSlots(sortedSlots, startIndex, requiredDuration) {
    // Restzeit, die wir noch abdecken müssen
    let minutesNeeded = requiredDuration;
  
    // Den ersten Slot direkt „belegen“
    let prevStart = new Date(sortedSlots[startIndex].startDateTime);
    let slotLength = sortedSlots[startIndex].duration; // meist 30
    minutesNeeded -= slotLength;
  
    // Iteration über die weiteren Slots
    for (let i = startIndex + 1; i < sortedSlots.length && minutesNeeded > 0; i++) {
      const currentStart = new Date(sortedSlots[i].startDateTime);
      // Wie viele Minuten liegen zwischen diesem Slot und dem vorherigen?
      const diff = (currentStart - prevStart) / 60000; // in Minuten
  
      // Ist der aktuelle Slot zeitlich DIREKT an den vorherigen anschließbar?
      // Beispiel: Wenn jeder Slot 30 Min dauert, 
      // müsste diff == 30 sein, um "consecutive" zu sein.
      if (diff === slotLength) {
        minutesNeeded -= sortedSlots[i].duration;
        prevStart = currentStart;
      } else {
        // Sobald eine Lücke im Zeitplan auftaucht, brechen wir ab
        break;
      }
    }
  
    // Geschafft, wenn minutesNeeded <= 0
    return (minutesNeeded <= 0);
  }
  

/***********************************************************
 * INITIALISIERUNG
 ***********************************************************/
function initStepNavigation() {
  // Step1 => Step2
  document.getElementById('toStep2').addEventListener('click', () => {
    if (!selectedUser) {
      alert("Bitte einen Mitarbeiter auswählen!");
      return;
    }
    // step1 -> step2
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    loadAndRenderWeek();
  });

  // Zurück zu Step1
  document.getElementById('backToStep1').addEventListener('click', () => {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
  });

  // Step3 => zurück zu Step2
  document.getElementById('backToStep2').addEventListener('click', () => {
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
  });

  // Step4 => zurück zu Step3
  document.getElementById('backToStep3').addEventListener('click', () => {
    document.getElementById('step4').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
  });

  // Step5: Buchung absenden
  document.getElementById('confirmBooking').addEventListener('click', confirmBooking);
  // Abbrechen
  document.getElementById('cancelBooking').addEventListener('click', cancelBooking);
}

async function initBooking() {
  initStepNavigation();
  initStep4();
  initWeekNavigation();

  // Lade Services & Users
  await loadServices();
  await loadUsers();
  
  // Step1 sichtbar
  document.getElementById('step1').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', initBooking);
