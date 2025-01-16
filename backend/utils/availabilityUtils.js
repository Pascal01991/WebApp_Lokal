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
        morning: { start: '08:00', end: '12:00' },
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
    function generateTimeSlots(holidays = [], startOfWeek, endOfWeek) {
        const slots = [];
        const defaultLength = 30; // z.B. 30 Minuten
    
        console.log('Generiere Slots für den Zeitraum:', startOfWeek.toISOString(), '-', endOfWeek.toISOString());
        console.log('Geladene Feiertage:', holidays);
    
        // Über die Tage der Woche iterieren
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
    
            if (day > endOfWeek) break;  // Außerhalb der Woche, Abbruch
    
            const dayName = getDayName(day).toLowerCase();
            if (!workingHours[dayName] || !workingHours[dayName].active) continue;
    
            // Morgens/Nachmittags
            const periods = ['morning', 'afternoon'];
            periods.forEach(period => {
                const start = workingHours[dayName][period]?.start;
                const end = workingHours[dayName][period]?.end;
    
                if (start && end) {
                    const startMinutes = parseTime(start);
                    const endMinutes = parseTime(end);
    
                    for (let minutes = startMinutes; minutes < endMinutes; minutes += defaultLength) {
                        const slotTime = new Date(day);
                        slotTime.setHours(0, minutes, 0, 0);
    
                        const isInHoliday = isDateInHoliday(slotTime, holidays);
                        console.log(`Slot geprüft: ${slotTime.toISOString()}, Feiertag: ${isInHoliday}`);
    
                        slots.push({
                            dayIndex: i,
                            // statt dateTime => startDateTime
                            startDateTime: slotTime,
                            duration: defaultLength,
                            isAvailable: !isInHoliday,
                            isHoliday: isInHoliday
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
            // slot.startDateTime ist jetzt ein Date-Objekt oder Date-String
            // ggf. konvertieren wir es:
            const slotStart = new Date(slot.startDateTime);
            const slotEnd = new Date(slotStart.getTime() + slot.duration * 60000);
    
            // Prüfe, ob der Slot mit einem bestehenden Termin kollidiert
            const conflict = appointments.some(app => {
                // auch hier dateTime -> startDateTime
                const appStart = new Date(app.startDateTime);
                const appEnd = new Date(appStart.getTime() + app.duration * 60000);
    
                return (slotStart < appEnd) && (appStart < slotEnd);
            });
    
            if (conflict) {
                slot.isAvailable = false;
            }
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

