const jwt = require('jsonwebtoken');
const sql = require('mssql');
const poolPromise = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trim();  // Remove "Bearer " prefix
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', sql.Int, decoded.id)
      .query('SELECT Id, Name, Email, Role FROM Users WHERE Id = @id');
    
    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};
