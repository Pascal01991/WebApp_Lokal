const mongoose = require('mongoose');

// Neues Schema mit zusätzlichen Feldern
const appointmentSchema = new mongoose.Schema({
    // Starttermin
    startDateTime: {
        type: String,
        required: true
    },
    // Endtermin
    endDateTime: {
        type: String,
        required: false // Kann optional sein, falls noch nicht festgelegt
    },
    // Dauer in Minuten (im Backend/DB speichern wir nur Minuten)
    duration: {
        type: Number,
        required: false,
        default: 0
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
    },

        erfasstDurch: {
        type: String,
        required: false 
    },
    
    projektId: {
        type: Number,
        required: false
    },
    
    verrechnungsTyp: {
        type: String,
        enum: ['Verrechnung an Kunde', 'Vertragsleistung', 'Garantie', 'Kulanz'],
        required: false
    },
    
    erbringungsStatus: {
        type: String,
        enum: ['Geplant', 'in Erbringung', 'Ausgeführt', 'Abgerechnet'],
        required: false
    },
    
    fakturaBemerkung: {
        type: String,
        required: false
    },
    
    fakturaNummer: {
        type: String,
        required: false
    },

    rechnungsEmpfaengerNummer: {
        type: Number,
        required: false
    }
});
    

// Falls bereits ein Modell definiert ist, löschen
if (mongoose.models.Appointment) {
    delete mongoose.models.Appointment;
}

// Neues oder aktualisiertes Modell erstellen
const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
