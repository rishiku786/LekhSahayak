const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'complaint_created',
      'complaint_updated',
      'status_changed',
      'complaint_escalated',
      'complaint_resolved',
      'officer_assigned',
      'note_added',
      'feedback_submitted',
      'user_login',
      'user_registered',
      'export_generated',
    ],
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  actorName: {
    type: String,
    default: 'System',
  },
  targetType: {
    type: String,
    enum: ['complaint', 'user', 'department', 'system'],
    default: 'complaint',
  },
  targetId: {
    type: String,
    default: null,
  },
  details: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: null,
  },
}, { timestamps: true });

// Auto-expire logs after 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
