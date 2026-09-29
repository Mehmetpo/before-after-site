"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

// Fresh, guaranteed working high-quality Unsplash images (Architecture & Minimalist theme)
const IMAGES = [
  { src: "https://cdn.21st.dev/assets/mirror/67/678d13ab2f51cc194ee7109f41e5c4b74a33f143dde876368a93b748a5bdb2f6.jpg", alt: "Modern House" },
  { src: "https://cdn.21st.dev/assets/mirror/48/48db070b82ddcf8b658c59af85c75da59a27c6e58a5f00516c5f04e2bb56bfcc.jpg", alt: "Minimal Interior" },
  { src: "https://cdn.21st.dev/assets/mirror/cb/cb94e95db92613e6820992054bd69aacd17bb6d19975d7074e3a0918a2e58ffa.jpg", alt: "Skyscraper" },
  { src: "https://cdn.21st.dev/assets/mirror/0a/0ac930f1672abb5537c077f93d57630003552302f6298a35dd56e251b9551978.jpg", alt: "Office Space" },
  { src: "https://cdn.21st.dev/assets/mirror/3d/3dd10040aa5ee45e1a0a219a5f723f31d2b99ed12e22974fdfb4925acee2b875.jpg", alt: "White Building" },
  { src: "https://cdn.21st.dev/assets/mirror/48/48db070b82ddcf8b658c59af85c75da59a27c6e58a5f00516c5f04e2bb56bfcc.jpg", alt: "Minimal Interior 2" },
  { src: "https://cdn.21st.dev/assets/mirror/cb/cb94e95db92613e6820992054bd69aacd17bb6d19975d7074e3a0918a2e58ffa.jpg", alt: "Skyscraper 2" },
  { src: "https://cdn.21st.dev/assets/mirror/ed/ed485fec61b842ac40b18e53cdac628a9049fcdbd4a07be356cd75a39a58ff6b.jpg", alt: "Minimal Home" },
];

// Calculate a sweeping 3D arch around the center point for both mobile and desktop
const generatePanoramicCards = () => {
  const total = IMAGES.length;
  const centerIndex = (total - 1) / 2;

  return IMAGES.map((item, i) => {
    const offset = i - centerIndex;
    const absOffset = Math.abs(offset);
    const zIndex = Math.round(10 - absOffset);

    return {
      item,
      z: zIndex,
      desktop: {
        // Increased stack offset slightly to accommodate larger cards
        stacked: { x: offset * 2, y: offset * -2, rotateZ: offset * 2.5, rotateY: 0, scale: 1 },
        // Increased spread (x from 13 to 18) for larger cards
        panoramic: { x: offset * 18, y: absOffset * 3, rotateZ: offset * 1.5, rotateY: offset * -12, scale: 1 - absOffset * 0.05 },
        // Significantly larger sizes. Margins are exactly -50% of w/h to maintain perfect center.
        size: { w: "22vw", h: "32vh", ml: "-11vw", mt: "-16vh" }
      },
      mobile: {
        stacked: { x: offset * 1.5, y: offset * -1.5, rotateZ: offset * 3, rotateY: 0, scale: 1 },
        // Tighter X spread and more aggressive Y dip for mobile portrait screens
        panoramic: { x: offset * 16, y: absOffset * 5, rotateZ: offset * 2, rotateY: offset * -15, scale: 1 - absOffset * 0.04 },
        // Significantly larger for mobile devices too
        size: { w: "46vw", h: "30vh", ml: "-23vw", mt: "-15vh" }
      },
    };
  });
};

const CARDS = generatePanoramicCards();

// Optimized physics to remove scroll jitter (higher damping, zero bounce)
const PROGRESS_SPRING = { stiffness: 80, damping: 25, mass: 0.5, restDelta: 0.001 };
const PARALLAX_SPRING = { stiffness: 50, damping: 25, mass: 0.5 };

function usePointerTilt(active: boolean, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const tiltX = useSpring(rawX, PARALLAX_SPRING);
  const tiltY = useSpring(rawY, PARALLAX_SPRING);

  useEffect(() => {
    if (!enabled || !active) {
      rawX.set(0);
      rawY.set(0);
      return;
    }
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientY / window.innerHeight - 0.5) * -10);
      rawY.set((e.clientX / window.innerWidth - 0.5) * 10);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [active, enabled, rawX, rawY]);

  return { tiltX, tiltY };
}

function GalleryCard({ card, progress, isMobile }: any) {
  const { item, desktop, mobile, z } = card;
  const activeLayout = isMobile ? mobile : desktop;
  const { stacked, panoramic, size } = activeLayout;

  // Custom S-curve easing for elegance
  const ease = useTransform(progress, (p: number) =>
    p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
  );

  // Raw numeric interpolations converted natively to strings (fixes layout recalculation jitter)
  const xRaw = useTransform(ease, [0, 1], [stacked.x, panoramic.x]);
  const yRaw = useTransform(ease, [0, 1], [stacked.y, panoramic.y]);
  const x = useTransform(xRaw, (v) => `${v}vw`);
  const y = useTransform(yRaw, (v) => `${v}vh`);

  const rotateZ = useTransform(ease, [0, 1], [stacked.rotateZ, panoramic.rotateZ]);
  const rotateY = useTransform(ease, [0, 1], [stacked.rotateY, panoramic.rotateY]);
  const scale = useTransform(ease, [0, 1], [0.75, panoramic.scale]);

  return (
    <div
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{ zIndex: z }}
    >
      <motion.div
        className="will-change-transform cursor-pointer pointer-events-auto shadow-2xl shadow-black/10 dark:shadow-black/40 rounded-md"
        style={{
          width: size.w,
          height: size.h,
          marginLeft: size.ml,
          marginTop: size.mt,
          x,
          y,
          rotateZ,
          rotateY,
          scale,
          transformOrigin: "center center -50px"
        }}
      >
        <div className="group relative h-full w-full overflow-hidden bg-white p-2 pb-6 max-md:p-1 max-md:pb-3 rounded-md transition-all duration-500 hover:shadow-black/20 dark:hover:shadow-black/60 ring-1 ring-black/5 dark:ring-white/10">
          {/* Polaroid-style aesthetic frame */}
          <div className="relative h-full w-full overflow-hidden rounded-sm bg-neutral-200 dark:bg-neutral-800">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
            <img
              src={item.src}
              alt={item.alt}
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PanoramicSpreadHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, PROGRESS_SPRING);
  const progress = useTransform(smoothProgress, [0.15, 0.85], [0, 1]);

  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => setSpread(p > 0.95));

  const { tiltX, tiltY } = usePointerTilt(spread, !reduce);

  // Typography starts lower and scales up into position as cards unspool
  // Moved up slightly more ("-22vh") to give the larger images breathing room
  const textY = useTransform(progress, [0.2, 1], ["10vh", "-22vh"]);
  const textScale = useTransform(progress, [0.2, 1], [0.85, 1]);
  const textOpacity = useTransform(progress, [0.4, 0.9], [0, 1]);

  return (
    <section
      ref={wrapRef}
      className="relative w-full h-[400vh] bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white transition-colors duration-500"
    >
      <div
        className="sticky top-0 h-[100svh] w-full overflow-hidden flex items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        {/* Subtle Ambient Light for Dark Mode */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 dark:opacity-30 blur-[120px] pointer-events-none transition-opacity duration-700">
           <div className="w-[50vw] h-[50vw] bg-white/20 rounded-full mix-blend-screen" />
        </div>

        {/* Scene Container - Reacts to pointer tilt for whole-gallery parallax */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
        >
          {CARDS.map((card, i) => (
            <GalleryCard
              key={i}
              card={card}
              progress={progress}
              isSpreadActive={spread}
              isMobile={isMobile}
            />
          ))}
        </motion.div>

        {/* Elegant Editorial Typography */}
        <motion.div
          className="pointer-events-none absolute z-[5] flex flex-col items-center text-center px-6"
          style={{ y: textY, scale: textScale, opacity: textOpacity }}
        >
          <span className="text-xs md:text-[0.9vw] uppercase tracking-[0.4em] font-semibold text-neutral-500 dark:text-neutral-400 mb-4">
            Exhibition
          </span>
          <h2 className="text-5xl md:text-[5.5vw] font-serif leading-none tracking-tight">
            Curated Space.
          </h2>
          <p className="mt-6 max-w-[45ch] text-sm md:text-[1.1vw] font-light leading-relaxed opacity-70">
            Scroll to unspool the collection. Leveraging 3D spatial transforms to
            bend the digital layout dynamically around the viewer.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
