const { spawn } = require('child_process');
const path = require('path');
const Prediction = require('../models/Predict');
const Profile = require('../models/Profile');

function runPythonScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [scriptPath, ...args]);
    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          resolve(JSON.parse(output.trim()));
        } catch {
          reject(new Error('Invalid model output'));
        }
      } else {
        reject(new Error(`Prediction failed: ${errorOutput || code}`));
      }
    });

    pythonProcess.on('error', reject);
  });
}

exports.predict = async (req, res) => {
  try {
    const inputData = req.body;
    const userId = req.user.Id;

    const profile = await Profile.findByUserId(userId);

    const finalData = {
      appliancesCount: inputData.appliancesCount || profile?.DefaultAppliances ,
      temperature: inputData.temperature || profile?.DefaultTemperature ,
      humidity: inputData.humidity || profile?.DefaultHumidity ,
      usageHours: inputData.usageHours || profile?.DefaultUsageHours ,
      perUnitRate: inputData.perUnitRate || profile?.DefaultPerUnitRate ,
      budget: inputData.budget ,
      userId
    };

    const modelPath = path.join(__dirname, '../../model/predict.py');
    const result = await runPythonScript(modelPath, [JSON.stringify(finalData)]);

    await Prediction.create({
      userId,
      predictionType: 'full',
      appliancesCount: finalData.appliancesCount,
      temperature: finalData.temperature,
      humidity: finalData.humidity,
      usageHours: finalData.usageHours,
      perUnitRate: finalData.perUnitRate,
      predictedDailyKwh: result.predicted_daily_kwh,
      predictedMonthlyKwh: result.predicted_monthly_kwh,
      predictedMonthlyCost: result.predicted_monthly_cost,
      budget: finalData.budget,
      budgetExceeded: result.budget_exceeded
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.predictPublic = async (req, res) => {
  try {
    const inputData = req.body;

    if (!inputData.appliancesCount || !inputData.temperature || !inputData.perUnitRate) {
      return res.status(400).json({ error: 'appliancesCount, temperature, perUnitRate required' });
    }

    const modelPath = path.join(__dirname, '../../model/predict.py');
    const result = await runPythonScript(modelPath, [JSON.stringify(inputData)]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.budgetCheck = async (req, res) => {
  try {
    const { appliancesCount, usageHours, perUnitRate, budget } = req.body;
    const userId = req.user.Id;

    if (!appliancesCount || !usageHours || !perUnitRate || !budget) {
      return res.status(400).json({ error: 'appliancesCount, usageHours, perUnitRate, budget required' });
    }

    const profile = await Profile.findByUserId(userId);

    const finalData = {
      appliancesCount,
      usageHours,
      perUnitRate,
      budget,
      temperature: profile?.DefaultTemperature || 25.0,
      humidity: profile?.DefaultHumidity || 50,
    };

    const modelPath = path.join(__dirname, '../../model/predict.py');
    const result = await runPythonScript(modelPath, [JSON.stringify(finalData)]);

    await Prediction.create({
      userId,
      predictionType: 'budget',
      appliancesCount: finalData.appliancesCount,
      usageHours: finalData.usageHours,
      perUnitRate: finalData.perUnitRate,
      predictedDailyKwh: result.predicted_daily_kwh,
      predictedMonthlyKwh: result.predicted_monthly_kwh,
      predictedMonthlyCost: result.predicted_monthly_cost,
      budget: finalData.budget,
      budgetExceeded: result.budget_exceeded
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.seasonal = async (req, res) => {
  try {
    const { appliancesCount, temperature, humidity, usageHours, perUnitRate } = req.body;
    const userId = req.user.Id;

    if (!appliancesCount || !temperature || !humidity || !usageHours || !perUnitRate) {
      return res.status(400).json({ error: 'appliancesCount, temperature, humidity, usageHours, perUnitRate required' });
    }

    const finalData = {
      appliancesCount,
      temperature,
      humidity,
      usageHours,
      perUnitRate,
      seasonal: true,
    };

    const modelPath = path.join(__dirname, '../../model/predict.py');
    const result = await runPythonScript(modelPath, [JSON.stringify(finalData)]);

    await Prediction.create({
      userId,
      predictionType: 'seasonal',
      appliancesCount: finalData.appliancesCount,
      temperature: finalData.temperature,
      humidity: finalData.humidity,
      usageHours: finalData.usageHours,
      perUnitRate: finalData.perUnitRate,
      predictedDailyKwh: result.predicted_daily_kwh,
      predictedMonthlyKwh: result.predicted_monthly_kwh,
      predictedMonthlyCost: result.predicted_monthly_cost,
      budgetExceeded: result.budget_exceeded ?? null
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { month } = req.query;
    const rawPredictions = await Prediction.findByUserId(
      req.user.Id,
      month ? parseInt(month) : null
    );

    const predictions = (rawPredictions || []).map(p => ({
      _id: p._id || p.id,
      predictionType: p.predictionType || p.PredictionType || 'full',
      appliancesCount: p.appliancesCount ?? p.AppliancesCount,
      temperature: p.temperature ?? p.Temperature,
      humidity: p.humidity ?? p.Humidity,
      usageHours: p.usageHours ?? p.UsageHours,
      perUnitRate: p.perUnitRate ?? p.PerUnitRate,
      predicted_daily_kwh: p.predictedDailyKwh ?? p.PredictedDailyKwh,
      predicted_monthly_kwh: p.predictedMonthlyKwh ?? p.PredictedMonthlyKwh,
      predicted_monthly_cost: p.predictedMonthlyCost ?? p.PredictedMonthlyCost,
      budget: p.budget ?? p.Budget,
      budget_exceeded: p.budgetExceeded ?? p.BudgetExceeded,
      createdAt: p.createdAt ?? p.CreatedAt,
    }));

    res.json({ predictions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await Prediction.getHistoryStats(req.user.Id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};