// Diese Datei ist für ALLE Instanzen identisch – muss nie angepasst werden!
require('dotenv').config(); // Lädt die .env

module.exports = {
  apps: [
    {
      name: process.env.INSTANCE_NAME, 
      script: "./backend/server.js",
      watch: true,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};