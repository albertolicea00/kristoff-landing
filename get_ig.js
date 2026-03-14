const https = require('https');

https.get('https://www.instagram.com/kristoff_kriollo/', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const match = data.match(/<meta property="og:image" content="(.*?)"/);
      if (match) {
        console.log(match[1]);
      } else {
        console.log("No match found", res.statusCode);
      }
    } catch (e) {
      console.log('Error', e.message);
    }
  });
}).on('error', err => console.error(err));
