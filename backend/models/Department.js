const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    default: '',
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  officers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  complaintCount: {
    type: Number,
    default: 0,
  },
  resolvedCount: {
    type: Number,
    default: 0,
  },
  avgResolutionHours: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
