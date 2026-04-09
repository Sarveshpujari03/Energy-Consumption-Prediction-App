const poolPromise = require('../config/db');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const pool = await poolPromise;
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const result = await pool.request()
      .input('name', sql.NVarChar(150), userData.name)
      .input('email', sql.NVarChar(255), userData.email)
      .input('passwordHash', sql.NVarChar(255), hashedPassword)
      .input('role', sql.NVarChar(50), userData.role || 'user')
      .query(`
        INSERT INTO Users (Name, Email, PasswordHash, Role)
        OUTPUT INSERTED.Id
        VALUES (@name, @email, @passwordHash, @role)
      `);

    return result.recordset[0].Id;
  }

  static async findByEmail(email) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`
        SELECT Id, Name, Email, PasswordHash, Role, CreatedAt
        FROM Users
        WHERE Email = @email
      `);

    return result.recordset[0];
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT Id, Name, Email, Role, CreatedAt
        FROM Users
        WHERE Id = @id
      `);

    return result.recordset[0];
  }

  static async existsByEmail(email) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`
        SELECT TOP 1 Id
        FROM Users
        WHERE Email = @email
      `);

    return !!result.recordset[0];
  }

  static async comparePassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}

module.exports = User;