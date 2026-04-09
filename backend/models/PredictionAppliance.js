const poolPromise = require('../config/db');
const sql = require('mssql');

class PredictionAppliance {
  static async create(predictionApplianceData, transaction = null) {
    const pool = await poolPromise;
    const request = transaction ? new sql.Request(transaction) : pool.request();

    const result = await request
      .input('predictionId', sql.Int, predictionApplianceData.predictionId)
      .input('applianceName', sql.NVarChar(150), predictionApplianceData.applianceName)
      .input('quantity', sql.Decimal(10, 2), predictionApplianceData.quantity)
      .input('usageHours', sql.Decimal(10, 2), predictionApplianceData.usageHours)
      .input('watts', sql.Decimal(10, 2), predictionApplianceData.watts ?? null)
      .input('estimatedMonthlyKwh', sql.Decimal(12, 2), predictionApplianceData.estimatedMonthlyKwh ?? null)
      .query(`
        INSERT INTO PredictionAppliances (
          PredictionId,
          ApplianceName,
          Quantity,
          UsageHours,
          Watts,
          EstimatedMonthlyKwh
        )
        OUTPUT INSERTED.Id
        VALUES (
          @predictionId,
          @applianceName,
          @quantity,
          @usageHours,
          @watts,
          @estimatedMonthlyKwh
        )
      `);

    return result.recordset[0].Id;
  }

  static async bulkCreate(predictionId, appliances = [], transaction = null) {
    if (!Array.isArray(appliances) || appliances.length === 0) {
      return [];
    }

    const insertedIds = [];

    for (const appliance of appliances) {
      const id = await this.create({
        predictionId,
        applianceName: appliance.applianceName || appliance.name,
        quantity: appliance.quantity ?? appliance.count,
        usageHours: appliance.usageHours || appliance.hours,
        watts: appliance.watts ?? null,
        estimatedMonthlyKwh: appliance.estimatedMonthlyKwh ?? null
      }, transaction);

      insertedIds.push(id);
    }

    return insertedIds;
  }

  static async findByPredictionId(predictionId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('predictionId', sql.Int, predictionId)
      .query(`
        SELECT
          Id,
          PredictionId,
          ApplianceName,
          Quantity,
          UsageHours,
          Watts,
          EstimatedMonthlyKwh,
          CreatedAt
        FROM PredictionAppliances
        WHERE PredictionId = @predictionId
        ORDER BY ApplianceName ASC
      `);

    return result.recordset;
  }

  static async deleteByPredictionId(predictionId, transaction = null) {
    const pool = await poolPromise;
    const request = transaction ? new sql.Request(transaction) : pool.request();

    await request
      .input('predictionId', sql.Int, predictionId)
      .query(`
        DELETE FROM PredictionAppliances
        WHERE PredictionId = @predictionId
      `);
  }
}

module.exports = PredictionAppliance;