// YouTube scraping — no API key needed, no quota limits

interface VideoData {
  id: string;
  title: string;
  time: string;
  thumbnail: string;
  link: string;
  channel: string;
  isUpcoming?: boolean;
  isMembersOnly?: boolean;
  premiereTime?: string;
}

async function scrapeChannelVideos(channelUrl: string, channelLabel: string, maxResults: number = 3): Promise<VideoData[]> {
  try {
    const res = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      }
    });
    const html = await res.text();
    const videos: VideoData[] = [];

    // Attempt to extract the ytInitialData JSON object
    const dataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/window\["ytInitialData"\] = ({.*?});<\/script>/s);
    
    if (dataMatch) {
      try {
        const data = JSON.parse(dataMatch[1]);
        const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
        const videosTab = tabs?.find((t: any) => t.tabRenderer?.content?.richGridRenderer || t.tabRenderer?.content?.sectionListRenderer);
        
        let items: any[] = [];
        const content = videosTab?.tabRenderer?.content;
        
        if (content?.richGridRenderer) {
          items = content.richGridRenderer.items;
        } else if (content?.sectionListRenderer) {
          // Sometimes it's in a section list (older layouts or specific cases)
          items = content.sectionListRenderer.contents[0]?.itemSectionRenderer?.contents[0]?.gridRenderer?.items || [];
        }

        for (const item of items) {
          const video = item.richItemRenderer?.content?.videoRenderer || item.gridVideoRenderer;
          if (!video) continue;

          const isUpcoming = video.upcomingEventData !== undefined || video.thumbnailOverlays?.some((o: any) => o.thumbnailOverlayTimeStatusRenderer?.style === 'UPCOMING');
          const isMembersOnly = video.badges?.some((b: any) => b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_MEMBERS_ONLY');
          
          let premiereTime = '';
          if (video.upcomingEventData?.startTime) {
              const date = new Date(parseInt(video.upcomingEventData.startTime) * 1000);
              premiereTime = date.toLocaleString();
          }

          videos.push({
            id: video.videoId,
            title: video.title?.runs?.[0]?.text || 'Video',
            time: video.publishedTimeText?.simpleText || '',
            thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
            link: `https://www.youtube.com/watch?v=${video.videoId}`,
            channel: channelLabel,
            isUpcoming,
            isMembersOnly,
            premiereTime
          });

          if (videos.length >= maxResults) break;
        }
      } catch (e) {
        console.warn("Failed to parse ytInitialData for " + channelLabel + ", falling back to regex.");
      }
    }

    // Fallback if JSON extraction fails
    if (videos.length === 0) {
        const videoIdRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
        const titleRegex = /"title":\{"runs":\[\{"text":"([^"]+)"\}/g;
        
        const ids: string[] = [];
        let match;
        while ((match = videoIdRegex.exec(html)) !== null) {
          if (!ids.includes(match[1])) ids.push(match[1]);
        }

        const titles: string[] = [];
        while ((match = titleRegex.exec(html)) !== null) {
          titles.push(match[1]);
        }

        const seen = new Set<string>();
        for (let i = 0; i < Math.min(ids.length, maxResults * 3); i++) {
          const id = ids[i];
          if (seen.has(id)) continue;
          seen.add(id);
          videos.push({
            id,
            title: decodeHTMLEntities(titles[videos.length] || `Video de ${channelLabel}`),
            time: '',
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            link: `https://www.youtube.com/watch?v=${id}`,
            channel: channelLabel
          });
          if (videos.length >= maxResults) break;
        }
    }

    return videos;
  } catch (error) {
    console.error(`Error scraping ${channelUrl}:`, error);
    return [];
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\u0026/g, '&')
    .replace(/\\"/g, '"');
}

async function filterOutShorts(videos: VideoData[]): Promise<VideoData[]> {
  const longVideos: VideoData[] = [];
  
  for (const video of videos) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/shorts/${video.id}&format=json`);
      if (oembedRes.status === 200) continue;
    } catch(e) { /* not a short */ }
    
    longVideos.push(video);
    if (longVideos.length >= 3) break;
  }
  
  return longVideos;
}

export async function fetchLatestVideos() {
  try {
    const [mainVideos, vodVideos, podcastVideos] = await Promise.all([
      scrapeChannelVideos('https://www.youtube.com/@Kristoff9/videos', 'Kristoff', 3),
      scrapeChannelVideos('https://www.youtube.com/@Kristoffvod/videos', 'Kristoff TV', 3),
      scrapeChannelVideos('https://www.youtube.com/@EstoNoEsUnPodcastMiami/videos', 'Podcast', 1)
    ]);

    return { mainVideos, vodVideos, podcastVideos };
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return { mainVideos: [], vodVideos: [], podcastVideos: [] };
  }
}
