const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  title: {
    type: String,
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
  },
  timestamp: { type: Date, default: Date.now },
  duration: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
