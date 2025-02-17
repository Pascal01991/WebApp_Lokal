let currentDate = new Date();
let defaultAppointmentLength = 30; // in Minuten, später aus DB

// utils/availabilityUtils.js
const Settings = require('../models/settingsModel');

// Eine globale Variable, in der wir das aktuelle "workingHours"-Objekt zwischenspeichern.
let workingHours = {}; // <-- Hier ist unser "Cache"

// Wir laden das Settings-Dokument aus der DB und aktualisieren "workingHours".
async function loadWorkingHours() {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      console.warn("⚠️  Kein Settings-Dokument in der Datenbank gefunden. Verwende Standardwerte.");
      workingHours = {};
      return workingHours;
    }

    workingHours = settings.workingHours; // Im Cache speichern
    console.log("✅ Arbeitszeiten aus der DB geladen und zwischengespeichert.");
    return workingHours;
  } catch (error) {
    console.error("❌ Fehler beim Laden der Arbeitszeiten:", error);
    workingHours = {};
    return workingHours;
  }
}

/**
 * Gibt das zwischengespeicherte `workingHours`-Objekt zurück.
 */
function getWorkingHours() {
  return workingHours;
}

// Direkt beim Start einmalig laden (optional)
loadWorkingHours();


/*
let workingHours = {            //Später aus DB
    montag: {
        active: true,
        morning: { start: '08:00', end: '12:00' },
        afternoon: { start: '13:00', end: '18:00' }
    },
    dienstag: {
        active: true,
        morning: { start: '08:00', end: '12:00' },
        afternoon: { start: '13:00', end: '17:00' }
    },
    mittwoch: {
        active: true,
        morning: { start: '08:00', end: '12:00' },
        afternoon: { start: '13:30', end: '17:00' }
    },
    donnerstag: {
        active: true,
        morning: { start: '08:00', end: '12:00' },
        afternoon: { start: '13:00', end: '17:00' }
    },
    freitag: {
        active: true,
        morning: { start: '06:00', end: '12:00' },
        afternoon: { start: '13:00', end: '17:30' }
    },
    samstag: {
        active: false,
        morning: { start: null, end: null },
        afternoon: { start: null, end: null }
    },
    sonntag: {
        active: true,
        morning: { start: '08:00', end: '12:00' },
        afternoon: { start: '13:00', end: '17:30' }
    }
};
*/

    // Funktion, um den Start der Woche (Montag) zu erhalten
    function getStartOfWeek(date) {
        const day = date.getDay(); // 0 (So) bis 6 (Sa)
        const diff = (day === 0 ? -6 : 1 - day); // Anpassen, wenn Tag Sonntag ist
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    }


   // Hilfsfunktion, um eine Zeitangabe (HH:MM) in Minuten seit Mitternacht umzuwandeln
    function parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Funktion, um den Namen des Tages zu erhalten
    function getDayName(date) {
        const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        return days[date.getDay()];
}

function isDateInHoliday(date, holidays) {
    const formattedDate = date.toISOString().split('T')[0]; // Nur Datumsteil extrahieren
    console.log(`Vergleiche Datum: ${formattedDate}`);

    return holidays.some(holiday => {
        const fromDate = new Date(holiday.from).toISOString().split('T')[0];
        const toDate = new Date(holiday.to).toISOString().split('T')[0];
        console.log(`Prüfe gegen Feiertag: From ${fromDate}, To ${toDate}`);

        return formattedDate >= fromDate && formattedDate <= toDate;
    });
}



    //Zeitslots für neue Termine und extenre Buchungsplattform / Generierung der Zeit-Slots basierend auf der Standard-Terminlänge
    // Hilfsfunktion:
    function getHolidayResourcesForDate(date, holidays) {
        const dateStr = date.toISOString().split('T')[0];
        const arr = [];
      
        holidays.forEach(h => {
          const fromStr = new Date(h.from).toISOString().split('T')[0];
          const toStr   = new Date(h.to).toISOString().split('T')[0];
      
          // Liegt dateStr in [fromStr, toStr]?
          if (dateStr >= fromStr && dateStr <= toStr) {
            // Dann betreffen uns diese "resources"
            if (h.resource === "all") {
              arr.push("all");
            } else {
              arr.push(h.resource);
            }
          }
        });
        return arr; // z.B. ["all"], ["RiccardaKe"], []
      }
      
      function generateTimeSlots(holidays, startOfWeek, endOfWeek) {
        const slots = [];
        // ... deine Schleifen über die Tage / morning+afternoon ...
        //   => am Ende in der Innenschleife:
      
        const holidayRes = getHolidayResourcesForDate(slotTime, holidays);
        const newSlot = {
          startDateTime: slotTime,
          duration: defaultSlotLength,
          holidayResources: holidayRes
        };
        slots.push(newSlot);
      
        return slots;
      }
      

function generateTimeSlots(holidays = [], startOfWeek, endOfWeek) {
    const slots = [];
    const defaultSlotLength = 30;
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        if (day > endOfWeek) break;

        const dayName = getDayName(day).toLowerCase();
        if (!workingHours[dayName] || !workingHours[dayName].active) continue;

        ['morning','afternoon'].forEach(period => {
            const start = workingHours[dayName][period]?.start;
            const end = workingHours[dayName][period]?.end;
            if (!start || !end) return;

            const startMinutes = parseTime(start);
            const endMinutes = parseTime(end);

            for (let minutes = startMinutes; minutes < endMinutes; minutes += defaultSlotLength) {
                const slotTime = new Date(day);
                slotTime.setHours(0, minutes, 0, 0);
                
                // Statt bloß isHoliday = true/false => 
                // Wir holen uns ein Array aller Ressourcen, die hier Urlaub haben
                const holidayRes = getHolidayResourcesForDate(slotTime, holidays);
                
                const newSlot = {
                    dayIndex: i,
                    startDateTime: slotTime,
                    duration: defaultSlotLength,
                    holidayResources: holidayRes, // z.B. [] oder ["RiccardaKe"] oder ["all"]
                };
                
                slots.push(newSlot);
            }
        });
    }

    return slots;
}

    
/**
 * Aktualisiert die Verfügbarkeit jedes Slots für jede Ressource (User).
 * Hier wird nun auch berücksichtigt, ob der Slot in einem Feiertag liegt (slot.isHoliday).
 */

function updateSlotAvailability(slots, appointments, users) {
    slots.forEach(slot => {
      const slotStart = new Date(slot.startDateTime);
      const slotEnd   = new Date(slotStart.getTime() + slot.duration * 60000);
  
      // pro Slot legen wir ein Objekt an:
      slot.isAvailable = {};
  
      users.forEach(user => {
        // 1) Appointment-Konflikt?
        const conflict = appointments.some(app => {
          if (app.Ressource !== user.username) return false;
          const appStart = new Date(app.startDateTime);
          const appEnd   = new Date(appStart.getTime() + app.duration * 60000);
  
          return (slotStart < appEnd) && (appStart < slotEnd);
        });
  
        // 2) Urlaub? => holidayResources enthält 'all' oder user.username
        const isUserOnHoliday = 
            slot.holidayResources.includes('all') 
            || slot.holidayResources.includes(user.username);
  
        // => gesamt blockiert, wenn conflict ODER holiday
        const notAvailable = (conflict || isUserOnHoliday);
  
        slot.isAvailable[user.username] = !notAvailable;
  
        console.log(
          `User: ${user.username} | SlotStart: ${slotStart.toISOString()} | `
          + `Holiday: ${isUserOnHoliday} | Konflikt: ${conflict} => Available: ${!notAvailable}`
        );
      });
    });
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


    module.exports = {
        generateTimeSlots,
        updateSlotAvailability,
        getStartOfWeek,
        parseTime,
        getDayName,
        dateToLocalString,
        loadWorkingHours,
        getWorkingHours,

        // workingHours und defaultAppointmentLength könnten später aus DB kommen
    };

