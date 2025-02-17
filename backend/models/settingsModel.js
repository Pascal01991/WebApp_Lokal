// models/settingsModel.js

const mongoose = require('mongoose');

// Definiere ein Subschema für eine Zeitslot-Struktur (start und end)
const timeSlotSchema = new mongoose.Schema({
  start: { type: String, default: null },
  end: { type: String, default: null }
}, { _id: false });

// Schema für einen Tag mit drei Schichten (morning, afternoon, optional)
const daySchema = new mongoose.Schema({
  active: { type: Boolean, default: false },
  morning: { type: timeSlotSchema, default: {} },
  afternoon: { type: timeSlotSchema, default: {} },
  optional: { type: timeSlotSchema, default: {} }
}, { _id: false });

// Hauptschema für Settings
const settingsSchema = new mongoose.Schema({
  workingHours: {
    montag: { type: daySchema, default: {} },
    dienstag: { type: daySchema, default: {} },
    mittwoch: { type: daySchema, default: {} },
    donnerstag: { type: daySchema, default: {} },
    freitag: { type: daySchema, default: {} },
    samstag: { type: daySchema, default: {} },
    sonntag: { type: daySchema, default: {} }
  },
  defaultSlotLength: { type: Number, default: 30 }
});

module.exports = mongoose.model('Settings', settingsSchema);
