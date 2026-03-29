import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const PHRASES = [
  "More profit",
  "Less guesswork",
  "Scale your ads ✨",
];

// Generate radiating lines from center
const LINES = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 360;
  return angle;
});

// Nested rectangles (5 layers)
const RECTS = [0.95, 0.75, 0.58, 0.42, 0.28];

const ZoomTunnel = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Scale zooms from 1 → 8 as you scroll
  const scale = useTransform(scrollYProgress, [0, 1], [1, 8]);

  // Each phrase fades in then out at different scroll points
  const phrase0Opacity = useTransform(scrollYProgress, [0.0, 0.1, 0.25, 0.33], [0, 1, 1, 0]);
  const phrase1Opacity = useTransform(scrollYProgress, [0.28, 0.38, 0.55, 0.63], [0, 1, 1, 0]);
  const phrase2Opacity = useTransform(scrollYProgress, [0.58, 0.68, 0.85, 0.95], [0, 1, 1, 0]);
  const phraseOpacities = [phrase0Opacity, phrase1Opacity, phrase2Opacity];

  // Overall fade out at the very end
  const containerOpacity = useTransform(scrollYProgress, [0.9, 1], [1, 0]);

  return (
    <div ref={containerRef} className="relative" style={{ height: "400vh" }}>
      <motion.div
        className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center"
        style={{ opacity: containerOpacity }}
      >
        {/* The zoom container */}
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          style={{ scale }}
        >
          {/* Radiating lines */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid slice"
          >
            {LINES.map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 500, cy = 300;
              const len = 800;
              const x2 = cx + Math.cos(rad) * len;
              const y2 = cy + Math.sin(rad) * len;
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.8"
                  opacity="0.5"
                />
              );
            })}
          </svg>

          {/* Nested rectangles */}
          {RECTS.map((sizeFraction, i) => (
            <div
              key={i}
              className="absolute border-2 rounded-sm border-primary"
              style={{
                width: `${sizeFraction * 100}%`,
                height: `${sizeFraction * 100}%`,
                opacity: 0.15 + (RECTS.length - i) * 0.15,
                left: `${(1 - sizeFraction) * 50}%`,
                top: `${(1 - sizeFraction) * 50}%`,
              }}
            />
          ))}
        </motion.div>

        {/* Text phrases - fixed in viewport center */}
        {PHRASES.map((phrase, i) => (
          <motion.h2
            key={i}
            className="absolute text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight text-center pointer-events-none"
            style={{ opacity: phraseOpacities[i] }}
          >
            {phrase}
          </motion.h2>
        ))}
      </motion.div>
    </div>
  );
};

export default ZoomTunnel;
