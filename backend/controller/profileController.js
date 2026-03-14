const Profile = require('../models/Profile');

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findByUserId(req.user.Id);
    
    res.json({
      user: {
        id: req.user.Id,
        name: req.user.Name,
        email: req.user.Email,
        role: req.user.Role
      },
      profile: profile || null,
      hasProfile: !!profile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProfile = async (req, res) => {
  try {
    const profileData = {
      userId: req.user.Id,
      householdSize: req.body.householdSize || 4,
      defaultAppliances: req.body.defaultAppliances || 5,
      defaultUsageHours: req.body.defaultUsageHours || 8,
      defaultTemperature: req.body.defaultTemperature || 25.0,
      defaultHumidity: req.body.defaultHumidity || 50,
      defaultPerUnitRate: req.body.defaultPerUnitRate || 7.50
    };
    
    const existingProfile = await Profile.findByUserId(req.user.Id);
    if (existingProfile) {
      return res.status(400).json({ error: 'Profile already exists. Use PUT /api/profile/update' });
    }

    await Profile.create(profileData);
    res.status(201).json({ message: 'Profile created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const profileData = {
      householdSize: req.body.householdSize || 4,
      defaultAppliances: req.body.defaultAppliances || 5,
      defaultUsageHours: req.body.defaultUsageHours || 8,
      defaultTemperature: req.body.defaultTemperature || 25.0,
      defaultHumidity: req.body.defaultHumidity || 50,
      defaultPerUnitRate: req.body.defaultPerUnitRate || 7.50
    };
    
    await Profile.update(req.user.Id, profileData);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
