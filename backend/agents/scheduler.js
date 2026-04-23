const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const { sendSlaBreachAlert } = require('../services/notifications');

const setupScheduler = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Scheduler] Running SLA checker job...');

    try {
      const now = new Date();

      // ──────── 1. Standard SLA Breach (Deadline Passed) ────────
      const breachedComplaints = await Complaint.find({
        status: { $in: ['Pending', 'In Progress'] },
        slaDeadline: { $lt: now },
        escalatedAt: null,
      });

      if (breachedComplaints.length > 0) {
        console.log(`[Scheduler] Found ${breachedComplaints.length} breached complaints. Auto-escalating...`);
        for (const complaint of breachedComplaints) {
          complaint.status = 'Escalated';
          complaint.escalatedAt = now;
          complaint.priority = 'Critical';
          complaint.timeline.push({
            status: 'Escalated',
            note: 'Auto-escalated by system due to SLA breach',
            actor: 'System (Scheduler)',
            timestamp: now
          });
          await complaint.save();
          await AuditLog.create({
            action: 'complaint_escalated', actor: null, actorName: 'System Scheduler',
            targetType: 'complaint', targetId: complaint.trackingId, details: 'Auto-escalated due to SLA breach past deadline',
          });
          await sendSlaBreachAlert(complaint);
        }
      }

      // ──────── 2. 7-Day Inactivity Escalation (To DC Office) ────────
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const inactiveComplaints = await Complaint.find({
        status: { $in: ['Pending', 'In Progress'] },
        updatedAt: { $lt: sevenDaysAgo }
      });

      if (inactiveComplaints.length > 0) {
        console.log(`[Scheduler] Found ${inactiveComplaints.length} inactive complaints (7+ days). Auto-escalating to DC Office...`);
        for (const complaint of inactiveComplaints) {
          complaint.status = 'Escalated';
          complaint.escalatedAt = now;
          complaint.priority = 'Critical';
          complaint.timeline.push({
            status: 'Escalated',
            note: 'System Note: Lower authorities did not update or resolve this for 7 days. Auto-escalated to Higher Authorities (DC Office).',
            actor: 'System (Scheduler)',
            timestamp: now
          });
          // Update updatedAt technically happens on save, but this forces a change.
          await complaint.save();

          await AuditLog.create({
            action: 'complaint_escalated', actor: null, actorName: 'System Scheduler',
            targetType: 'complaint', targetId: complaint.trackingId, details: 'Auto-escalated to DC Office due to 7 days of inactivity',
          });
          // Also trigger alert
          await sendSlaBreachAlert(complaint);
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error running SLA checker:', error);
    }
  });

  console.log('[Scheduler] Job registered to run every hour.');
};

module.exports = { setupScheduler };
