const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Department = require('../models/Department');
const { authenticate, authorize, generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Only allow citizen role for self-registration via public endpoint
    const userRole = 'citizen';

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: userRole,
    });

    const token = generateToken(user._id);

    await AuditLog.create({
      action: 'user_registered',
      actor: user._id,
      actorName: user.name,
      targetType: 'user',
      targetId: user._id.toString(),
      details: `New ${userRole} registered: ${email}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    await AuditLog.create({
      action: 'user_login',
      actor: user._id,
      actorName: user.name,
      targetType: 'user',
      targetId: user._id.toString(),
      details: `User logged in: ${email}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Send OTP (mock — logs to console)
router.post('/send-otp', authenticate, async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await User.findByIdAndUpdate(req.user._id, { otp, otpExpiry });

    // Mock SMS — in production, use Twilio here
    console.log(`\n📱 [MOCK SMS] OTP for ${req.user.phone || req.user.email}: ${otp}\n`);

    res.json({ success: true, message: 'OTP sent successfully (check server console in dev mode)' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', authenticate, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id).select('+otp +otpExpiry');

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      isVerified: user.isVerified,
      avatar: user.avatar,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Super Admin — Create Official (officer / department_head)
router.post('/create-official', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { name, email, password, phone, role, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['officer', 'department_head'].includes(role)) {
      return res.status(400).json({ error: 'Role must be officer or department_head' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const official = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role,
      department: department || null,
      isVerified: true,
    });

    if (department) {
      const dept = await Department.findById(department);
      if (dept) {
        if (role === 'department_head') {
          dept.head = official._id;
        } else if (role === 'officer') {
          if (!dept.officers.includes(official._id)) {
            dept.officers.push(official._id);
          }
        }
        await dept.save();
      }
    }

    await AuditLog.create({
      action: 'user_registered',
      actor: req.user._id,
      actorName: req.user.name,
      targetType: 'user',
      targetId: official._id.toString(),
      details: `Super Admin created ${role}: ${email}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      user: {
        id: official._id,
        name: official.name,
        email: official.email,
        role: official.role,
        department: official.department,
        isVerified: official.isVerified,
      },
    });
  } catch (error) {
    console.error('Create official error:', error);
    res.status(500).json({ error: 'Failed to create official account' });
  }
});

// Super Admin — List all officials
router.get('/officials', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const officials = await User.find({
      role: { $in: ['officer', 'department_head', 'super_admin'] }
    }).select('name email role department phone isVerified createdAt').sort({ createdAt: -1 });

    res.json(officials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch officials' });
  }
});

module.exports = router;

