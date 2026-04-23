const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');

mongoose.connect('mongodb://127.0.0.1:27017/civic_complaint_portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const c = await Complaint.findOne().sort({ createdAt: -1 });
  console.log(JSON.stringify(c.formalTextTranslations, null, 2));
  console.log("Status translation:", c.formalTextTranslations?.hi ? "Exists" : "Missing");
  process.exit(0);
});
