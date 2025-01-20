const { getStartOfWeek, generateTimeSlots, updateSlotAvailability, dateToLocalString } = require('../utils/availabilityUtils');
const Appointment = require('../models/appointmentModel');

const Absence = require('../models/AbsenceModel'); // Importieren des Modells

const User = require('../models/userModel');

async function fetchHolidaysFromDatabase() {
    try {
        const absence = await Absence.findOne();
        if (absence && absence.holidays) {
            console.log('Feiertage aus der Datenbank geladen:', absence.holidays);
            return absence.holidays;
        }
        console.warn('Keine Feiertage in der Datenbank gefunden.');
        return [];
    } catch (error) {
        console.error('Fehler beim Abrufen der Feiertage aus der Datenbank:', error);
        throw error;
    }
}



async function getSlots(req, res) {
    try {
        const requestedDate = new Date(req.query.currentDate);
        const startOfWeek = getStartOfWeek(requestedDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        const holidays = await fetchHolidaysFromDatabase();
        
        // 1) Alle User laden:
        const users = await User.find({}); 
        // 2) Alle Appointments laden (ggf. nur für diese Woche filtern, falls gewünscht):
        const appointments = await Appointment.find(/* evtl. Filter */);

        // 3) Slots generieren
        let slots = generateTimeSlots(holidays, startOfWeek, endOfWeek);

        // 4) Slots filtern, damit sie nur in der aktuellen Woche bleiben
        slots = slots.filter(slot => {
            const slotDate = new Date(slot.startDateTime);
            return slotDate >= startOfWeek && slotDate <= endOfWeek;
        });

        // 5) Die Verfügbarkeit für jeden Slot **pro User** updaten
        updateSlotAvailability(slots, appointments, users, holidays);

        // 6) Für die Ausgabe formatieren
        //    Beachte hier: Wenn du pro User ein Objekt in `slot.isAvailable` hast,
        //    willst du das vermutlich direkt so durchreichen, oder entsprechend formatieren.
        const formattedSlots = slots.map(slot => ({
            dayIndex: slot.dayIndex,
            startDateTime: dateToLocalString(new Date(slot.startDateTime)),
            duration: slot.duration,
            // Hier kommt neu: isAvailable (pro User!)
            isAvailable: slot.isAvailable,   
            isHoliday: slot.isHoliday,
            holidayResources: slot.holidayResources 
        }));

        res.json(formattedSlots);

    } catch (error) {
        console.error('Fehler beim Berechnen der Slots:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
}





module.exports = { 
    getSlots, 
    fetchHolidaysFromDatabase,
};
