const mongoose = require('mongoose');

const TimelineEventSchema = new mongoose.Schema({
  status: String,
  note: { type: String, default: '' },
  actor: { type: String, default: 'System' },
  timestamp: { type: Date, default: Date.now },
});

const AdminNoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, default: 'Admin' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
});

const ComplaintSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  rawInput: {
    type: String,
    required: true,
  },
  formalText: {
    type: String,
    required: true,
  },
  formalTextTranslations: {
    type: Object,
    default: {},
  },
  problemType: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  priorityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  isMassOutage: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    default: 'Unknown location',
  },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Escalated', 'Closed'],
    default: 'Pending',
  },
  mockPortalUrl: {
    type: String,
  },
  images: [{ type: String }],
  resolutionProof: [{ type: String }],
  assignedOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  timeline: [TimelineEventSchema],
  adminNotes: [AdminNoteSchema],
  feedback: {
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: '' },
    timestamp: { type: Date, default: null },
  },
  sentiment: {
    score: { type: Number, default: null },
    label: { type: String, default: null },
  },
  language: {
    type: String,
    default: 'auto',
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null,
  },
  isDuplicate: {
    type: Boolean,
    default: false,
  },
  slaDeadline: {
    type: Date,
    default: null,
  },
  escalatedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Auto-set SLA deadline and initial timeline on creation
ComplaintSchema.pre('save', async function () {
  if (this.isNew && !this.slaDeadline) {
    const hours = this.priority === 'Critical' ? 24
      : this.priority === 'High' ? 48
      : this.priority === 'Medium' ? 72
      : 120;
    this.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
  if (this.isNew && this.timeline.length === 0) {
    this.timeline.push({
      status: 'Pending',
      note: 'Complaint submitted and processed by AI agents',
      actor: 'System',
    });
  }
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
