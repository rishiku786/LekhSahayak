const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend/src/locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && !f.endsWith('.bak'));

const dynamicKeys = {
  "dynamic": {
    "status": {
      "Pending": "लंबित",
      "In Progress": "प्रगति में",
      "Resolved": "सुल्झा हुआ",
      "Escalated": "उच्च अधिकारी के पास",
      "Closed": "बंद"
    },
    "priority": {
      "Low": "कम",
      "Medium": "मध्यम",
      "High": "उच्च",
      "Critical": "अत्यंत गंभीर"
    },
    "timeline": {
      "Complaint submitted and processed by AI agents": "शिकायत जमा की गई और AI एजेंटों द्वारा प्रोसेस की गई",
      "Complaint has been resolved by the department.": "विभाग द्वारा शिकायत का समाधान कर दिया गया है।",
      "System": "सिस्टम"
    },
    "department": {
      "Public Works Department (PWD)": "लोक निर्माण विभाग (PWD)",
      "Municipal Corporation": "नगर निगम",
      "Water Supply Board": "जल आपूर्ति बोर्ड",
      "Electricity Board": "विद्युत बोर्ड",
      "Sanitation Department": "स्वच्छता विभाग",
      "Traffic Police": "यातायात पुलिस",
      "Health Department": "स्वास्थ्य विभाग",
      "Other": "अन्य",
      "Unknown": "अज्ञात"
    },
    "problemType": {
      "Water": "पानी",
      "Road": "सड़क",
      "Electricity": "बिजली",
      "Sanitation": "स्वच्छता",
      "Streetlight": "स्ट्रीटलाइट",
      "Drainage": "नाली",
      "Garbage": "कचरा",
      "Other": "अन्य",
      "Unknown": "अज्ञात"
    }
  }
};

const dynamicEnglish = {
  "dynamic": {
    "status": {
      "Pending": "Pending",
      "In Progress": "In Progress",
      "Resolved": "Resolved",
      "Escalated": "Escalated",
      "Closed": "Closed"
    },
    "priority": {
      "Low": "Low",
      "Medium": "Medium",
      "High": "High",
      "Critical": "Critical"
    },
    "timeline": {
      "Complaint submitted and processed by AI agents": "Complaint submitted and processed by AI agents",
      "Complaint has been resolved by the department.": "Complaint has been resolved by the department.",
      "System": "System"
    },
    "department": {
      "Public Works Department (PWD)": "Public Works Department (PWD)",
      "Municipal Corporation": "Municipal Corporation",
      "Water Supply Board": "Water Supply Board",
      "Electricity Board": "Electricity Board",
      "Sanitation Department": "Sanitation Department",
      "Traffic Police": "Traffic Police",
      "Health Department": "Health Department",
      "Other": "Other",
      "Unknown": "Unknown"
    },
    "problemType": {
      "Water": "Water",
      "Road": "Road",
      "Electricity": "Electricity",
      "Sanitation": "Sanitation",
      "Streetlight": "Streetlight",
      "Drainage": "Drainage",
      "Garbage": "Garbage",
      "Other": "Other",
      "Unknown": "Unknown"
    }
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (file === 'hi.json') {
    data.dynamic = dynamicKeys.dynamic;
  } else if (file === 'en.json') {
    data.dynamic = dynamicEnglish.dynamic;
  } else {
    data.dynamic = dynamicEnglish.dynamic;
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated ' + file);
});
