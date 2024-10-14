const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
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

module.exports = mongoose.model('Appointment', appointmentSchema);
