const poolPromise = require('../config/db');
const sql = require('mssql');

class Profile {
  static async create(profileData) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, profileData.userId)
      .input('householdSize', sql.Int, profileData.householdSize)
      .input('defaultAppliances', sql.Int, profileData.defaultAppliances)
      .input('defaultUsageHours', sql.Int, profileData.defaultUsageHours)
      .input('defaultTemperature', sql.Decimal(4,1), profileData.defaultTemperature)
      .input('defaultHumidity', sql.Int, profileData.defaultHumidity)
      .input('defaultPerUnitRate', sql.Decimal(6,2), profileData.defaultPerUnitRate)
      .query(`
        INSERT INTO UserProfiles (UserId, HouseholdSize, DefaultAppliances, DefaultUsageHours, 
                                  DefaultTemperature, DefaultHumidity, DefaultPerUnitRate)
        OUTPUT INSERTED.Id
        VALUES (@userId, @householdSize, @defaultAppliances, @defaultUsageHours, 
                @defaultTemperature, @defaultHumidity, @defaultPerUnitRate)
      `);
    return result.recordset[0].Id;
  }

  static async findByUserId(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM UserProfiles WHERE UserId = @userId');
    return result.recordset[0];
  }

  static async update(userId, profileData) {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('householdSize', sql.Int, profileData.householdSize)
      .input('defaultAppliances', sql.Int, profileData.defaultAppliances)
      .input('defaultUsageHours', sql.Int, profileData.defaultUsageHours)
      .input('defaultTemperature', sql.Decimal(4,1), profileData.defaultTemperature)
      .input('defaultHumidity', sql.Int, profileData.defaultHumidity)
      .input('defaultPerUnitRate', sql.Decimal(6,2), profileData.defaultPerUnitRate)
      .query(`
        UPDATE UserProfiles SET 
          HouseholdSize = @householdSize,
          DefaultAppliances = @defaultAppliances,
          DefaultUsageHours = @defaultUsageHours,
          DefaultTemperature = @defaultTemperature,
          DefaultHumidity = @defaultHumidity,
          DefaultPerUnitRate = @defaultPerUnitRate
        WHERE UserId = @userId
      `);
  }
}

module.exports = Profile;
