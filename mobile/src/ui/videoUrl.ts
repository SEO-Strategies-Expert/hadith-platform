/** تحليل رابط الدرس المرئي: تضمين (يوتيوب/فيميو) أم ملفّ مباشر. */

export type VideoSource =
  | { kind: 'embed'; url: string }
  | { kind: 'file'; url: string };

/**
 * المضيف وحده يكفي للتمييز، فلا نشترط طولًا للمعرّف:
 * أي رابط على نطاق يوتيوب هو تضمين مهما كان معرّفه.
 */
function youTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]+)/i,
    /(?:youtu\.be\/)([A-Za-z0-9_-]+)/i,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]+)/i,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]+)/i,
    /(?:youtube\.com\/live\/)([A-Za-z0-9_-]+)/i,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/i);
  return m?.[1] ?? null;
}

export function resolveVideo(raw: string | null | undefined): VideoSource | null {
  if (!raw) return null;
  const url = raw.trim();
  // روابط غير آمنة (`javascript:` و`data:`) تُرفض صراحةً.
  if (!/^https?:\/\//i.test(url)) return null;

  const yt = youTubeId(url);
  if (yt) {
    return { kind: 'embed', url: `https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1&playsinline=1` };
  }

  const vm = vimeoId(url);
  if (vm) return { kind: 'embed', url: `https://player.vimeo.com/video/${vm}` };

  return { kind: 'file', url };
}
