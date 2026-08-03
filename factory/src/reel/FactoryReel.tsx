import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Avatar, Background, Header, brand } from "../shared";

type ReelItem = {
  hook: string;
  highlight: string;
  nodes: string[];
  takeaway: string;
};

const Enter: React.FC<React.PropsWithChildren<{ delay?: number }>> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 130 } });
  return <div style={{ opacity: interpolate(progress, [0, 1], [0, 1]), transform: `translateY(${interpolate(progress, [0, 1], [55, 0])}px)` }}>{children}</div>;
};

export const FactoryReel: React.FC<{ item: ReelItem }> = ({ item }) => (
  <Background>
    <Audio src={staticFile("audio/current-reel.wav")} volume={1} />
    <div style={{ position: "absolute", zIndex: 5, top: 55, left: 55 }}><Header /></div>
    <div style={{ position: "absolute", zIndex: 5, top: 64, right: 55, border: "1px solid #3B425D", borderRadius: 999, padding: "10px 18px", color: brand.muted, fontSize: 15, fontWeight: 850, letterSpacing: 1.2 }}>AI-GENERATED CREATOR</div>

    <Sequence from={0} durationInFrames={150}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "310px 75px 170px", textAlign: "center" }}>
        <Enter><Avatar size={330} /></Enter>
        <Enter delay={8}>
          <div style={{ marginTop: 55, fontSize: item.hook.length > 28 ? 72 : 84, lineHeight: .98, fontWeight: 950, letterSpacing: -4 }}>{item.hook}<br /><span style={{ color: brand.orange }}>{item.highlight}</span></div>
        </Enter>
      </AbsoluteFill>
    </Sequence>

    <Sequence from={150} durationInFrames={450}>
      <AbsoluteFill style={{ padding: "340px 80px 210px" }}>
        <Enter><div style={{ fontSize: 50, fontWeight: 950, marginBottom: 40 }}>Use this <span style={{ color: brand.orange }}>4-step pattern</span></div></Enter>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {item.nodes.map((node, index) => (
            <Enter key={node} delay={index * 15}>
              <div style={{ display: "flex", alignItems: "center", gap: 24, minHeight: 120, borderRadius: 24, border: "1px solid #3B425D", padding: "22px 28px", background: "linear-gradient(135deg, rgba(21,26,46,.98), rgba(16,21,34,.98))", boxShadow: "0 20px 50px rgba(0,0,0,.22)" }}>
                <span style={{ width: 58, height: 58, borderRadius: "50%", background: index === 3 ? brand.mint : brand.orange, color: "#07120E", display: "grid", placeItems: "center", fontSize: 24, fontWeight: 950, flex: "0 0 auto" }}>{index + 1}</span>
                <span style={{ fontSize: 34, lineHeight: 1.15, fontWeight: 850 }}>{node}</span>
              </div>
            </Enter>
          ))}
        </div>
      </AbsoluteFill>
    </Sequence>

    <Sequence from={600} durationInFrames={150}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "340px 85px 220px", textAlign: "center" }}>
        <Enter>
          <div style={{ color: brand.mint, fontSize: 22, fontWeight: 950, letterSpacing: 3, marginBottom: 28 }}>THE RULE TO KEEP</div>
          <div style={{ fontSize: 60, lineHeight: 1.06, fontWeight: 950, letterSpacing: -2.5 }}>{item.takeaway}</div>
        </Enter>
      </AbsoluteFill>
    </Sequence>

    <Sequence from={750} durationInFrames={150}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "320px 80px 180px", textAlign: "center" }}>
        <Enter><Avatar size={290} /></Enter>
        <Enter delay={8}>
          <div style={{ marginTop: 45, fontSize: 58, lineHeight: 1.04, fontWeight: 950 }}>Save this workflow pattern.</div>
          <div style={{ marginTop: 26, fontSize: 30, color: brand.muted }}>Free n8n starter templates → link in bio</div>
        </Enter>
      </AbsoluteFill>
    </Sequence>

    <div style={{ position: "absolute", bottom: 70, left: 70, right: 70, display: "flex", justifyContent: "space-between", borderTop: "1px solid #303650", paddingTop: 22, color: brand.muted, fontSize: 18 }}>
      <span>@taliaautomates</span><span>n8n · AI · reliable automation</span>
    </div>
  </Background>
);
