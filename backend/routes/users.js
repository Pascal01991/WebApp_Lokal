const express = require('express');
const router = express.Router();
const User = require('../models/userModel'); // Pfad zum UserModel ggf. anpassen

// Neuen User erstellen
router.post('/', async (req, res) => {
    try {
        // OPTIONALE Logik für automatische userID o. Ä. könnte hier eingefügt werden.
                // ACHTUNG: Das funktioniert nur, wenn userID numerisch ist oder 
        //          du eine String-Parsierung für das Hochzählen implementierst.
        
        // 1) Letzter User anhand userID in absteigender Reihenfolge
        const lastUser = await User.findOne().sort({ userID: -1 });
        
        // 2) Berechne die nächste userID
        let nextUserID = 0;
        if (lastUser && Number.isInteger(lastUser.userID)) {
            nextUserID = lastUser.userID + 1;
        }
        // 3) Neuen User erstellen, userID setzen
        const newUser = new User({
            ...req.body,
            userID: nextUserID
        });
        await newUser.save();

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Fehler beim Erstellen des Users:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen des Users' });
    }
});

// Alle User abrufen
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Fehler beim Abrufen der Users:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Users' });
    }
});

// Einzelnen User abrufen
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
        res.json(user);
    } catch (error) {
        console.error('Fehler beim Abrufen des Users:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen des Users' });
    }
});

// User aktualisieren
router.put('/:id', async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
      
      // userID, username, email werden immer aktualisiert:
      if (req.body.userID !== undefined)    user.userID = req.body.userID;
      if (req.body.username !== undefined)  user.username = req.body.username;
      if (req.body.publicName !== undefined)  user.publicName = req.body.publicName;
      if (req.body.email !== undefined)     user.email = req.body.email;
      if (req.body.color !== undefined)     user.color = req.body.color;
      
      // Passwort nur updaten, wenn übergeben und nicht leer
      if (req.body.password && req.body.password.trim().length > 0) {
        user.password = req.body.password;
      }
      
      await user.save(); // Triggert .pre('save') (Hashing)
      res.json(user);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Users:', error);
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Users' });
    }
    
    /***************************************************
     * 5) BENUTZER BEARBEITEN (PUT)
     ***************************************************/
    async function editUser(userId) {
        // 1) Button "Neuen Benutzer anlegen" ausblenden
        document.getElementById('openUserFormButton').style.display = 'none';
    
        // 2) Benutzer-Objekt finden
        const user = allUsers.find(u => u._id === userId);
        if (!user) {
            alert('Benutzer nicht gefunden');
            return;
        }
    
        // 3) Felder füllen
        document.getElementById('userID').value   = user.userID || '';
        document.getElementById('username').value = user.username || '';
        document.getElementById('publicName').value = user.publicName || '';
        document.getElementById('email').value    = user.email || '';
        document.getElementById('color').value    = user.color || '';
        /*
        
    
      userID
      username
      email
      password 
      activeModuls
      roles
      availableServices
      UserSpecificSettings
      color
    
    */
        // 4) Formular anzeigen
        showUserForm();
    
        // 5) Button "Änderungen speichern" ...
        const submitButton = document.querySelector('#userForm button[type="submit"]');
        submitButton.innerText = "Änderungen speichern";
        submitButton.replaceWith(submitButton.cloneNode(true));
        const newSubmitButton = document.querySelector('#userForm button[type="submit"]');
    
        // 6) Services laden und Checkboxen erstellen
        const services = await loadAllServices();
        renderServiceCheckboxes(services);
    
        // 7) Checkboxen "vorbelegen"
        //    Falls user.availableServices ein Array mit z.B. service._id oder serviceName enthält:
        if (Array.isArray(user.availableServices)) {
            user.availableServices.forEach(svc => {
                // Finde die Checkbox, die den Wert "svc" hat
                const checkbox = document.querySelector(`#servicesCheckboxContainer .service-checkbox[value="${svc}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    
        newSubmitButton.addEventListener('click', async (e) => {
            e.preventDefault();
            // Updated-Daten ...
            const passwordInput = document.getElementById('password').value.trim();
            const updatedUser = {
                userID: document.getElementById('userID').value,
                username: document.getElementById('username').value,
                publicName: document.getElementById('publicName').value,
                email: document.getElementById('email').value,
                color: document.getElementById('color').value
            };
    
            // Passwort nur hinzufügen, wenn nicht leer ...
            if (passwordInput !== "") {
                updatedUser.password = passwordInput;
            }
    
            // Ausgewählte Services abgreifen
            const checkboxes = document.querySelectorAll('#servicesCheckboxContainer .service-checkbox:checked');
            updatedUser.availableServices = Array.from(checkboxes).map(cb => cb.value);
    
            // PUT-Request ...
            try {
                
                const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedUser)
                });
                if (response.ok) {
                    alert('Benutzer erfolgreich aktualisiert');
                    await loadUsers();
                    hideUserForm();
                } else {
                    alert('Fehler beim Aktualisieren des Benutzers');
                }
            } catch (err) {
                alert('Fehler: ' + err.message);
            }
        });
    }
  });
  

// User löschen
router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: 'User nicht gefunden' });
        res.json({ message: 'User gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen des Users:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Users' });
    }
});

module.exports = router;
