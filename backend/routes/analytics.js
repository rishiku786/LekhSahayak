const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');

// Overview stats
router.get('/overview', async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const escalated = await Complaint.countDocuments({ status: 'Escalated' });
    const critical = await Complaint.countDocuments({ priority: 'Critical' });

    // Avg resolution time
    const resolvedComplaints = await Complaint.find({ status: 'Resolved' }).select('createdAt updatedAt');
    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.updatedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round(totalHours / resolvedComplaints.length);
    }

    // SLA breaches
    const slaBreaches = await Complaint.countDocuments({
      status: { $in: ['Pending', 'In Progress'] },
      slaDeadline: { $lt: new Date() },
    });

    // Resolution rate
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    res.json({
      total,
      pending,
      inProgress,
      resolved,
      escalated,
      critical,
      avgResolutionHours,
      slaBreaches,
      resolutionRate,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// Complaints by department
router.get('/by-department', async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department analytics' });
  }
});

// Complaints by priority
router.get('/by-priority', async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch priority analytics' });
  }
});

// Trends — daily complaint volume for last 30 days
router.get('/trends', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await Complaint.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Heatmap data — complaints with coordinates
router.get('/heatmap', async (req, res) => {
  try {
    const complaints = await Complaint.find({
      'coordinates.lat': { $ne: null },
      'coordinates.lng': { $ne: null },
    }).select('trackingId problemType priority status coordinates location createdAt');

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// SLA breaches
router.get('/sla-breaches', async (req, res) => {
  try {
    const breached = await Complaint.find({
      status: { $in: ['Pending', 'In Progress'] },
      slaDeadline: { $lt: new Date() },
    })
      .sort({ slaDeadline: 1 })
      .select('trackingId problemType department priority status slaDeadline createdAt');

    res.json(breached);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SLA breaches' });
  }
});

// Status distribution
router.get('/by-status', async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status analytics' });
  }
});

module.exports = router;
