const poolPromise = require('../config/db');
const sql = require('mssql');

class ProfileAppliance {

  static async bulkCreate(profileId, appliances = []) {
    if (!Array.isArray(appliances) || appliances.length === 0) return [];

    const pool = await poolPromise;
    const insertedIds = [];

    for (const appliance of appliances) {
      const result = await pool.request()
        .input('profileId', sql.Int, profileId)
        .input('applianceName', sql.NVarChar(150), appliance.applianceName || appliance.name)
        .input('quantity', sql.Decimal(10, 2), appliance.quantity ?? appliance.count)
        .input('usageHours', sql.Decimal(10, 2), appliance.usageHours || appliance.hours)
        .input('watts', sql.Decimal(10, 2), appliance.watts ?? null)
        .query(`
          INSERT INTO UserProfileAppliances (ProfileId, ApplianceName, Quantity, UsageHours, Watts)
          OUTPUT INSERTED.Id
          VALUES (@profileId, @applianceName, @quantity, @usageHours, @watts)
        `);

      insertedIds.push(result.recordset[0].Id);
    }

    return insertedIds;
  }

  static async findByProfileId(profileId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('profileId', sql.Int, profileId)
      .query(`
        SELECT
          Id,
          ProfileId,
          ApplianceName,
          Quantity,
          UsageHours,
          Watts,
          CreatedAt
        FROM UserProfileAppliances
        WHERE ProfileId = @profileId
        ORDER BY ApplianceName ASC
      `);

    return result.recordset;
  }

  static async deleteByProfileId(profileId) {
    const pool = await poolPromise;
    await pool.request()
      .input('profileId', sql.Int, profileId)
      .query(`DELETE FROM UserProfileAppliances WHERE ProfileId = @profileId`);
  }

  static async replaceAll(profileId, appliances = []) {
    const pool = await poolPromise;

    await pool.request()
      .input('profileId', sql.Int, profileId)
      .query(`DELETE FROM UserProfileAppliances WHERE ProfileId = @profileId`);

    for (const appliance of appliances) {
      await pool.request()
        .input('profileId', sql.Int, profileId)
        .input('applianceName', sql.NVarChar(150), appliance.applianceName || appliance.name)
        .input('quantity', sql.Decimal(10, 2), appliance.quantity ?? appliance.count)
        .input('usageHours', sql.Decimal(10, 2), appliance.usageHours || appliance.hours)
        .input('watts', sql.Decimal(10, 2), appliance.watts ?? null)
        .query(`
          INSERT INTO UserProfileAppliances (ProfileId, ApplianceName, Quantity, UsageHours, Watts)
          VALUES (@profileId, @applianceName, @quantity, @usageHours, @watts)
        `);
    }

    return true;
  }
}

module.exports = ProfileAppliance;