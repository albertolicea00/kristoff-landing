// Social stats and Twitch status — all via scraping, no API keys needed

export async function getTwitchStatus() {
  try {
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: { 'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko' },
      body: JSON.stringify({
        query: `query { user(login: "kristoff_kriollo") { stream { id, type, viewersCount } } }`
      })
    });
    const data = await res.json();
    return data?.data?.user?.stream || null;
  } catch (error) {
    return null;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  return num.toString();
}

export async function getSocialStats() {
  const stats = {
    instagram: '370K+',
    youtube: '98.5K+',
    tiktok: '50K+',
    youtubeViews: '13M+',
    twitch: '5K+'
  };

  try {
    // Scrape YouTube channel page for real subscriber count
    const ytRes = await fetch('https://www.youtube.com/@Kristoff9', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const ytHtml = await ytRes.text();
    
    // Extract subscriber count
    const subMatch = ytHtml.match(/"subscriberCountText":\s*\{[^}]*"simpleText":\s*"([^"]+)"/);
    if (subMatch) {
      stats.youtube = subMatch[1].replace(' subscribers', '').replace(' suscriptores', '') + '+';
    } else {
      // Alternative pattern
      const subMatch2 = ytHtml.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/);
      if (subMatch2) {
        let cleanSub = subMatch2[1]
          .replace(/ subscribers?/i, '')
          .replace(/ suscriptores?/i, '')
          .replace(' thousand', 'K')
          .replace(' million', 'M')
          .replace(' mil', 'K')
          .replace(' millón', 'M')
          .replace(' millones', 'M');
        stats.youtube = cleanSub + '+';
      }
    }

    // Extract view count
    const viewMatch = ytHtml.match(/"viewCountText":\s*\{[^}]*"simpleText":\s*"([^"]+)"/);
    if (viewMatch) {
      const viewText = viewMatch[1].replace(/ views?/i, '').replace(/ visualizaciones?/i, '');
      const viewNum = parseInt(viewText.replace(/[,.]/g, ''));
      if (!isNaN(viewNum)) {
        stats.youtubeViews = formatNumber(viewNum) + '+';
      }
    }
  } catch(e) {
    console.error("Error scraping YT stats:", e);
  }

  return stats;
}
