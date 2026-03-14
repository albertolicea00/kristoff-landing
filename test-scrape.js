const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrape() {
  try {
    const ytHtml = await fetch('https://www.youtube.com/@Kristoff9');
    const subMatch = ytHtml.match(/"subscriberCountText":\s*\{\s*"accessibility":\s*\{\s*"accessibilityData":\s*\{\s*"label":\s*"([^"]+)"/);
    console.log("YT Subs Match:", subMatch ? subMatch[1] : "Not found");
    
    const viewMatch = ytHtml.match(/"viewCountText":\s*\{\s*"simpleText":\s*"([^"]+)"/);
    console.log("YT Views Match:", viewMatch ? viewMatch[1] : "Not found");
  } catch(e) { console.error(e); }
}
scrape();
