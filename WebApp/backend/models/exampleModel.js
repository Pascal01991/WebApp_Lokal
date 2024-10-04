const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema({
  name: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Example', exampleSchema);
