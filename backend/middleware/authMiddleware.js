const jwt = require('jsonwebtoken');



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
