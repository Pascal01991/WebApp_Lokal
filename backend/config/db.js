const mongoose = require('mongoose');
const User = require('../models/userModel');

// server.js oder app.js (nach dem DB-Connect!)
async function seedStandardUsers() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // => DB ist leer, wir legen 2 Standard-User an
      const defaultUsers = [
        {
          userID: 0,
          username: 'admin',
          password: process.env.Password_User0 // wird in userSchema prä-save gehasht
        },
        {
          userID: 1,
          username: 'demo',
          password: process.env.Password_User1
        }
      ];
      await User.create(defaultUsers); // das führt bei jedem Dokument pre('save') aus
      console.log('Standard-User angelegt!');
    } else {
      console.log('Es existieren bereits User-Dokumente, keine Standard-User angelegt.');
    }
  } catch (error) {
    console.error('Fehler beim Erstellen der Standard-User:', error);
  }
}


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB verbunden');
    seedStandardUsers();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;



