const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const complaint = await Complaint.findOne({ trackingId: 'SS-GFEWZ3' });
    if(complaint) {
        console.log(JSON.stringify(complaint, null, 2));
    } else {
        console.log("Not found");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
