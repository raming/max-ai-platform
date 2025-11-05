const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'backend.leadconnectorhq.com',
  port: 443,
  path: '/sites/Khu05zZF68u4Ka2ZFdUC',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMlhDeFdadVptQjZveUFvaTgzWDkiLCJjb21wYW55X2lkIjoiSWlyMTl5Ykc0UXR4OXRFZ0ppWDYiLCJsb2NhdGlvbl9pZCI6InlyTWw3VXRtTXFvMzFxTE1QNzZXIiwicm9sZSI6Im93bmVyIiwiaWF0IjoxNzI5NjE1MzMyfQ.b3u-xz-hKHDhVYdM3R34HxSPNtN4vJWNfVW4vGgH2jU',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ GHL Site Info Response:\n');
    try {
      const site = JSON.parse(data);
      console.log(JSON.stringify(site, null, 2));
      
      // Save response
      fs.writeFileSync(
        'scraped-data/ghl-site-info.json',
        JSON.stringify(site, null, 2)
      );
    } catch (err) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => console.error(`❌ Error: ${e.message}`));
req.end();
