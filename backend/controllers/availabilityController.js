const { generateTimeSlots, updateSlotAvailability, dateToLocalString } = require('../utils/availabilityUtils');
const Appointment = require('../models/appointmentModel');

const Settings = require('../models/settingsModel'); // Importieren des Modells

async function fetchHolidaysFromDatabase() {
    try {
        const settings = await Settings.findOne();
        if (settings && settings.holidays) {
            console.log('Feiertage aus der Datenbank geladen:', settings.holidays);
            return settings.holidays;
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
        // Feiertage aus der Datenbank laden
        const holidays = await fetchHolidaysFromDatabase();
        console.log('Geladene Feiertage:', holidays);

        // Slots mit Feiertagen generieren
        const slots = generateTimeSlots(holidays);

        // Lade alle Termine
        const allAppointments = await Appointment.find();
        console.log('Geladene Termine:', allAppointments);

        // Aktualisiere die Verfügbarkeit der Slots basierend auf den Terminen
        updateSlotAvailability(slots, allAppointments);

        // Slots formatieren
        const formattedSlots = slots.map(slot => {
            const dateObj = new Date(slot.dateTime);
            return {
                dayIndex: slot.dayIndex,
                dateTime: dateToLocalString(dateObj),
                duration: slot.duration,
                isAvailable: slot.isAvailable,
                isHoliday: slot.isHoliday // Feiertagsstatus hinzufügen
            };
        });

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
