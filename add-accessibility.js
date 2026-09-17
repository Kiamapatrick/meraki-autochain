const fs = require('fs');
const path = require('path');

const pagesDir = 'C:\\Users\\ADMIN\\Downloads\\github\\meraki-autochain\\meraki-autochain\\meraki-user-portal\\pages\\user';
const pages = [
  'vehicle-passport.html',
  'shared-access.html',
  'profile.html',
  'index.html',
  'add-vehicle.html',
  'shared-passport.html',
  'verify.html'
];

pages.forEach(page => {
  const filePath = path.join(pagesDir, page);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add skip link after <body>
  if (!content.includes('skip-link')) {
    content = content.replace('<body>', '<body>\n  <a href="#main-content" class="skip-link">Skip to main content</a>');
    console.log(`Added skip link to ${page}`);
  }

  // Add id="main-content" to main element
  if (content.includes('<main class="main-content">') && !content.includes('<main class="main-content" id="main-content">')) {
    content = content.replace('<main class="main-content">', '<main class="main-content" id="main-content">');
    console.log(`Added main-content id to ${page}`);
  } else if (content.includes('<main class="main-content">') && content.includes('id="main-content"')) {
    console.log(`main-content id already exists in ${page}`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Done!');