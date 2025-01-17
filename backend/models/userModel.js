const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userID: {
    type: Number,
    required: true,
    unique: true, // e.g. 'user00', 'user0', 'user1', ...
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  publicName: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false // or true if you still need mandatory emails
    // unique: true, // optional, if you want unique emails
  },
  password: {
    type: String,
    required: true
  },
  activeModuls: {
    type: [String], // e.g. ['moduleA', 'moduleB'] 
    default: []
  },
  roles: {
    type: [String], // e.g. ['admin', 'editor'] or module-related roles
    default: []
  },
  availableServices: {
    type: [String], // or references to another model if you prefer
    default: []
  },
  UserSpecificSettings: {
    // Example structure for custom working hours:
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String },
  },
  color: {
    type: String,
    default: '#FFB6C1'
  }
}, { timestamps: true });

// Passwort vor dem Speichern hashen
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);


