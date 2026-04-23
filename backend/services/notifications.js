// Notification Service (Simulated/Mock implementation)
// In a real production app, you would integrate Twilio for SMS and SendGrid/Nodemailer for Email

const sendSMS = async (phone, message) => {
  if (!phone) return false;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('\n=======================================');
  console.log(`📱 MOCK SMS sent to: ${phone}`);
  console.log(`Content: ${message}`);
  console.log('=======================================\n');
  return true;
};

const sendEmail = async (to, subject, body) => {
  if (!to) return false;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('\n=======================================');
  console.log(`✉️  MOCK EMAIL sent to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log('=======================================\n');
  return true;
};

// Application specific notification wrappers

const sendStatusUpdate = async (complaint, user) => {
  if (!user || (!user.phone && !user.email)) return false;
  
  const msg = `LekhSahayak Update: Your complaint ${complaint.trackingId} status changed to ${complaint.status}. Check details online.`;
  
  if (user.phone) {
    await sendSMS(user.phone, msg);
  }
  
  if (user.email) {
    await sendEmail(
      user.email,
      `LekhSahayak Update: Complaint ${complaint.trackingId}`,
      `Dear user,\n\nThe status of your complaint (${complaint.trackingId} - ${complaint.problemType}) has been updated to: ${complaint.status}.\n\nThank you for using LekhSahayak.`
    );
  }
};

const sendCriticalAlert = async (complaint) => {
  // Mock sending alert to an admin/head
  console.log('\n=======================================');
  console.log(`🚨 CRITICAL ALERT - HIGH PRIORITY COMPLAINT 🚨`);
  console.log(`Tracking ID: ${complaint.trackingId}`);
  console.log(`Type: ${complaint.problemType}`);
  console.log(`Location: ${complaint.location}`);
  console.log('=======================================\n');
  return true;
};

const sendSlaBreachAlert = async (complaint) => {
  console.log('\n=======================================');
  console.log(`⚠️  SLA BREACH ALERT: ESCALATED TO HIGHER OFFICE ⚠️`);
  console.log(`Tracking ID: ${complaint.trackingId} is past its SLA deadline.`);
  console.log(`Status: ${complaint.status}`);
  console.log(`\n-- Original English Master Formal Draft Attached --`);
  console.log(complaint.formalText);
  console.log('=======================================\n');
  return true;
};

module.exports = {
  sendSMS,
  sendEmail,
  sendStatusUpdate,
  sendCriticalAlert,
  sendSlaBreachAlert
};
