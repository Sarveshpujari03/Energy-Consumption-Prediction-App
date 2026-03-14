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

app.post('/predict', async (req, res) => {
  try {
    const inputData = req.body;
    
    if (!inputData || !inputData.appliancesCount || !inputData.temperature) {
      return res.status(400).json({ error: 'Missing required inputs' });
    }

    const modelPath = path.join(__dirname, '../model/predict.py');
    
    if (!fs.existsSync(modelPath)) {
      return res.status(500).json({ error: 'Model not found. Run python ../model/train.py first' });
    }

    const pythonProcess = spawn('python', [modelPath, JSON.stringify(inputData)]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0 && output) {
        try {
          const result = JSON.parse(output);
          res.json(result);
        } catch (parseError) {
          res.status(500).json({ error: 'Invalid model output', output });
        }
      } else {
        res.status(500).json({ 
          error: 'Prediction failed', 
          code,
          stderr: errorOutput 
        });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Backend running: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
