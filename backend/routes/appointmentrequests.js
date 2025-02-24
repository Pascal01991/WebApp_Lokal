const express = require('express');
const router = express.Router();
const AppointmentRequests = require('../models/AppointmentRequestsModel');
const Client = require('../models/clientModel');

// GET: Alle Termine abrufen
router.get('/', async (req, res) => {
    try {
        console.log("POST Request erhalten:", req.body);  // Logge die empfangenen Daten
        // Hier kannst du die Header ausgeben
        console.log(req.headers); // Diese Zeile zeigt den Authorization-Header und andere Header in der Konsole an

        const AppointmentRequests_const = await AppointmentRequests.find();
        res.json(AppointmentRequests_const);
    } catch (err) {
        res.status(500).json({ msg: 'Fehler beim Abrufen der Termine' });
    }
});

router.post('/', async (req, res) => {
    try {
        console.log("POST Request empfangen:", req.body);

        const {
            startDateTime,
            endDateTime,
            duration,
            description,
            KundennummerzumTermin,
            Preis,
            Abrechnungsstatus,
            MailAppointmentRequests,
            Dienstleistung,
            erfasstDurch,
            letzterBearbeiter,
            Ressource,
            projektId,
            verrechnungsTyp,
            erbringungsStatus,
            fakturaBemerkung,
            fakturaNummer,
            rechnungsEmpfaengerNummer
        } = req.body;

        // Validierung (Pflichtfelder)
        if (!startDateTime || !duration || !description) {
            return res.status(400).json({
                msg: "Fehlende Felder: startDateTime, duration oder description"
            });
        }

        // 1) Kundensuche anhand der E-Mail
        let finalKundennummer = KundennummerzumTermin || "";
        if (MailAppointmentRequests) {
            try {
                const normalizedEmail = MailAppointmentRequests.toLowerCase().trim();
                const existingClient = await Client.findOne({ 
                    Mail: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } 
                });

                if (existingClient) {
                    finalKundennummer = existingClient.Kundennummer;
                    console.log(`Kunde gefunden: ${existingClient.Kundennummer} für Mail ${normalizedEmail}`);
                }
            } catch (err) {
                console.error("Fehler bei der Kundensuche:", err);
                // Fehler nicht abbrechen lassen, nur loggen
            }
        }

        // 2) Neuen Request mit ermittelter Kundennummer erstellen
        const newAppointmentRequests = new AppointmentRequests({
            startDateTime,
            duration,
            description,
            endDateTime,
            KundennummerzumTermin: finalKundennummer,  // Hier wird die ermittelte Nummer eingesetzt
            Preis,
            Abrechnungsstatus,
            MailAppointmentRequests,
            Dienstleistung,
            erfasstDurch,
            letzterBearbeiter,
            Ressource,
            projektId,
            verrechnungsTyp,
            erbringungsStatus,
            fakturaBemerkung,
            fakturaNummer,
            rechnungsEmpfaengerNummer
        });

        // 3) Speichern
        await newAppointmentRequests.save();

        console.log("Neuer Termin gespeichert:", newAppointmentRequests);
        res.status(201).json(newAppointmentRequests);

    } catch (err) {
        console.error("Fehler beim Speichern des Termins:", err.message);
        console.error(err.stack);
        res.status(500).json({
            msg: 'Fehler beim Hinzufügen des Termins',
            error: err.message
        });
    }
});

// Route für Löschen Button
router.delete('/:id', async (req, res) => {
    try {
        console.log("Löschanfrage erhalten für ID: ", req.params.id);
        
        // Ändere die lokale Variable zu "deletedAppointmentRequest", um Überschneidungen zu vermeiden
        const deletedAppointmentRequest = await AppointmentRequests.findByIdAndDelete(req.params.id);
        
        if (!deletedAppointmentRequest) {
            console.log(`Kein Termin gefunden für ID: ${req.params.id}`);
            return res.status(404).json({ msg: 'Termin nicht gefunden' });
        }

        res.json({ msg: 'Termin gelöscht', deletedAppointmentRequest });
    } catch (err) {
        console.error("Fehler beim Löschen des Termins:", err.message);
        console.error("Stack Trace:", err.stack); // Stacktrace für genauere Fehlerdetails
        console.error("Request Params:", req.params); // Zeige die Parameter des Requests
        console.error("Request Headers:", req.headers); // Zeige die Header des Requests
        res.status(500).json({ msg: 'Fehler beim Löschen des Termins', error: err.message });
    }
});


//Route für Bearbeiten Button
router.put('/:id', async (req, res) => {
    try {
        const updatedAppointmentRequests = await AppointmentRequests.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedAppointmentRequests) {
            return res.status(404).json({ msg: 'Termin nicht gefunden' });
        }
        res.json(updatedAppointmentRequests);
    } catch (err) {
        res.status(500).json({ msg: 'Fehler beim Aktualisieren des Termins', error: err.message });
    }
});



module.exports = router;


