const { generateTimeSlots, updateSlotAvailability, dateToLocalString } = require('../utils/availabilityUtils');
const Appointment = require('../models/appointmentModel');

async function getSlots(req, res) {
    try {
        // Lade alle Termine
        const allAppointments = await Appointment.find();
        console.log('[getSlots] Anzahl gefundener Termine:', allAppointments.length, allAppointments);

        // Arbeitszeiten und defaultAppointmentLength sind in availabilityUtils.js definiert
        const slots = generateTimeSlots(); 
        updateSlotAvailability(slots, allAppointments);
        console.log('[getSlots] Slots nach update:', slots);

        // Formatieren (falls nötig)
        const formattedSlots = slots.map(slot => {
            const dateObj = new Date(slot.dateTime); // falls slot.time jetzt ein String ist
            return {
                
                dateTime: dateToLocalString(dateObj),
                duration: slot.duration,
                isAvailable: slot.isAvailable
            };
        });
        
        
        res.json(formattedSlots);
    } catch (error) {
        console.error('Fehler beim Berechnen der Slots:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
}

module.exports = { getSlots };
