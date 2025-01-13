const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true
  },
  serviceDescription: {
    type: String
  },
  servicePrice: {
    type: Number,
    default: 0
  },
  serviceDuration: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
