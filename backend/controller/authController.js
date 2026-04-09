const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const userId = await User.create({ 
      name, 
      email, 
      password,  

      role: role || 'user' 
    });

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { 
      expiresIn: '7d' 
    });

    const user = await User.findById(userId);

    res.status(201).json({
      success: true,
      token,
      user: { 
        id: user.Id, 
        name: user.Name, 
        email: user.Email, 
        role: user.Role 
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.Id }, process.env.JWT_SECRET, { 
      expiresIn: '7d' 
    });

    res.json({
      success: true,
      token,
      user: { 
        id: user.Id, 
        name: user.Name, 
        email: user.Email, 
        role: user.Role 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const pool = await require('../config/db');
    const result = await pool.request().query(`
      SELECT Id, Name, Email, Role, CreatedAt 
      FROM Users 
      ORDER BY CreatedAt DESC
    `);

    res.json({
      success: true,
      users: result.recordset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

