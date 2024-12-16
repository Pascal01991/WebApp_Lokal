const { generateTimeSlots, updateSlotAvailability, dateToLocalString } = require('../utils/availabilityUtils');
const Appointment = require('../models/appointmentModel');

async function getSlots(req, res) {
    try {
        // Lade alle Termine
        const allAppointments = await Appointment.find();
        
        // Arbeitszeiten und defaultAppointmentLength sind in availabilityUtils.js definiert
        const slots = generateTimeSlots(); 
        updateSlotAvailability(slots, allAppointments);
        
        // Formatieren (falls nötig)
        const formattedSlots = slots.map(slot => ({
            dateTime: dateToLocalString(slot.dateTime),
            duration: slot.duration,
            isAvailable: slot.isAvailable
        }));
        
        res.json(formattedSlots);
    } catch (error) {
        console.error('Fehler beim Berechnen der Slots:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
}

module.exports = { getSlots };