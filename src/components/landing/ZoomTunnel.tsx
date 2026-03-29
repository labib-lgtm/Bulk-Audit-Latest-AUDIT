import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const PHRASES = [
  "More profit",
  "Less guesswork",
  "Smarter bidding",
  "Total visibility",
  "Scale your ads ✨",
];

const ZoomTunnel = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 8]);

  // Generate evenly spaced opacity ranges for 5 phrases
  const phraseOpacities = useMemo(() => {
    const count = PHRASES.length;
    const segmentSize = 1 / count;
    return PHRASES.map((_, i) => {
      const start = i * segmentSize;
      const fadeIn = start + segmentSize * 0.15;
      const holdEnd = start + segmentSize * 0.75;
      const fadeOut = start + segmentSize * 0.95;
      return [start, fadeIn, holdEnd, fadeOut] as [number, number, number, number];
    });
  }, []);

  const containerOpacity = useTransform(scrollYProgress, [0.92, 1], [1, 0]);

  return (
    <div ref={containerRef} className="relative" style={{ height: "500vh" }}>
      <motion.div
        className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center"
        style={{ opacity: containerOpacity }}
      >
        {/* The zoom container - lines & rects */}
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          style={{ scale }}
        >
          {/* Radiating lines with center mask */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <mask id="line-mask">
                <rect width="1000" height="600" fill="white" />
                <ellipse cx="500" cy="300" rx="240" ry="90" fill="black" />
              </mask>
            </defs>
            <g mask="url(#line-mask)">
              {Array.from({ length: 20 }, (_, i) => {
                const angle = (i / 20) * 360;
                const rad = (angle * Math.PI) / 180;
                const cx = 500, cy = 300, len = 800;
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={cx + Math.cos(rad) * len}
                    y2={cy + Math.sin(rad) * len}
                    stroke="hsl(var(--primary))"
                    strokeWidth="0.8"
                    opacity="0.5"
                  />
                );
              })}
            </g>
          </svg>

          {/* Nested rectangles */}
          {[0.95, 0.75, 0.58, 0.42, 0.28].map((s, i, arr) => (
            <div
              key={i}
              className="absolute border-2 rounded-sm border-primary"
              style={{
                width: `${s * 100}%`,
                height: `${s * 100}%`,
                opacity: 0.15 + (arr.length - i) * 0.15,
                left: `${(1 - s) * 50}%`,
                top: `${(1 - s) * 50}%`,
              }}
            />
          ))}
        </motion.div>

        {/* Text phrases */}
        {PHRASES.map((phrase, i) => {
          const range = phraseOpacities[i];
          return (
            <PhraseText key={i} phrase={phrase} range={range} scrollYProgress={scrollYProgress} />
          );
        })}
      </motion.div>
    </div>
  );
};

const PhraseText = ({
  phrase,
  range,
  scrollYProgress,
}: {
  phrase: string;
  range: [number, number, number, number];
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) => {
  const opacity = useTransform(scrollYProgress, range, [0, 1, 1, 0]);
  return (
    <motion.h2
      className="absolute text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight text-center pointer-events-none"
      style={{ opacity }}
    >
      {phrase}
    </motion.h2>
  );
};

export default ZoomTunnel;
