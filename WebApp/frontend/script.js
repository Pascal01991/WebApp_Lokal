document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Verhindert das Standard-Formular-Verhalten
  
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',  // Hiermit werden Cookies oder Anmeldeinformationen gesendet
            body: JSON.stringify({ email, password }),
         });
          
  
      const data = await response.json();
  
      if (response.ok) {
        document.getElementById('message').textContent = 'Login erfolgreich! Token: ' + data.token;
        localStorage.setItem('token', data.token); // Speichert den Token im lokalen Speicher
      } else {
        document.getElementById('message').textContent = 'Login fehlgeschlagen: ' + data.msg;
      }
    } catch (err) {
      document.getElementById('message').textContent = 'Fehler: ' + err.message;
    }
  });
  