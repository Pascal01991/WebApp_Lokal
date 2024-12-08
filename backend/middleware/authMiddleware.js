const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

function auth(req, res, next) {
  // Token aus dem Header holen
  const token = req.cookies.token;
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
