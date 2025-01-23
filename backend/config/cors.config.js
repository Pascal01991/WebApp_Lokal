const express = require('express');

// CORS-Einstellungen
const allowedOrigins = [
  //'http://localhost:8080',  // Lokale Entwicklung
  //'http://127.0.0.1:8080',  // Lokale Entwicklung (Alternative)
    'http://localhost:5000',  // Lokale Entwicklung

    'https://www.sapps.ch',    // Deine Produktionsdomain  https://www.
    'https://sapps.ch'          // Deine Produktionsdomain  https://
];





const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true, // Falls Cookies übertragen werden sollen
    preflightContinue: false,
    optionsSuccessStatus: 204
  };

  








module.exports = corsOptions;