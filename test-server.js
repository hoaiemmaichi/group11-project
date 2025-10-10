const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS for all origins
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the test file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-frontend.html'));
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Test frontend server running at http://localhost:${PORT}`);
});