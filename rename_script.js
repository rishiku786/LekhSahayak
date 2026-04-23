const fs = require('fs');
const path = require('path');

const targetFiles = [
  'backend/agents/chatbot.js',
  'backend/agents/orchestrator.js',
  'backend/middleware/auth.js',
  'backend/routes/reports.js',
  'backend/seed.js',
  'backend/server.js',
  'backend/services/notifications.js',
  'frontend/public/manifest.json',
  'frontend/public/sw.js',
  'frontend/src/locales/bn.json',
  'frontend/src/locales/en.json',
  'frontend/src/locales/gu.json',
  'frontend/src/locales/hi.json',
  'frontend/src/locales/mr.json',
  'frontend/src/locales/pa.json',
  'frontend/src/locales/ta.json',
  'frontend/src/locales/te.json',
  'frontend/src/utils/i18n.js',
  'frontend/index.html'
];

targetFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace permutations
  content = content.replace(/SunoSarkar/g, 'LekhSahayak');
  content = content.replace(/sunosarkar/g, 'lekhsahayak');
  content = content.replace(/Suno Sarkar/g, 'Lekh Sahayak');
  content = content.replace(/suno sarkar/g, 'lekh sahayak');
  content = content.replace(/Suno/g, 'LekhSahayak'); // Catch solo instances if intended as title

  if (original !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
console.log('Renaming complete.');
