const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic route
app.get('/api', (req, res) => {
  res.json({ message: 'Buildroom Workflow API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
