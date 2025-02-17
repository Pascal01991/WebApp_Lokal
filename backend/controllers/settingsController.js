// controllers/settingsController.js

/**
 * Hier steckt die Logik für das Abrufen, Erstellen und Aktualisieren
 * des Settings-Dokuments in der Datenbank.
 */

const Settings = require('../models/settingsModel');


const { loadWorkingHours } = require('../utils/availabilityUtils');

/**
 * PUT /api/settings/:id
 * Aktualisiert das Settings-Dokument in der Datenbank und erneuert anschließend `workingHours`.
 */
async function updateSettings(req, res) {
  try {
    const { id } = req.params;

    // Settings in der DB aktualisieren
    const updatedSettings = await Settings.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedSettings) {
      return res.status(404).json({ error: "Settings nicht gefunden" });
    }

    // Nach dem erfolgreichen Update in der DB, den Cache aktualisieren
    await loadWorkingHours();

    // Aktualisiertes Dokument an den Client zurücksenden
    res.json(updatedSettings);
  } catch (error) {
    console.error("❌ Fehler beim Aktualisieren der Settings:", error);
    res.status(500).json({ error: "Fehler beim Aktualisieren der Settings" });
  }
}

/**
 * GET /api/settings
 * Lädt das (einzige) Settings-Dokument aus der Datenbank.
 * Falls keines existiert, kann optional ein Standard-Dokument erzeugt werden.
 */
async function getSettings(req, res) {
  try {
    let settings = await Settings.findOne();

    // Wenn kein Settings-Dokument existiert, erzeuge ein Standard-Dokument (optional)
    if (!settings) {
      settings = new Settings({
        workingHours: {
          montag: { active: false, morning: {}, afternoon: {}, optional: {} },
          dienstag: { active: false, morning: {}, afternoon: {}, optional: {} },
          mittwoch: { active: false, morning: {}, afternoon: {}, optional: {} },
          donnerstag: { active: false, morning: {}, afternoon: {}, optional: {} },
          freitag: { active: false, morning: {}, afternoon: {}, optional: {} },
          samstag: { active: false, morning: {}, afternoon: {}, optional: {} },
          sonntag: { active: false, morning: {}, afternoon: {}, optional: {} }
        },
        defaultSlotLength: 30
      });
      await settings.save();
    }

    return res.json(settings);
  } catch (error) {
    console.error('Fehler beim Abrufen der Settings:', error);
    return res.status(500).json({ error: 'Fehler beim Abrufen der Settings' });
  }
}

/**
 * POST /api/settings
 * Erstellt ein neues Settings-Dokument in der Datenbank.
 * Diese Funktion brauchst du meist nur, wenn du manuell weitere
 * Settings-Dokumente anlegen möchtest. (Oft hat man nur EIN Settings-Dokument.)
 */
async function createSettings(req, res) {
  try {
    const newSettings = new Settings(req.body);
    await newSettings.save();
    return res.status(201).json(newSettings);
  } catch (error) {
    console.error('Fehler beim Erstellen der Settings:', error);
    return res.status(500).json({ error: 'Fehler beim Erstellen der Settings' });
  }
}

/**
 * PUT /api/settings/:id
 * Aktualisiert ein bestehendes Settings-Dokument anhand seiner ID.
 */
async function updateSettings(req, res) {
  try {
    const { id } = req.params;
    const updatedSettings = await Settings.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedSettings) {
      return res.status(404).json({ error: 'Settings nicht gefunden' });
    }
    return res.json(updatedSettings);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Settings:', error);
    return res.status(500).json({ error: 'Fehler beim Aktualisieren der Settings' });
  }
}

module.exports = {
  getSettings,
  createSettings,
  updateSettings
};
