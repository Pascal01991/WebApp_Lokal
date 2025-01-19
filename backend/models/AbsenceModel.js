const mongoose = require('mongoose');

const absenceSchema = new mongoose.Schema({
/*    workingHours: {
        type: Map,
        of: {
            active: Boolean,
            morning: { start: String, end: String },
            afternoon: { start: String, end: String }
        },
        required: true
    },*/
    holidays: [
        {
            from: String, // Startdatum (ISO-Format: YYYY-MM-DD)
            to: String,   // Enddatum (ISO-Format: YYYY-MM-DD)
            description: String, // Beschreibung der Absenz
            resource: String,    // Ressource, auf die sich die Absenz bezieht
            status: {            // Genehmigungsstatus
                type: String,
                enum: ['Genehmigt', 'Abgelehnt', 'Ausstehend', ''], // Zulässige Werte
                default: 'Ausstehend'
            }
        }
    ]
});

const Absence = mongoose.model('Absence', absenceSchema);

module.exports = Absence;
