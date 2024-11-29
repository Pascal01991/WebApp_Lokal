const express = require('express');
const app = express();

app.use(express.static(__dirname));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



//Globale Backend-URL
export const BACKEND_URL = "https://sapps.ch/api";
