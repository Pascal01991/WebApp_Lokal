const mongoose = require('mongoose');  // Mongoose muss importiert werden, um es zu verwenden



const appointmentSchema = new mongoose.Schema({
    duration: { 
        type: Number, // 
        required: true,
    },
    dateTime: { // Umbenannt von "date" zu "dateTime" für besseres Verständnis
        type: String, // Mongoose kann Datum und Uhrzeit in einem einzigen Date-Feld speichern speichert aber UTC mit wenn man Type Date nehme nwürde
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    KundennummerzumTermin: {
        type: Number,
        required: true,
    },
    Preis: {
        type: String,
        required: true,
    },
    Abrechnungsstatus: {
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


