const mongoose = require('mongoose');

mongoose.connection.on('connected', () => {
    console.log('Datenbank verbunden');
});
mongoose.connection.on('error', (err) => {
    console.error('Fehler bei der Datenbankverbindung:', err);
});
mongoose.connection.on('disconnected', () => {
    console.log('Datenbank getrennt');
});

// Definiere das Client-Schema
const clientSchema = new mongoose.Schema({
    Vorname: {
        type: String,
        required: true,
    },
    Nachname: {
        type: String,
        required: true,
    },
    Strasse: {
        type: String,
        required: true,
    },
    Hausnummer: {
        type: String,
        required: true,
    },
    Postleitzahl: {
        type: String,
        required: true,
    },
    Ort: {
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
    Kundennummer: {
        type: Number,
        required: true,
        unique: true
    }
});

// Lösche ein zwischengespeichertes Client-Modell, falls es existiert
if (mongoose.models.Client) {
    delete mongoose.models.Client;
}

// Definiere das Client-Modell neu
const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
