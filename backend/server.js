const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const authRoutes = require('./routes/auth');
const predictionRoutes = require('./routes/predict');
const profileRoutes = require('./routes/profile');

app.use('/api/auth', authRoutes);
app.use('/api/prediction', predictionRoutes);  
app.use('/api/profile', profileRoutes);


app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Backend running: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Prediction: http://localhost:${PORT}/api/prediction/predict`);
});