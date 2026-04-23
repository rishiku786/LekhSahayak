const mongoose = require('mongoose');
const Complaint = require('./backend/models/Complaint');
require('dotenv').config({ path: './backend/.env' });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const complaints = await Complaint.find().sort({createdAt: -1}).limit(5);
    console.log(JSON.stringify(complaints.map(c => ({
      trackingId: c.trackingId,
      priority: c.priority,
      priorityScore: c.priorityScore,
      isMassOutage: c.isMassOutage,
      text: c.rawInput
    })), null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
