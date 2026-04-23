require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
const Complaint = require('./models/Complaint');
const AuditLog = require('./models/AuditLog');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lekhsahayak');
    console.log('Connected to DB for seeding...');

    // Clear Complaints and Audit Logs
    await Complaint.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('Complaints and Audit Logs cleared.');

    // Super Admin
    await User.deleteOne({ email: 'superadmin@lekhsahayak.gov.in' });
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@lekhsahayak.gov.in',
      password: 'password123',
      role: 'super_admin',
      isVerified: true
    });
    console.log('Super Admin created.');

    // Departments
    await Department.deleteMany({});
    const deptData = [
      { name: "Public Works Department (PWD)", slug: "pwd" },
      { name: "Municipal Corporation", slug: "municipal-corp" },
      { name: "Water Supply Board", slug: "water-board" },
      { name: "Electricity Board", slug: "electricity-board" },
      { name: "Sanitation Department", slug: "sanitation" },
      { name: "Traffic Police", slug: "traffic-police" },
      { name: "Health Department", slug: "health" },
      { name: "Other", slug: "other" }
    ];
    for (const d of deptData) {
      await Department.create(d);
    }
    console.log('Departments seeded.');

    // Department Head
    const pwdDept = await Department.findOne({ slug: "pwd" });
    await User.deleteOne({ email: 'pwd_head@lekhsahayak.gov.in' });
    const pwdHead = await User.create({
      name: 'Sharma Ji',
      email: 'pwd_head@lekhsahayak.gov.in',
      password: 'password123',
      department: pwdDept._id,
      role: 'department_head',
      isVerified: true
    });
    pwdDept.head = pwdHead._id;
    await pwdDept.save();
    console.log('PWD Head created.');

    // Officer
    await User.deleteOne({ email: 'officer1@lekhsahayak.gov.in' });
    await User.create({
      name: 'Junior Officer Verma',
      email: 'officer1@lekhsahayak.gov.in',
      password: 'password123',
      department: pwdDept._id,
      role: 'officer',
      isVerified: true
    });
    console.log('Officer created.');

    console.log('\n--- SEEDING COMPLETE ---');
    console.log('Admin     : superadmin@lekhsahayak.gov.in / password123');
    console.log('Dept Head : pwd_head@lekhsahayak.gov.in / password123');
    console.log('Officer   : officer1@lekhsahayak.gov.in / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
