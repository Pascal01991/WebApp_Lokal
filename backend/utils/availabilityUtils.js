let currentDate = new Date();
let defaultAppointmentLength = 30; // in Minuten, später aus DB



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
        afternoon: { start: '12:30', end: '17:00' }
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
    // Gibt ein Array aller Ressourcen zurück, die an 'date' Urlaub haben
    // oder "all", wenn es ein Eintrag mit resource="all" gibt
    const dateStr = date.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const holidayResources = [];

    holidays.forEach(holiday => {
        const fromDate = new Date(holiday.from).toISOString().split('T')[0];
        const toDate = new Date(holiday.to).toISOString().split('T')[0];
        // Prüfen, ob "dateStr" in diesem Holiday-Zeitraum liegt
        if (dateStr >= fromDate && dateStr <= toDate) {
            // Dann gehört "holiday.resource" hier rein
            holidayResources.push(holiday.resource); 
            // (z.B. "RiccardaKe", "AlexandraHe", oder "all")
        }
    });

    return holidayResources; // leeres Array, wenn kein passender Holiday
}

function generateTimeSlots(holidays = [], startOfWeek, endOfWeek) {
    const slots = [];
    const defaultLength = 30;
    
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

            for (let minutes = startMinutes; minutes < endMinutes; minutes += defaultLength) {
                const slotTime = new Date(day);
                slotTime.setHours(0, minutes, 0, 0);
                
                // Statt bloß isHoliday = true/false => 
                // Wir holen uns ein Array aller Ressourcen, die hier Urlaub haben
                const holidayRes = getHolidayResourcesForDate(slotTime, holidays);
                
                const newSlot = {
                    dayIndex: i,
                    startDateTime: slotTime,
                    duration: defaultLength,
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

        slot.isAvailable = {};

        // Wir durchlaufen jeden Benutzer
        users.forEach(user => {
            // 1) Hat der User bereits einen Termin-Konflikt in dieser Zeit?
            const conflict = appointments.some(app => {
                if (app.Ressource !== user.username) return false;
                const appStart = new Date(app.startDateTime);
                const appEnd   = new Date(appStart.getTime() + app.duration * 60000);
                // Zeitüberlappung?
                return (slotStart < appEnd) && (appStart < slotEnd);
            });

            // 2) Ist der User in holidayResources? 
            //    (Oder steht dort "all"?)
            const isUserOnHoliday = 
                slot.holidayResources.includes('all') 
                || slot.holidayResources.includes(user.username);

            // Wenn entweder Konflikt oder Urlaub, dann nicht verfügbar
            const notAvailable = (conflict || isUserOnHoliday);

            slot.isAvailable[user.username] = !notAvailable;

            console.log(
                `User: ${user.username} | SlotStart: ${slotStart.toISOString()} | `
              + `Holiday: ${isUserOnHoliday} | Konflikt: ${conflict} `
              + `=> Available: ${!notAvailable}`
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
        // workingHours und defaultAppointmentLength könnten später aus DB kommen
    };

