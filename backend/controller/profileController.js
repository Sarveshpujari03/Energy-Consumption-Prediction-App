const Profile = require('../models/Profile');
const ProfileAppliance = require('../models/ProfileAppliance');

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findByUserId(req.user.Id);
    const appliances = profile ? await ProfileAppliance.findByProfileId(profile.Id) : [];

    res.json({
      user: {
        id: req.user.Id,
        name: req.user.Name,
        email: req.user.Email,
        role: req.user.Role
      },
      profile: profile || null,
      appliances,
      hasProfile: !!profile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProfile = async (req, res) => {
  try {
    const existingProfile = await Profile.findByUserId(req.user.Id);
    if (existingProfile) {
      return res.status(400).json({ error: 'Profile already exists. Use PUT /api/profile/update' });
    }

    const profileData = {
      userId: req.user.Id,
      householdSize: req.body.householdSize || 4,
      defaultTemperature: req.body.defaultTemperature || 25.0,
      defaultHumidity: req.body.defaultHumidity || 50.0,
      defaultPerUnitRate: req.body.defaultPerUnitRate || 7.50
    };

    const profileId = await Profile.create(profileData);

    if (req.body.appliances && Array.isArray(req.body.appliances) && req.body.appliances.length > 0) {
      await ProfileAppliance.bulkCreate(profileId, req.body.appliances);
    }

    res.status(201).json({ message: 'Profile created successfully', profileId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const profileData = {
      userId: req.user.Id,
      householdSize: req.body.householdSize,
      defaultTemperature: req.body.defaultTemperature,
      defaultHumidity: req.body.defaultHumidity,
      defaultPerUnitRate: req.body.defaultPerUnitRate
    };

    await Profile.upsert(profileData);

    if (req.body.appliances && Array.isArray(req.body.appliances)) {
      const profile = await Profile.findByUserId(req.user.Id);
      await ProfileAppliance.replaceAll(profile.Id, req.body.appliances);
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addAppliances = async (req, res) => {
  try {
    const profile = await Profile.findByUserId(req.user.Id);
    if (!profile) {
      return res.status(400).json({ error: 'Profile not found. Create profile first.' });
    }

    const appliances = req.body.appliances;
    if (!Array.isArray(appliances)) {
      return res.status(400).json({ error: 'appliances must be an array' });
    }

    await ProfileAppliance.bulkCreate(profile.Id, appliances);
    res.json({ message: 'Appliances added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAppliances = async (req, res) => {
  try {
    const profile = await Profile.findByUserId(req.user.Id);
    if (!profile) return res.json([]);

    const appliances = await ProfileAppliance.findByProfileId(profile.Id);
    res.json(appliances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};