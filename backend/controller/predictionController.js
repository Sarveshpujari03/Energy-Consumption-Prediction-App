const { spawn } = require('child_process');
const path = require('path');
const Predict = require('../models/predict');
const Profile = require('../models/Profile');
const ProfileAppliance = require('../models/ProfileAppliance');

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
      console.error('🐍 Python stderr:', data.toString());
    });

    pythonProcess.on('close', (code) => {

      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (parseErr) {
          console.error('JSON parse error:', parseErr.message);
          reject(new Error(`Invalid JSON from Python: ${output.substring(0, 300)}`));
        }
      } else {

        reject(new Error(`Python failed (code ${code}): ${errorOutput || 'No stderr, check model files'}`));
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Spawn error:', err.message);
      reject(new Error(`Python spawn failed: ${err.message}`));
    });
  });
}

exports.predict = async (req, res) => {
  try {
    const inputData = req.body;
    const userId = req.user.Id;

    let appliances = [];

    if (inputData.appliancesList && inputData.appliancesList.length > 0) {

      appliances = inputData.appliancesList.map(a => ({
        name: a.name,
        quantity: a.quantity,
        hours: a.hours || a.usageHours,  

        wattage: a.wattage || a.watts    

      }));
    } else {

      const profile = await Profile.findByUserId(userId);
      const profileAppliances = await ProfileAppliance.findByProfileId(profile?.Id);
      appliances = profileAppliances || inputData.appliances || [];

      appliances = appliances.map(a => ({
        name: a.ApplianceName || a.applianceName || a.name,
        quantity: a.Quantity || a.quantity,
        hours: a.UsageHours || a.usageHours || a.hours,
        wattage: a.Watts || a.watts
      })).filter(a => a.name && a.quantity > 0);
    }

    if (appliances.length === 0) {
      return res.status(400).json({ 
        error: 'No appliances found. Need appliancesList or profile appliances' 
      });
    }

    const finalData = {
      householdSize: inputData.householdSize || 4,
      temperature: inputData.temperature || 25.0,
      humidity: inputData.humidity || 50.0,
      perUnitRate: inputData.perUnitRate || 7.50,
      budget: inputData.budget || 2500,
      appliancesList: appliances  

    };

    const modelPath = path.join(__dirname, '../../model/predict.py');
    const result = await runPythonScript(modelPath, [JSON.stringify(finalData)]);

    await Predict.create({
      userId,
      householdSize: finalData.householdSize,
      temperature: finalData.temperature,
      humidity: finalData.humidity,
      perUnitRate: finalData.perUnitRate,
      predictedDailyKwh: result.predicted_daily_kwh,
      predictedMonthlyKwh: result.predicted_monthly_kwh,
      predictedMonthlyCost: result.predicted_monthly_cost,
      budget: finalData.budget,
      budgetExceeded: result.budget_exceeded,
      savingsNeededKwh: result.savings_needed_kwh || 0,
      AppliancesCount: finalData.appliancesList.length,
      appliances: finalData.appliancesList,
      recommendations: result.recommendations || []
    });

    res.json(result);
  } catch (error) {
    console.error('❌ Predict error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.predictPublic = async (req, res) => {
  try {
    const inputData = req.body;

    const finalData = {
      ...inputData,
      appliancesList: inputData.appliancesList || inputData.appliances?.map?.(a => ({
        name: a.name,
        quantity: a.quantity,
        hours: a.hours || a.usageHours,
        wattage: a.wattage || a.watts
      })) || []
    };

    if (finalData.appliancesList.length === 0) {
      return res.status(400).json({ error: 'appliancesList required' });
    }

    const modelPath = path.join(__dirname, '../../model/predict.py');
    const result = await runPythonScript(modelPath, [JSON.stringify(finalData)]);
    res.json(result);
  } catch (error) {
    console.error('❌ Public predict error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
exports.budgetCheck = async (req, res) => {
  try {
    const { appliances, perUnitRate, budget } = req.body;
    const userId = req.user.Id;

    if (!appliances || !appliances.length || !perUnitRate || !budget) {
      return res.status(400).json({ 
        error: 'appliances, perUnitRate, budget required',
        appliancesExample: '[{name: "Fan", quantity: 2, usageHours: 10, watts: 80}]'
      });
    }

    const profile = await Profile.findByUserId(userId);

    const finalData = {
      householdSize: profile?.HouseholdSize || 4,
      appliances,
      perUnitRate,
      budget,
      temperature: profile?.DefaultTemperature || 25.0,
      humidity: profile?.DefaultHumidity || 50,
    };

    const modelPath = path.join(__dirname, '../../model/predict.py');
    const result = await runPythonScript(modelPath, [JSON.stringify(finalData)]);

    await Predict.create({
      userId,
      householdSize: finalData.householdSize,
      temperature: finalData.temperature,
      humidity: finalData.humidity,
      perUnitRate: finalData.perUnitRate,
      predictedDailyKwh: result.predicted_daily_kwh,
      predictedMonthlyKwh: result.predicted_monthly_kwh,
      predictedMonthlyCost: result.predicted_monthly_cost,
      budget: finalData.budget,
      budgetExceeded: result.budget_exceeded,
      appliances: finalData.appliances
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.seasonal = async (req, res) => {
  try {
    const { appliances, temperature, humidity, perUnitRate } = req.body;
    const userId = req.user.Id;

    if (!appliances || !appliances.length || !temperature || !humidity || !perUnitRate) {
      return res.status(400).json({ 
        error: 'appliances, temperature, humidity, perUnitRate required' 
      });
    }

    const finalData = {
      householdSize: 4, 

      appliances,
      temperature,
      humidity,
      perUnitRate,
      seasonal: true,
    };

    const modelPath = path.join(__dirname, '../../model/predict.py');
    const result = await runPythonScript(modelPath, [JSON.stringify(finalData)]);

    await Predict.create({
      userId,
      householdSize: finalData.householdSize,
      temperature: finalData.temperature,
      humidity: finalData.humidity,
      perUnitRate: finalData.perUnitRate,
      predictedDailyKwh: result.predicted_daily_kwh,
      predictedMonthlyKwh: result.predicted_monthly_kwh,
      predictedMonthlyCost: result.predicted_monthly_cost,
      budgetExceeded: result.budget_exceeded ?? null,
      appliances: finalData.appliances,
      month: new Date().getMonth() + 1
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { month } = req.query;
    const predictions = await Predict.findByUserId(
      req.user.Id,
      month ? parseInt(month) : null
    );

    res.json({ predictions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDetailedPrediction = async (req, res) => {
  try {
    const { id } = req.params;
    const prediction = await Predict.findDetailedById(parseInt(id), req.user.Id);

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await Predict.getHistoryStats(req.user.Id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};