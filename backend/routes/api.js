const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const { processComplaint, detectLocationFromPhoto } = require('../agents/orchestrator');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { complaintLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

// Helper to construct image URLs
const getFileUrl = (req, filename, type) => {
  return `${req.protocol}://${req.get('host')}/uploads/${type}/${filename}`;
};

// Post a new complaint
router.post('/complaint', optionalAuth, complaintLimiter, upload.array('images', 5), async (req, res) => {
  try {
    const { message, lat, lng, locationText } = req.body;
    const imagePaths = req.files ? req.files.map(f => f.path) : [];

    // Message ya images mein se kuch toh hona chahiye
    if (!message && imagePaths.length === 0) {
      return res.status(400).json({ error: 'Kripya apni samasya likhein ya photo upload karein' });
    }

    // Process image uploads
    const imageUrls = req.files ? req.files.map(file => getFileUrl(req, file.filename, 'complaints')) : [];

    // Agent Pipeline Execution
    let processedData;
    const citizenMeta = req.user ? { name: req.user.name, email: req.user.email, phone: req.user.phone } : null;
    try {
      processedData = await processComplaint(message || '', lat || null, lng || null, imagePaths, locationText || null, citizenMeta);
    } catch (validationErr) {
      if (validationErr.isValidationError) {
        return res.status(400).json({
          error: validationErr.message || 'Invalid complaint',
          category: validationErr.category || 'invalid',
          rejected: true
        });
      }
      throw validationErr;
    }
    
    // Check if it's considered a duplicate
    const isDuplicate = processedData.isDuplicate;

    const metadata = {
      citizen: req.user ? req.user._id : null,
      images: imageUrls,
      coordinates: {
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
      },
      ...processedData
    };

    const newComplaint = new Complaint(metadata);
    await newComplaint.save();

    // ──────── Mass Outage Auto-Clustering Logic ────────
    try {
      if (processedData.location && !processedData.location.toLowerCase().includes('unknown')) {
        const fortYEighthOursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const similarComplaints = await Complaint.find({
          problemType: processedData.problemType,
          department: processedData.department,
          location: processedData.location, // Strict location check
          createdAt: { $gte: fortYEighthOursAgo }
        });

        // Simple clustering heuristic: If there are 3+ reports for the same issue in the same location in 48 hrs
        if (similarComplaints.length >= 3) {
          console.log(`[Clustering] Detected Mass Outage! Found ${similarComplaints.length} complaints for ${processedData.problemType} at ${processedData.location}`);
          
          for (const comp of similarComplaints) {
            if (!comp.isMassOutage) {
              comp.isMassOutage = true;
              comp.priority = 'Critical';
              comp.priorityScore = 100;
              comp.timeline.push({
                status: comp.status,
                note: 'System Auto-Escalated: Mass Outage Detected in area due to multiple reports.',
                actor: 'System (Cluster AI)'
              });
              await comp.save();
            }
          }
        }
      }
    } catch (clusterErr) {
      console.error('[Clustering Error]:', clusterErr);
    }
    // ──────── End Clustering Logic ────────

    await AuditLog.create({
      action: 'complaint_created',
      targetType: 'complaint',
      targetId: newComplaint.trackingId,
      actor: req.user ? req.user._id : null,
      actorName: req.user ? req.user.name : 'Unknown Citizen',
      details: `New complaint filed: ${processedData.problemType}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      trackingId: newComplaint.trackingId,
      isDuplicate
    });

  } catch (error) {
    console.error('Error processing complaint:', error);
    res.status(500).json({ error: 'Internal server error processing complaint' });
  }
});

// Admin endpoint to get filtered complaints based on role
router.get('/admin/complaints', authenticate, authorize('officer', 'department_head', 'super_admin'), async (req, res) => {
  try {
    let query = {};
    const { role, department, _id } = req.user;

    if (role === 'department_head') {
      // Dept Head sees all complaints belonging to their department
      if (department) query.department = department;
    } else if (role === 'officer') {
      // Officer sees complaints assigned to them, OR unassigned ones in their department
      if (department) {
        query.$or = [
          { assignedOfficer: _id },
          { department: department, assignedOfficer: null }
        ];
      } else {
        query.assignedOfficer = _id;
      }
    }
    // Super admin sees everything (query left as empty object)

    const complaints = await Complaint.find(query)
      .populate('citizen', 'name email phone')
      .populate('assignedOfficer', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Citizen/Public endpoint to check their specific complaint
router.get('/complaint/:trackingId', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ trackingId: req.params.trackingId })
      .populate('assignedOfficer', 'name')
      .populate('citizen', 'name'); // Could omit citizen details based on privacy needs

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to find tracking ID' });
  }
});

// Admin check for duplicate complaints based on problemType & department
router.get('/complaint/check-duplicate', authenticate, authorize('officer', 'department_head', 'super_admin'), async (req, res) => {
  try {
    const { problemType, department, excludeId } = req.query;
    if (!problemType || !department) {
      return res.status(400).json({ error: 'problemType and department required' });
    }

    const query = {
      problemType,
      department,
      status: { $in: ['Pending', 'In Progress'] }
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const duplicates = await Complaint.find(query).limit(5);
    res.status(200).json(duplicates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
});

// Admin endpoint to push updates and emit via socket
router.put('/admin/complaint/:id', authenticate, authorize('officer', 'department_head', 'super_admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    const complaintDetails = await Complaint.findById(req.params.id);
    if (!complaintDetails) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Only update status if provided
    if (status && status !== complaintDetails.status) {
      const previousStatus = complaintDetails.status;
      complaintDetails.status = status;
      complaintDetails.timeline.push({
        status,
        note: `Status updated to ${status}`,
        actor: req.user.name,
      });
      await complaintDetails.save();

      await AuditLog.create({
        action: 'status_changed',
        actor: req.user._id,
        actorName: req.user.name,
        targetType: 'complaint',
        targetId: complaintDetails.trackingId,
        details: `Status changed from ${previousStatus} to ${status}`,
        ipAddress: req.ip,
      });

      // Emit live update to the specific tracking room
      const io = req.app.get('io');
      if (io) {
        io.to(complaintDetails.trackingId).emit('status_updated', {
          trackingId: complaintDetails.trackingId,
          newStatus: status,
          timestamp: new Date()
        });
      }
    }

    res.status(200).json(complaintDetails);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Admin Manual Priority Override
router.put('/admin/complaint/:id/priority-override', authenticate, authorize('officer', 'department_head', 'super_admin'), async (req, res) => {
  try {
    const { priorityScore, priority } = req.body;
    const complaintDetails = await Complaint.findById(req.params.id);
    if (!complaintDetails) return res.status(404).json({ error: 'Complaint not found' });

    const prevScore = complaintDetails.priorityScore;
    const prevPriority = complaintDetails.priority;

    complaintDetails.priorityScore = priorityScore !== undefined ? priorityScore : complaintDetails.priorityScore;
    complaintDetails.priority = priority || complaintDetails.priority;
    
    complaintDetails.timeline.push({
      status: complaintDetails.status,
      note: `Admin Overrode Priority: Score changed from ${prevScore} to ${complaintDetails.priorityScore}, Priority from ${prevPriority} to ${complaintDetails.priority}.`,
      actor: req.user.name,
    });
    
    await complaintDetails.save();

    await AuditLog.create({
      action: 'priority_override',
      actor: req.user._id,
      actorName: req.user.name,
      targetType: 'complaint',
      targetId: complaintDetails.trackingId,
      details: `Manual Priority Override to ${complaintDetails.priorityScore} (${complaintDetails.priority})`,
      ipAddress: req.ip,
    });

    res.status(200).json(complaintDetails);
  } catch (error) {
    console.error('Priority Override error:', error);
    res.status(500).json({ error: 'Failed to override priority' });
  }
});

// Post admin note
router.post('/admin/complaint/:id/notes', authenticate, authorize('officer', 'department_head', 'super_admin'), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Note text required' });

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          adminNotes: {
            text,
            author: req.user.name,
            authorId: req.user._id,
          }
        }
      },
      { new: true }
    );

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    await AuditLog.create({
      action: 'note_added',
      actor: req.user._id,
      actorName: req.user.name,
      targetType: 'complaint',
      targetId: complaint.trackingId,
      details: 'Added internal note',
      ipAddress: req.ip,
    });

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add admin note' });
  }
});

// Resolve a complaint with proof attachments
router.put('/admin/complaint/:id/resolve', authenticate, authorize('officer', 'department_head', 'super_admin'), (req, res, next) => {
  req.uploadType = 'proof';
  next();
}, upload.array('proofs', 3), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const proofUrls = req.files ? req.files.map(file => getFileUrl(req, file.filename, 'proofs')) : [];

    complaint.status = 'Resolved';
    complaint.resolutionProof = proofUrls;
    complaint.timeline.push({
      status: 'Resolved',
      note: 'Complaint has been resolved by the department.',
      actor: req.user.name,
    });

    await complaint.save();

    await AuditLog.create({
      action: 'complaint_resolved',
      actor: req.user._id,
      actorName: req.user.name,
      targetType: 'complaint',
      targetId: complaint.trackingId,
      details: 'Complaint resolved',
      ipAddress: req.ip,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(complaint.trackingId).emit('status_updated', {
        trackingId: complaint.trackingId,
        newStatus: 'Resolved',
        timestamp: new Date()
      });
    }

    res.status(200).json(complaint);
  } catch (error) {
    console.error('Resolve error:', error);
    res.status(500).json({ error: 'Failed to resolve complaint' });
  }
});

// Submit feedback for a resolved complaint
router.put('/complaint/:trackingId/feedback', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) required' });
    }

    const complaint = await Complaint.findOne({ trackingId: req.params.trackingId });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (complaint.status !== 'Resolved') {
      return res.status(400).json({ error: 'Can only submit feedback for resolved complaints' });
    }

    complaint.feedback = {
      rating,
      comment: comment || '',
      timestamp: new Date()
    };
    await complaint.save();

    await AuditLog.create({
      action: 'feedback_submitted',
      actor: null,
      targetType: 'complaint',
      targetId: complaint.trackingId,
      details: `Feedback submitted: Rating ${rating}`,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Photo se location detect karo
router.post('/detect-location', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image required' });
    }

    const result = await detectLocationFromPhoto(req.file.path);

    if (!result) {
      return res.status(200).json({
        found: false,
        message: 'Location not detected in this photo'
      });
    }

    res.status(200).json({
      found: true,
      source: result.source,
      lat: result.lat,
      lng: result.lng,
      address: result.address,
      confidence: result.confidence || 'high',
      clues: result.clues || null
    });

  } catch (err) {
    console.error('Location detection error:', err);
    res.status(500).json({ error: 'Failed to detect location' });
  }
});

module.exports = router;
