const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    workingHours: {
        type: Map,
        of: {
            active: Boolean,
            morning: { start: String, end: String },
            afternoon: { start: String, end: String }
        },
        required: true
    },
    holidays: [
        {
            from: String, // Startdatum (ISO-Format: YYYY-MM-DD)
            to: String,   // Enddatum (ISO-Format: YYYY-MM-DD)
            description: String
        }
    ]
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
