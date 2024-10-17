const express = require("express");
const {
  getAppointment,
  postAppointment,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");
const router = express.Router();

// GET: Alle Termine abrufen
router.get("/", getAppointment);

router.post("/", postAppointment);

//Route für Löschen Button
router.delete("/:id", deleteAppointment);

//Route für Bearbeiten Button
router.put("/:id", updateAppointment);

module.exports = router;
