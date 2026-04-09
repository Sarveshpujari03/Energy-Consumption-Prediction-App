const poolPromise = require('../config/db');
const sql = require('mssql');

class Profile {
  static async create(profileData) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, profileData.userId)
      .input('householdSize', sql.Int, profileData.householdSize)
      .input('defaultTemperature', sql.Decimal(5, 2), profileData.defaultTemperature)
      .input('defaultHumidity', sql.Decimal(5, 2), profileData.defaultHumidity)
      .input('defaultPerUnitRate', sql.Decimal(10, 2), profileData.defaultPerUnitRate)
      .query(`
        INSERT INTO UserProfiles (
          UserId,
          HouseholdSize,
          DefaultTemperature,
          DefaultHumidity,
          DefaultPerUnitRate
        )
        OUTPUT INSERTED.Id
        VALUES (
          @userId,
          @householdSize,
          @defaultTemperature,
          @defaultHumidity,
          @defaultPerUnitRate
        )
      `);

    return result.recordset[0].Id;
  }

  static async findByUserId(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          Id,
          UserId,
          HouseholdSize,
          DefaultTemperature,
          DefaultHumidity,
          DefaultPerUnitRate,
          CreatedAt,
          UpdatedAt
        FROM UserProfiles
        WHERE UserId = @userId
      `);

    return result.recordset[0];
  }

  static async upsert(profileData) {
    const existing = await this.findByUserId(profileData.userId);

    if (!existing) {
      return this.create(profileData);
    }

    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, profileData.userId)
      .input('householdSize', sql.Int, profileData.householdSize)
      .input('defaultTemperature', sql.Decimal(5, 2), profileData.defaultTemperature)
      .input('defaultHumidity', sql.Decimal(5, 2), profileData.defaultHumidity)
      .input('defaultPerUnitRate', sql.Decimal(10, 2), profileData.defaultPerUnitRate)
      .query(`
        UPDATE UserProfiles
        SET
          HouseholdSize = @householdSize,
          DefaultTemperature = @defaultTemperature,
          DefaultHumidity = @defaultHumidity,
          DefaultPerUnitRate = @defaultPerUnitRate,
          UpdatedAt = GETDATE()
        WHERE UserId = @userId
      `);

    return existing.Id;
  }

  static async update(userId, profileData) {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('householdSize', sql.Int, profileData.householdSize)
      .input('defaultTemperature', sql.Decimal(5, 2), profileData.defaultTemperature)
      .input('defaultHumidity', sql.Decimal(5, 2), profileData.defaultHumidity)
      .input('defaultPerUnitRate', sql.Decimal(10, 2), profileData.defaultPerUnitRate)
      .query(`
        UPDATE UserProfiles
        SET
          HouseholdSize = @householdSize,
          DefaultTemperature = @defaultTemperature,
          DefaultHumidity = @defaultHumidity,
          DefaultPerUnitRate = @defaultPerUnitRate,
          UpdatedAt = GETDATE()
        WHERE UserId = @userId
      `);
  }

  static async deleteByUserId(userId) {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        DELETE FROM UserProfiles
        WHERE UserId = @userId
      `);
  }
}

module.exports = Profile;