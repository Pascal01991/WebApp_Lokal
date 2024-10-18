const mongoose = require('mongoose');  // Mongoose muss importiert werden, um es zu verwenden



const appointmentSchema = new mongoose.Schema({
    duration: { 
        type: Number, // 
        required: true,
    },
    dateTime: { // Umbenannt von "date" zu "dateTime" für besseres Verständnis
        type: Date, // Mongoose kann Datum und Uhrzeit in einem einzigen Date-Feld speichern
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    Vorname: {
        type: String,
        required: true,
    },
    Nachname: {
        type: String,
        required: true,
    },
    Telefon: {
        type: String,
        required: true,
    },
    Mail: {
        type: String,
        required: true,
    },
    Dienstleistung: {
        type: String,
        required: true,
    }
});

// Lösche ein zwischengespeichertes Appointment-Modell, falls es existiert
if (mongoose.models.Appointment) {
    delete mongoose.models.Appointment;
}

// Definiere das Modell neu
const Appointment = mongoose.model('Appointment', appointmentSchema);


module.exports = mongoose.model('Appointment', appointmentSchema);
