const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('head', 'name email')
      .populate('officers', 'name email');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get department by slug
router.get('/:slug', async (req, res) => {
  try {
    const dept = await Department.findOne({ slug: req.params.slug })
      .populate('head', 'name email')
      .populate('officers', 'name email');
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(dept);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Get complaints for a specific department
router.get('/:slug/complaints', authenticate, authorize('officer', 'department_head', 'super_admin'), async (req, res) => {
  try {
    const dept = await Department.findOne({ slug: req.params.slug });
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const { status, priority, page = 1, limit = 20 } = req.query;
    const query = { department: dept.name };
    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query.priority = priority;

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('assignedOfficer', 'name email');

    const total = await Complaint.countDocuments(query);

    res.json({
      complaints,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department complaints' });
  }
});

// Get department stats
router.get('/:slug/stats', async (req, res) => {
  try {
    const dept = await Department.findOne({ slug: req.params.slug });
    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const total = await Complaint.countDocuments({ department: dept.name });
    const pending = await Complaint.countDocuments({ department: dept.name, status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ department: dept.name, status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ department: dept.name, status: 'Resolved' });
    const escalated = await Complaint.countDocuments({ department: dept.name, status: 'Escalated' });

    // Avg resolution time (for resolved complaints)
    const resolvedComplaints = await Complaint.find({
      department: dept.name,
      status: 'Resolved',
    }).select('createdAt updatedAt');

    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.updatedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round(totalHours / resolvedComplaints.length);
    }

    // SLA breaches
    const slaBreaches = await Complaint.countDocuments({
      department: dept.name,
      status: { $in: ['Pending', 'In Progress'] },
      slaDeadline: { $lt: new Date() },
    });

    res.json({
      departmentName: dept.name,
      total,
      pending,
      inProgress,
      resolved,
      escalated,
      avgResolutionHours,
      slaBreaches,
      officerCount: dept.officers.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department stats' });
  }
});

// Assign officer to complaint
router.put('/:slug/assign', authenticate, authorize('department_head', 'super_admin'), async (req, res) => {
  try {
    const { complaintId, officerId } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    complaint.assignedOfficer = officerId;
    complaint.timeline.push({
      status: complaint.status,
      note: `Assigned to officer`,
      actor: req.user.name,
    });
    await complaint.save();

    await complaint.populate('assignedOfficer', 'name email');

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign officer' });
  }
});

module.exports = router;
