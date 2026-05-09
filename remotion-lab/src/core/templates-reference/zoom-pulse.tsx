"use client";

import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/**
 * ZoomPulse — Remotion-kompatibel umgeschrieben (Original war Next.js).
 *
 * Pattern: zooming sine-wave scale (1.0 → 1.1) für Beat-Vibes.
 *   const t = frame / fps;
 *   const phase = (Math.sin(t * 2π / period) + 1) / 2;  // 0..1
 *   const scale = lerp(minScale, maxScale, phase);
 *
 * Für echtes Beat-Sync (Eurogang): ersetze sine durch
 *   interpolate(frame, [onset-3, onset, onset+8], [1, maxScale, 1])
 * mit deinem onsets-Array.
 */
export default function ZoomPulse({
  imageUrl = "https://images.pexels.com/photos/1726310/pexels-photo-1726310.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750",
  periodSeconds = 4,
  minScale = 1,
  maxScale = 1.1,
}: {
  imageUrl?: string;
  periodSeconds?: number;
  minScale?: number;
  maxScale?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const phase = (Math.sin((t / periodSeconds) * Math.PI * 2) + 1) / 2;
  const scale = interpolate(phase, [0, 1], [minScale, maxScale]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
        overflow: "hidden",
      }}
    >
      <img
        src={imageUrl}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}
