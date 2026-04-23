require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lekhsahayak')
  .then(async () => {
    // Delete all complaints
    await Complaint.deleteMany({});
    console.log('✅ All complaints deleted.');
    
    // Delete all audit logs
    await AuditLog.deleteMany({});
    console.log('✅ All audit logs deleted.');

    // Delete all citizens
    await User.deleteMany({ role: 'citizen' });
    console.log('✅ All citizen users deleted. (Admins & Department Heads are saved).');
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
