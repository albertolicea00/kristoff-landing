interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  link: string;
  publishedAt?: string;
}

interface VideosPayload {
  mainVideos: VideoData[];
  vodVideos: VideoData[];
  podcastVideos: VideoData[];
  twitchLive: boolean;
  fetchedAt: string;
}

interface ChannelsListResponse {
  items?: Array<{
    contentDetails?: {
      relatedPlaylists?: {
        uploads?: string;
      };
    };
  }>;
}

interface PlaylistItemsListResponse {
  items?: Array<{
    snippet?: {
      title?: string;
      thumbnails?: ThumbnailSet;
      resourceId?: {
        videoId?: string;
      };
    };
    contentDetails?: {
      videoPublishedAt?: string;
      videoId?: string;
    };
  }>;
}

interface ThumbnailSet {
  maxres?: { url?: string };
  standard?: { url?: string };
  high?: { url?: string };
  medium?: { url?: string };
  default?: { url?: string };
}

interface CopySet {
  errorText: string;
  emptyText: string;
  mainBadge: string;
  vodBadge: string;
  podcastBadge: string;
  podcastDescription: string;
  watchEpisode: string;
  allEpisodes: string;
}

const CHANNELS: Array<{
  handle: string;
  limit: number;
}> = [
  { handle: 'Kristoff9', limit: 3 },
  { handle: 'Kristoffvod', limit: 3 },
  { handle: 'EstoNoEsUnPodcastMiami', limit: 1 },
];

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const TWITCH_GQL_URL = 'https://gql.twitch.tv/gql';
const TWITCH_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const CACHE_KEY = 'kristoff-videos-cache-v1';
const CACHE_TTL_MS = 5 * 60 * 1000;
const uploadsPlaylistIds = new Map<string, string>();

export function initVideosSection() {
  const root = document.querySelector<HTMLElement>('[data-videos-root]');
  if (!root) return;

  const apiKey = root.dataset.youtubeApiKey?.trim() || '';
  if (!apiKey) return;

  const copy = readCopy(root);
  const cached = readCache();

  if (cached) {
    renderPayload(root, copy, cached);
    if (Date.now() - Date.parse(cached.fetchedAt) < CACHE_TTL_MS) {
      return;
    }
  }

  void refreshVideos(root, copy, apiKey, Boolean(cached));
}

async function refreshVideos(root: HTMLElement, copy: CopySet, apiKey: string, hasCache: boolean) {
  try {
    const payload = await loadVideosPayload(apiKey);
    const hasAnyVideos =
      payload.mainVideos.length > 0 ||
      payload.vodVideos.length > 0 ||
      payload.podcastVideos.length > 0;

    if (!hasAnyVideos) {
      throw new Error('No videos were returned by the API.');
    }

    writeCache(payload);
    renderPayload(root, copy, payload);
  } catch (error) {
    if (!hasCache) {
      renderFailure(root, copy.errorText);
    }
    console.error('Failed to refresh videos in real time:', error);
  }
}

async function loadVideosPayload(apiKey: string): Promise<VideosPayload> {
  const [mainResult, vodResult, podcastResult, twitchResult] = await Promise.allSettled([
    fetchLatestChannelVideos(apiKey, CHANNELS[0].handle, CHANNELS[0].limit),
    fetchLatestChannelVideos(apiKey, CHANNELS[1].handle, CHANNELS[1].limit),
    fetchLatestChannelVideos(apiKey, CHANNELS[2].handle, CHANNELS[2].limit),
    fetchTwitchLiveStatus(),
  ]);

  return {
    mainVideos: mainResult.status === 'fulfilled' ? mainResult.value : [],
    vodVideos: vodResult.status === 'fulfilled' ? vodResult.value : [],
    podcastVideos: podcastResult.status === 'fulfilled' ? podcastResult.value : [],
    twitchLive: twitchResult.status === 'fulfilled' ? twitchResult.value : false,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchLatestChannelVideos(apiKey: string, handle: string, limit: number): Promise<VideoData[]> {
  const uploadsPlaylistId = await getUploadsPlaylistId(apiKey, handle);
  const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
  url.searchParams.set('part', 'snippet,contentDetails');
  url.searchParams.set('playlistId', uploadsPlaylistId);
  url.searchParams.set('maxResults', String(limit + 4));
  url.searchParams.set('key', apiKey);

  const response = await fetchJson<PlaylistItemsListResponse>(url.toString());
  const items = response.items || [];

  return items
    .filter((item) => {
      const title = item.snippet?.title || '';
      const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      return Boolean(videoId) && title !== 'Deleted video' && title !== 'Private video';
    })
    .slice(0, limit)
    .map((item) => {
      const id = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || '';
      const title = item.snippet?.title || 'Video';
      const thumbnail = pickThumbnail(item.snippet?.thumbnails, id);

      return {
        id,
        title,
        thumbnail,
        link: `https://www.youtube.com/watch?v=${id}`,
        publishedAt: item.contentDetails?.videoPublishedAt,
      };
    });
}

async function getUploadsPlaylistId(apiKey: string, handle: string): Promise<string> {
  const cachedPlaylistId = uploadsPlaylistIds.get(handle);
  if (cachedPlaylistId) {
    return cachedPlaylistId;
  }

  const url = new URL(`${YOUTUBE_API_BASE}/channels`);
  url.searchParams.set('part', 'contentDetails');
  url.searchParams.set('forHandle', handle);
  url.searchParams.set('key', apiKey);

  const response = await fetchJson<ChannelsListResponse>(url.toString());
  const uploadsId = response.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsId) {
    throw new Error(`Uploads playlist not found for @${handle}.`);
  }

  uploadsPlaylistIds.set(handle, uploadsId);
  return uploadsId;
}

async function fetchTwitchLiveStatus(): Promise<boolean> {
  const response = await fetch(TWITCH_GQL_URL, {
    method: 'POST',
    headers: {
      'Client-Id': TWITCH_CLIENT_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `query { user(login: "kristoff_kriollo") { stream { id } } }`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Twitch request failed with status ${response.status}.`);
  }

  const data = await response.json();
  return Boolean(data?.data?.user?.stream?.id);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Request failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<T>;
}

function renderPayload(root: HTMLElement, copy: CopySet, payload: VideosPayload) {
  const mainGrid = root.querySelector<HTMLElement>('#main-videos-grid');
  const vodSection = root.querySelector<HTMLElement>('#vod-section');
  const vodGrid = root.querySelector<HTMLElement>('#vod-videos-grid');
  const podcastSection = root.querySelector<HTMLElement>('#podcast-section');
  const podcastCard = root.querySelector<HTMLElement>('#podcast-card');
  const twitchBanner = root.querySelector<HTMLElement>('#twitch-live-banner');
  const lang = root.dataset.lang === 'en' ? 'en' : 'es';

  if (mainGrid) {
    mainGrid.innerHTML = payload.mainVideos.length
      ? payload.mainVideos.map((video) => renderVideoCard(video, 'main', lang, copy)).join('')
      : renderMessage(copy.emptyText);
  }

  if (vodSection && vodGrid) {
    if (payload.vodVideos.length) {
      vodSection.classList.remove('hidden');
      vodGrid.innerHTML = payload.vodVideos.map((video) => renderVideoCard(video, 'vod', lang, copy)).join('');
    } else {
      vodSection.classList.add('hidden');
    }
  }

  if (podcastSection && podcastCard) {
    const podcastVideo = payload.podcastVideos[0];
    if (podcastVideo) {
      podcastSection.classList.remove('hidden');
      podcastCard.innerHTML = renderPodcastCard(podcastVideo, copy);
    } else {
      podcastSection.classList.add('hidden');
    }
  }

  if (twitchBanner) {
    twitchBanner.classList.toggle('hidden', !payload.twitchLive);
  }
}

function renderFailure(root: HTMLElement, message: string) {
  const mainGrid = root.querySelector<HTMLElement>('#main-videos-grid');
  const vodSection = root.querySelector<HTMLElement>('#vod-section');
  const podcastSection = root.querySelector<HTMLElement>('#podcast-section');
  const twitchBanner = root.querySelector<HTMLElement>('#twitch-live-banner');

  if (mainGrid) {
    mainGrid.innerHTML = renderMessage(message);
  }

  if (vodSection) {
    vodSection.classList.add('hidden');
  }

  if (podcastSection) {
    podcastSection.classList.add('hidden');
  }

  if (twitchBanner) {
    twitchBanner.classList.add('hidden');
  }
}

function renderVideoCard(video: VideoData, variant: 'main' | 'vod', lang: 'es' | 'en', copy: CopySet): string {
  const borderClass = variant === 'main' ? 'border-primary' : 'border-accent';
  const overlayButtonClass = variant === 'main'
    ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,59,59,0.6)]'
    : 'bg-accent text-secondary shadow-[0_0_20px_rgba(255,214,0,0.6)]';
  const titleHoverClass = variant === 'main' ? 'group-hover:text-primary' : 'group-hover:text-accent';
  const badgeMarkup = variant === 'main'
    ? `
      <span class="flex items-center font-medium bg-red-50 text-primary px-2 py-0.5 rounded text-xs font-body w-fit">
        <svg class="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
        ${escapeHtml(copy.mainBadge)}
      </span>
    `
    : `
      <span class="flex items-center font-medium bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs font-body w-fit">
        ${escapeHtml(copy.vodBadge)}
      </span>
    `;
  const publishedLabel = formatPublishedDate(video.publishedAt, lang);

  return `
    <a href="${escapeAttribute(video.link)}" target="_blank" rel="noopener noreferrer" class="group block cursor-pointer bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
      <div class="relative w-full aspect-video bg-gray-900 border-b-4 ${borderClass}">
        <img src="${escapeAttribute(video.thumbnail)}" alt="${escapeAttribute(video.title)}" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
          <div class="w-16 h-16 rounded-full flex items-center justify-center ${overlayButtonClass}">
            <svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
          </div>
        </div>
      </div>
      <div class="p-5">
        <h3 class="font-body font-bold text-base text-secondary line-clamp-2 leading-tight mb-2 transition-colors ${titleHoverClass}">
          ${escapeHtml(video.title)}
        </h3>
        <div class="flex flex-wrap gap-2">
          ${badgeMarkup}
          ${publishedLabel ? `<span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">${escapeHtml(publishedLabel)}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

function renderPodcastCard(video: VideoData, copy: CopySet): string {
  return `
    <div class="bg-secondary/5 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 border border-gray-100 hover:shadow-xl transition-all duration-500">
      <div class="w-full md:w-2/5 aspect-video rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 group relative">
        <a href="${escapeAttribute(video.link)}" target="_blank" rel="noopener noreferrer" class="block w-full h-full">
          <img src="${escapeAttribute(video.thumbnail)}" alt="${escapeAttribute(video.title)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
          <div class="absolute inset-0 bg-secondary/20 group-hover:bg-secondary/40 flex items-center justify-center transition-colors">
            <div class="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-secondary ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
            </div>
          </div>
        </a>
      </div>
      <div class="flex-1 text-center md:text-left">
        <div class="inline-flex items-center gap-2 mb-4 bg-secondary/10 px-3 py-1 rounded-full border border-secondary/10">
          <span class="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
          <span class="text-secondary text-[10px] md:text-xs font-heading font-bold uppercase tracking-widest">
            ${escapeHtml(copy.podcastBadge)}
          </span>
        </div>
        <h3 class="text-2xl md:text-3xl font-heading font-bold text-secondary mb-4 leading-tight">
          ${escapeHtml(video.title)}
        </h3>
        <p class="font-body text-gray-500 text-sm mb-6 max-w-lg hidden md:block">
          ${escapeHtml(copy.podcastDescription)}
        </p>
        <div class="flex flex-col sm:flex-row items-center gap-5">
          <a href="${escapeAttribute(video.link)}" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto bg-secondary hover:bg-black text-white px-8 py-3.5 rounded-xl font-heading text-sm uppercase tracking-wider shadow-lg hover:shadow-secondary/20 transition-all active:scale-95">
            ${escapeHtml(copy.watchEpisode)}
          </a>
          <a href="https://www.youtube.com/@EstoNoEsUnPodcastMiami" target="_blank" rel="noopener noreferrer" class="text-secondary/60 hover:text-secondary text-xs font-heading underline underline-offset-8 uppercase tracking-widest transition-colors font-bold">
            ${escapeHtml(copy.allEpisodes)}
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderMessage(message: string): string {
  return `
    <div class="col-span-full rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm">
      <p class="font-body text-sm text-gray-500">${escapeHtml(message)}</p>
    </div>
  `;
}

function formatPublishedDate(value: string | undefined, lang: 'es' | 'en'): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function pickThumbnail(
  thumbnails: ThumbnailSet | undefined,
  videoId: string,
): string {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  );
}

function readCopy(root: HTMLElement): CopySet {
  return {
    errorText: root.dataset.errorText || 'No se pudieron cargar los videos ahora mismo.',
    emptyText: root.dataset.emptyText || 'No hay videos disponibles ahora mismo.',
    mainBadge: root.dataset.mainBadge || 'Kristoff',
    vodBadge: root.dataset.vodBadge || 'TV',
    podcastBadge: root.dataset.podcastBadge || 'Ultimo del Podcast',
    podcastDescription: root.dataset.podcastDescription || '',
    watchEpisode: root.dataset.watchEpisode || 'Ver episodio',
    allEpisodes: root.dataset.allEpisodes || 'Todos los episodios',
  };
}

function readCache(): VideosPayload | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as VideosPayload;
    if (!parsed?.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload: VideosPayload) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors.
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
