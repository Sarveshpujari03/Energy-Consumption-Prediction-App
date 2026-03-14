const sql = require('mssql');
const poolPromise = require('../config/db');

class Predict {
  static async create(predictionData) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, predictionData.userId)
      .input('appliancesCount', sql.Int, predictionData.appliancesCount)
      .input('temperature', sql.Decimal(4,1), predictionData.temperature)
      .input('humidity', sql.Int, predictionData.humidity)
      .input('usageHours', sql.Int, predictionData.usageHours)
      .input('perUnitRate', sql.Decimal(6,2), predictionData.perUnitRate)
      .input('predictedDailyKwh', sql.Decimal(6,2), predictionData.predictedDailyKwh)
      .input('predictedMonthlyKwh', sql.Decimal(6,2), predictionData.predictedMonthlyKwh)
      .input('predictedMonthlyCost', sql.Decimal(8,2), predictionData.predictedMonthlyCost)
      .input('budget', sql.Decimal(8,2), predictionData.budget)
      .input('budgetExceeded', sql.Bit, predictionData.budgetExceeded)
      .input('month', sql.Int, predictionData.month || new Date().getMonth() + 1)
      .query(`
        INSERT INTO Predictions (
          UserId, AppliancesCount, Temperature, Humidity, UsageHours, 
          PerUnitRate, PredictedDailyKwh, PredictedMonthlyKwh, 
          PredictedMonthlyCost, Budget, BudgetExceeded, Month
        )
        OUTPUT INSERTED.Id
        VALUES (
          @userId, @appliancesCount, @temperature, @humidity, @usageHours,
          @perUnitRate, @predictedDailyKwh, @predictedMonthlyKwh,
          @predictedMonthlyCost, @budget, @budgetExceeded, @month
        )
      `);
    return result.recordset[0].Id;
  }

  static async findByUserId(userId, month = null) {
    const pool = await poolPromise;
    let query = `
      SELECT TOP 10 
        Id, AppliancesCount, Temperature, Humidity, UsageHours, PerUnitRate,
        PredictedDailyKwh, PredictedMonthlyKwh, PredictedMonthlyCost, Budget,
        BudgetExceeded, Month, CreatedAt
      FROM Predictions 
      WHERE UserId = @userId
    `;
    
    const request = pool.request().input('userId', sql.Int, userId);
    
    if (month) {
      query += ' AND Month = @month';
      request.input('month', sql.Int, month);
    }
    
    query += ' ORDER BY CreatedAt DESC';
    
    const result = await request.query(query);
    return result.recordset;
  }

  static async getHistoryStats(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          COUNT(*) as totalPredictions,
          AVG(PredictedMonthlyKwh) as avgMonthlyKwh,
          AVG(PredictedMonthlyCost) as avgMonthlyCost,
          SUM(CASE WHEN BudgetExceeded = 1 THEN 1 ELSE 0 END) as exceededCount
        FROM Predictions 
        WHERE UserId = @userId
      `);
    return result.recordset[0];
  }
}

module.exports = Predict;
