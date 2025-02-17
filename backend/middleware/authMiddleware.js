const jwt = require('jsonwebtoken');

const rateLimit = require('express-rate-limit');

// Erstelle eine Middleware für die Begrenzung der Loginversuche
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 Minute Zeitfenster
    max: 5, // Maximal 5 Anfragen pro Minute
    message: { msg: 'Zu viele fehlgeschlagene Login-Versuche. Bitte versuche es in einer Minute erneut.' },
    standardHeaders: true, // Zeigt Rate-Limit-Header an (X-RateLimit-*)
    legacyHeaders: false,  // Verwendet keine veralteten Header
});

module.exports = loginLimiter;


function auth(req, res, next) {
  console.log("Cookies:", req.cookies);
  console.log("Token:", req.cookies.token);
  // Token aus dem Header holen
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ msg: 'Kein Token, Zugriff verweigert' });
  }

  try {
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // Weiter zur geschützten Route
  } catch (err) {
    res.status(401).json({ msg: 'Ungültiges Token' });
  }
}

module.exports = auth;
