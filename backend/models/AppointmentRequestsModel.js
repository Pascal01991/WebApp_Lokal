const mongoose = require('mongoose');

// Neues Schema mit zusätzlichen Feldern
const AppointmentRequestsSchema = new mongoose.Schema({
    // Starttermin
    startDateTime: {
        type: String, //Hier die Starttime im Format "2025-01-17T14:00" eintragen
        required: true
    },
    // Endtermin
    endDateTime: {
        type: String,  //Hier die Endtime im Format "2025-01-17T14:00" eintragen
        required: false 
    },
    // Dauer in Minuten (im Backend/DB speichern wir nur Minuten)
    duration: {
        type: Number,   //Hier die Dauer bzw. total der dauer aller gewählten services inkl. index0
        required: false,
        default: 0
    },
    description: {
        type: String,
        required: true,
    },
    MailAppointmentRequests: {
        type: String,            //NEU: hier die vom Kunden eingetragene Mailadresse eintragen als String
        required: true,
    },
    KundennummerzumTermin: { 
        type: String, // oder Number, je nachdem wie die Kundennummer gespeichert wird
        default: "" 
    },
    Preis: {
        type: String,   //Hier der Preis bzw. total der Preise aller gewählten services inkl. index0
        required: true,
    },
    Abrechnungsstatus: {
        type: String,
        required: false,
    },
    Dienstleistung: {
        type: String,   //Hier die vorhin erwähnten Dienstleistungen zusammenfassen inkl. Index0. zum Beispiel: Array ()   0   "1"  1    "1"  2  "0"  3  "1"
        required: true,
    },

    erfasstDurch: {
        type: String,  //Hier jedesmal "öffentliche Buchungsplattform" eintragen
        required: false 
    },
    letzterBearbeiter: {
        type: String,
        required: false 
    },
    Ressource: {
        type: String,  //hier der user.username des jeweiligen users eintragen
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
if (mongoose.models.AppointmentRequests) {
    delete mongoose.models.AppointmentRequests;
}

// Neues oder aktualisiertes Modell erstellen
const AppointmentRequests = mongoose.model('AppointmentRequests', AppointmentRequestsSchema);

module.exports = AppointmentRequests;
