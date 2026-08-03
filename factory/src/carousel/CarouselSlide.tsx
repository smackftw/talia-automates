import React from "react";
import { AbsoluteFill } from "remotion";
import { Avatar, Background, brand } from "../shared";

type Slide = {
  eyebrow: string;
  title: string;
  highlight?: string;
  body?: string;
  bullets?: string[];
  cta?: string;
};

const fitTitle = (text: string) => (text.length > 72 ? 49 : text.length > 48 ? 58 : 76);

export const CarouselSlide: React.FC<{
  slide: Slide;
  slideIndex: number;
  slideCount: number;
}> = ({ slide, slideIndex, slideCount }) => (
  <Background>
    <AbsoluteFill style={{ padding: "58px 64px 52px" }}>
      <header style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Avatar size={118} />
          <div>
            <div style={{ fontWeight: 950, fontSize: 28, letterSpacing: -0.8 }}>Talia Automates</div>
            <div style={{ fontSize: 14, color: brand.mint, fontWeight: 850, letterSpacing: 1.8 }}>AI AUTOMATION CREATOR</div>
          </div>
        </div>
        <div style={{ fontSize: 17, color: brand.muted, fontWeight: 800 }}>{slideIndex + 1} / {slideCount}</div>
      </header>

      <main style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 58, paddingBottom: 35 }}>
        <div style={{ fontSize: 20, color: brand.mint, fontWeight: 950, letterSpacing: 3.2, marginBottom: 24 }}>{slide.eyebrow}</div>
        <div style={{ fontSize: fitTitle(`${slide.title} ${slide.highlight || ""}`), lineHeight: 1.02, fontWeight: 950, letterSpacing: -3.2, maxWidth: 930 }}>
          {slide.title}<br />
          {slide.highlight ? <span style={{ color: brand.orange }}>{slide.highlight}</span> : null}
        </div>

        {slide.body ? <p style={{ fontSize: 31, color: brand.muted, lineHeight: 1.35, maxWidth: 880, marginTop: 38, marginBottom: 0 }}>{slide.body}</p> : null}

        {slide.bullets ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 15, marginTop: 40, maxWidth: 910 }}>
            {slide.bullets.map((bullet, index) => (
              <div key={bullet} style={{ display: "flex", alignItems: "center", gap: 18, background: "rgba(17,21,38,.94)", border: "1px solid #303650", borderRadius: 18, padding: "17px 22px", fontSize: 27, fontWeight: 800 }}>
                <span style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", background: brand.mint, color: "#07120E", fontSize: 18, flex: "0 0 auto" }}>{index + 1}</span>
                {bullet}
              </div>
            ))}
          </div>
        ) : null}
      </main>

      <footer style={{ position: "relative", zIndex: 2, minHeight: 70, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #303650", paddingTop: 24 }}>
        <span style={{ fontSize: 16, color: brand.muted }}>AI-generated creator</span>
        <span style={{ fontSize: 20, color: slide.cta ? brand.mint : brand.muted, fontWeight: 950, letterSpacing: 1.3 }}>{slide.cta || "@taliaautomates"}</span>
      </footer>
    </AbsoluteFill>
  </Background>
);
