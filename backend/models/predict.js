const sql = require('mssql');
const poolPromise = require('../config/db');
const PredictionAppliance = require('./PredictionAppliance');

class Predict {
  static async create(predictionData) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const request = new sql.Request(transaction);

      const result = await request
        .input('userId', sql.Int, predictionData.userId)
        .input('householdSize', sql.Int, predictionData.householdSize)
        .input('temperature', sql.Decimal(5, 2), predictionData.temperature)
        .input('humidity', sql.Decimal(5, 2), predictionData.humidity)
        .input('perUnitRate', sql.Decimal(10, 2), predictionData.perUnitRate)
        .input('predictedDailyKwh', sql.Decimal(12, 2), predictionData.predictedDailyKwh)
        .input('predictedMonthlyKwh', sql.Decimal(12, 2), predictionData.predictedMonthlyKwh)
        .input('predictedMonthlyCost', sql.Decimal(12, 2), predictionData.predictedMonthlyCost)
        .input('budget', sql.Decimal(12, 2), predictionData.budget)
        .input('budgetExceeded', sql.Bit, predictionData.budgetExceeded)
        .input('savingsNeededKwh', sql.Decimal(12, 2), predictionData.savingsNeededKwh ?? 0)
        .input(
          'appliancesCount',
          sql.Int,
          predictionData.appliancesCount ?? predictionData.AppliancesCount ?? 0
        )
        .input('month', sql.Int, predictionData.month || (new Date().getMonth() + 1))
        .input(
          'recommendationsJson',
          sql.NVarChar(sql.MAX),
          JSON.stringify(predictionData.recommendations || [])
        )
        .query(`
          INSERT INTO Predictions (
            UserId,
            HouseholdSize,
            Temperature,
            Humidity,
            PerUnitRate,
            PredictedDailyKwh,
            PredictedMonthlyKwh,
            PredictedMonthlyCost,
            Budget,
            BudgetExceeded,
            SavingsNeededKwh,
            AppliancesCount,
            Month,
            RecommendationsJson
          )
          OUTPUT INSERTED.Id
          VALUES (
            @userId,
            @householdSize,
            @temperature,
            @humidity,
            @perUnitRate,
            @predictedDailyKwh,
            @predictedMonthlyKwh,
            @predictedMonthlyCost,
            @budget,
            @budgetExceeded,
            @savingsNeededKwh,
            @appliancesCount,
            @month,
            @recommendationsJson
          )
        `);

      const predictionId = result.recordset[0].Id;

      await PredictionAppliance.bulkCreate(
        predictionId,
        predictionData.appliances || [],
        transaction
      );

      await transaction.commit();
      return predictionId;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async findByUserId(userId, month = null) {
    const pool = await poolPromise;

    let query = `
      SELECT TOP 10
        Id,
        UserId,
        HouseholdSize,
        Temperature,
        Humidity,
        PerUnitRate,
        PredictedDailyKwh,
        PredictedMonthlyKwh,
        PredictedMonthlyCost,
        Budget,
        BudgetExceeded,
        SavingsNeededKwh,
        AppliancesCount,
        Month,
        RecommendationsJson,
        CreatedAt
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

    return result.recordset.map(item => ({
      ...item,
      Recommendations: item.RecommendationsJson ? JSON.parse(item.RecommendationsJson) : []
    }));
  }

  static async findDetailedById(id, userId) {
    const pool = await poolPromise;

    const predictionResult = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          Id,
          UserId,
          HouseholdSize,
          Temperature,
          Humidity,
          PerUnitRate,
          PredictedDailyKwh,
          PredictedMonthlyKwh,
          PredictedMonthlyCost,
          Budget,
          BudgetExceeded,
          SavingsNeededKwh,
          AppliancesCount,
          Month,
          RecommendationsJson,
          CreatedAt
        FROM Predictions
        WHERE Id = @id AND UserId = @userId
      `);

    const prediction = predictionResult.recordset[0];

    if (!prediction) {
      return null;
    }

    const appliances = await PredictionAppliance.findByPredictionId(prediction.Id);

    return {
      ...prediction,
      Recommendations: prediction.RecommendationsJson ? JSON.parse(prediction.RecommendationsJson) : [],
      Appliances: appliances
    };
  }

  static async getHistoryStats(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          COUNT(*) AS totalPredictions,
          AVG(PredictedMonthlyKwh) AS avgMonthlyKwh,
          AVG(PredictedMonthlyCost) AS avgMonthlyCost,
          SUM(CASE WHEN BudgetExceeded = 1 THEN 1 ELSE 0 END) AS exceededCount
        FROM Predictions
        WHERE UserId = @userId
      `);

    return result.recordset[0];
  }

  static async deleteById(id, userId) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      await PredictionAppliance.deleteByPredictionId(id, transaction);

      await new sql.Request(transaction)
        .input('id', sql.Int, id)
        .input('userId', sql.Int, userId)
        .query(`
          DELETE FROM Predictions
          WHERE Id = @id AND UserId = @userId
        `);

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = Predict;