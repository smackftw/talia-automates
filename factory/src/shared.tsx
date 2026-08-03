import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const brand = {
  dark: "#070914",
  panel: "#111526",
  text: "#F7F7FA",
  muted: "#A7AEC3",
  orange: "#FF6D5A",
  mint: "#55E6C1",
  yellow: "#FFD166",
};

export const Background: React.FC<React.PropsWithChildren> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: brand.dark,
      color: brand.text,
      fontFamily: "Inter, Segoe UI, Arial, sans-serif",
      overflow: "hidden",
    }}
  >
    <AbsoluteFill
      style={{
        opacity: 0.2,
        backgroundImage: "radial-gradient(#68708f 1px, transparent 1px)",
        backgroundSize: "34px 34px",
      }}
    />
    <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", filter: "blur(150px)", background: `${brand.orange}25`, top: -400, right: -390 }} />
    <div style={{ position: "absolute", width: 680, height: 680, borderRadius: "50%", filter: "blur(160px)", background: `${brand.mint}18`, bottom: -400, left: -360 }} />
    {children}
  </AbsoluteFill>
);

export const Avatar: React.FC<{ size?: number }> = ({ size = 150 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const scale = enter * (1 + Math.sin(frame / 17) * 0.009);
  const shimmer = interpolate(frame % 150, [0, 150], [-130, 130]);
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        transform: `translateY(${Math.sin(frame / 22) * 3}px) rotate(${Math.sin(frame / 39) * 0.4}deg) scale(${scale})`,
        borderRadius: "50%",
        background: `linear-gradient(145deg, ${brand.orange}, #7A5CFF 55%, ${brand.mint})`,
        padding: Math.max(5, size * 0.028),
        boxShadow: `0 24px 80px rgba(255,109,90,.42)`,
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#07111F" }}>
        <Img
          src={staticFile("avatar/talia.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 23%", transform: "scale(1.08)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(108deg, transparent 35%, rgba(255,255,255,.13) 48%, transparent 61%)", transform: `translateX(${shimmer}%)`, mixBlendMode: "screen" }} />
      </div>
      <div style={{ position: "absolute", right: 0, bottom: size * 0.06, width: size * 0.28, height: size * 0.28, borderRadius: "50%", background: brand.mint, border: `${Math.max(4, size * 0.03)}px solid ${brand.dark}`, display: "grid", placeItems: "center", color: "#07120E", fontSize: size * 0.105, fontWeight: 950 }}>AI</div>
    </div>
  );
};

export const Header: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: compact ? 18 : 24 }}>
    <Avatar size={compact ? 118 : 150} />
    <div>
      <div style={{ fontWeight: 950, fontSize: compact ? 28 : 34, letterSpacing: -0.8 }}>Talia Automates</div>
      <div style={{ fontSize: compact ? 14 : 17, color: brand.mint, fontWeight: 850, letterSpacing: 1.8 }}>AI AUTOMATION CREATOR</div>
    </div>
  </div>
);
