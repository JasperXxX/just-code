"use client";

import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

/**
 * KenBurns — Remotion-kompatibel umgeschrieben (Original war Next.js style jsx).
 *
 * Pattern: linear scale + translate von Start zu End über Composition-Duration.
 *   const progress = interpolate(frame, [0, durationInFrames], [0, 1], { ... easeOut });
 *   transform: scale(lerp(1, scale, progress)) translate(progress*tx, progress*ty)
 *
 * Tipp: bei `imageUrl` lokale Photos aus public/ verwenden, sonst Network-Fetch beim Render.
 */
export default function KenBurns({
  imageUrl = "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
  scale = 1.5,
  translateX = -50,
  translateY = -30,
}: {
  imageUrl?: string;
  scale?: number;
  translateX?: number;
  translateY?: number;
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
  const currentScale = interpolate(progress, [0, 1], [1, scale]);
  const tx = progress * translateX;
  const ty = progress * translateY;

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
          transform: `scale(${currentScale}) translate(${tx}px, ${ty}px)`,
        }}
      />
    </div>
  );
}
