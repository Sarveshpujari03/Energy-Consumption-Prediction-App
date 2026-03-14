const poolPromise = require('../config/db');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const pool = await poolPromise;
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const result = await pool.request()
      .input('name', sql.NVarChar, userData.name)
      .input('email', sql.NVarChar, userData.email)
      .input('passwordHash', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, userData.role || 'user')
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
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    return result.recordset[0];
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT Id, Name, Email, Role, CreatedAt FROM Users WHERE Id = @id');
    return result.recordset[0];
  }
}

module.exports = User;
