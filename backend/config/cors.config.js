const express = require('express');

// CORS-Einstellungen - Alle Einträge in Kleinbuchstaben umwandeln
const allowedOrigins = [

    'http://localhost:5000',
    
     process.env.DASHBOARD_APP_DOMAIN,
    `${process.env.DASHBOARD_APP_DOMAIN}`,
     `https://${process.env.DASHBOARD_APP_DOMAIN}`,
    `https://www.${process.env.DASHBOARD_APP_DOMAIN}`
].map(origin => origin.toLowerCase()).filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);  // Debugging

const corsOptions = {
    origin: (origin, callback) => {
        console.log("Request received from origin:", origin); // Debugging
        
        // Falls keine Origin vorhanden ist (z.B. direkte API-Aufrufe), erlauben
        if (!origin) {
            return callback(null, true);
        }
        
        // Case-insensitive Vergleich der erlaubten Origins
        if (allowedOrigins.some(o => o.toLowerCase() === origin.toLowerCase())) {
            return callback(null, true);
        }
        
        console.log("Blocked by CORS:", origin); // Debugging
        callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true, // Falls Cookies übertragen werden sollen
    preflightContinue: false,
    optionsSuccessStatus: 204
};

module.exports = corsOptions;
