const { getStartOfWeek, generateTimeSlots, updateSlotAvailability, dateToLocalString } = require('../utils/availabilityUtils');
const Appointment = require('../models/appointmentModel');

const Absence = require('../models/AbsenceModel'); // Importieren des Modells

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

        console.log('Angefragtes Datum:', requestedDate.toISOString());
        console.log('Start der Woche:', startOfWeek.toISOString());
        console.log('Ende der Woche:', endOfWeek.toISOString());

        const holidays = await fetchHolidaysFromDatabase();
        console.log('Geladene Feiertage:', holidays);

        // Generiere Slots für die angefragte Woche
        const slots = generateTimeSlots(holidays, startOfWeek, endOfWeek);
        console.log('Generierte Slots vor Filterung:', slots);

        // Filtere Slots für die aktuelle Woche
        const filteredSlots = slots.filter(slot => {
            const slotDate = new Date(slot.dateTime);
            return slotDate >= startOfWeek && slotDate <= endOfWeek;
        });

        console.log('Gefilterte Slots für die Woche:', filteredSlots);

        const formattedSlots = filteredSlots.map(slot => ({
            dayIndex: slot.dayIndex,
            dateTime: dateToLocalString(new Date(slot.dateTime)),
            duration: slot.duration,
            isAvailable: slot.isAvailable,
            isHoliday: slot.isHoliday,
        }));

        console.log('Formatierte Slots:', formattedSlots);

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
