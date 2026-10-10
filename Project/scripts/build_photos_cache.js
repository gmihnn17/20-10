const fs = require('fs');
const path = require('path');

const photoPath = path.join(__dirname, '..', 'assets', 'photos', 'minh_hang.jpg');
const outputPath = path.join(__dirname, '..', 'data', 'photos-cache.js');

if (fs.existsSync(photoPath)) {
  const b64 = 'data:image/jpeg;base64,' + fs.readFileSync(photoPath).toString('base64');
  const jsContent = `window.PHOTOS_CACHE = window.PHOTOS_CACHE || {};\nwindow.PHOTOS_CACHE['assets/photos/minh_hang.jpg'] = ${JSON.stringify(b64)};\n`;
  fs.writeFileSync(outputPath, jsContent, 'utf8');
  console.log('Successfully wrote data/photos-cache.js!');
} else {
  console.error('File not found:', photoPath);
}
