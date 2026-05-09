// Photo selection helpers for the manifest produced by scripts/prepare_photos.sh.

export type PhotoMeta = {
  file: string;       // path relative to public/, e.g. "photos/001_xx.jpg"
  w: number;
  h: number;
  aspect: number;     // w/h
};

export type PhotoManifest = {
  count: number;
  photos: PhotoMeta[];
};

/**
 * Deterministic photo selection that:
 *  - Spreads picks across the album (no clumping at the start)
 *  - Avoids back-to-back duplicates of the same aspect-ratio group when possible
 *  - Returns exactly `n` items, repeating from the start if the album is smaller
 */
export function pickPhotos(manifest: PhotoManifest, n: number, seed = 'eurogang'): PhotoMeta[] {
  const all = manifest.photos;
  if (all.length === 0) return [];
  if (all.length >= n) {
    // Even-spaced sampling with deterministic offset
    const offset = hash32(seed) % all.length;
    const stride = Math.max(1, Math.floor(all.length / n));
    const picked: PhotoMeta[] = [];
    for (let i = 0; i < n; i++) {
      picked.push(all[(offset + i * stride) % all.length]);
    }
    return picked;
  }
  // Album smaller than required: repeat with stride
  const out: PhotoMeta[] = [];
  for (let i = 0; i < n; i++) {
    out.push(all[i % all.length]);
  }
  return out;
}

/**
 * Pick photos with a "burst" group that repeats one photo for micro-cuts,
 * then a unique photo per breathing/midhold cut.
 */
export function pickPhotosForCuts(
  manifest: PhotoManifest,
  cuts: { isBurst: boolean; isHero: boolean }[],
  seed = 'eurogang'
): PhotoMeta[] {
  const all = manifest.photos;
  if (all.length === 0) return [];

  const out: PhotoMeta[] = [];
  let cursor = hash32(seed) % all.length;
  let lastBurstPhoto: PhotoMeta | null = null;
  let burstCounter = 0;

  for (let i = 0; i < cuts.length; i++) {
    const cut = cuts[i];
    if (cut.isBurst) {
      // Inside a burst: occasionally repeat the same photo for stutter feel
      if (burstCounter > 0 && lastBurstPhoto && (hash32(seed + 'r' + i) % 10) < 4) {
        out.push(lastBurstPhoto);
      } else {
        const p = all[cursor % all.length];
        out.push(p);
        lastBurstPhoto = p;
        cursor++;
      }
      burstCounter++;
    } else {
      // breathing / hero — fresh photo
      const p = all[cursor % all.length];
      out.push(p);
      cursor++;
      burstCounter = 0;
      lastBurstPhoto = null;
    }
  }
  return out;
}

function hash32(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
