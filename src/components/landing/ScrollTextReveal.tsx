import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface WordProps {
  word: string;
  index: number;
  totalWords: number;
  scrollYProgress: MotionValue<number>;
}

const RevealWord = ({ word, index, totalWords, scrollYProgress }: WordProps) => {
  // Each word occupies a small scroll range, with overlap for smoother transitions
  const wordDuration = 1.5 / totalWords;
  const start = Math.max(0, (index / totalWords) - wordDuration * 0.3);
  const end = Math.min(1, (index / totalWords) + wordDuration);

  const opacity = useTransform(scrollYProgress, [start, end], [0.12, 1]);
  const blur = useTransform(scrollYProgress, [start, end], [4, 0]);
  const y = useTransform(scrollYProgress, [start, end], [4, 0]);

  // Check if word is an emoji/symbol
  const isEmoji = /^[✦✧⚡★●◆⬡✶✹✺✻✼❖☀︎✿⚙️]$/.test(word.trim());

  return (
    <motion.span
      style={{
        opacity,
        filter: useTransform(blur, (v) => `blur(${v}px)`),
        y,
      }}
      className={`inline-block mr-[0.3em] ${isEmoji ? 'text-primary' : ''}`}
    >
      {word}
    </motion.span>
  );
};

interface ScrollTextRevealProps {
  paragraphs: string[];
}

const ScrollTextReveal = ({ paragraphs }: ScrollTextRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "end 0.1"],
  });

  // Flatten all words with paragraph tracking
  const allWords = useMemo(() => {
    return paragraphs.flatMap((p, pi) =>
      p.split(" ").map((w) => ({ word: w, paragraphIndex: pi }))
    );
  }, [paragraphs]);

  // Ambient glow that intensifies as you scroll
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 0.35, 0.15]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.2, 0.9]);

  let wordIndex = 0;

  return (
    <section
      ref={containerRef}
      className="relative min-h-[150vh] flex items-center justify-center px-6 sm:px-8 lg:px-12 overflow-hidden"
    >
      {/* Animated radial glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: glowOpacity,
          scale: glowScale,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
        }}
      />

      {/* Secondary accent glow */}
      <div
        className="absolute top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full pointer-events-none opacity-[0.08]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Noise grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative max-w-5xl mx-auto py-32 sm:py-40">
        {paragraphs.map((paragraph, pIndex) => {
          const words = paragraph.split(" ");
          const currentStart = wordIndex;

          const element = (
            <p
              key={pIndex}
              className={`text-[1.75rem] sm:text-[2.5rem] md:text-[3.25rem] lg:text-[3.75rem] font-medium leading-[1.25] tracking-[-0.02em] text-foreground ${
                pIndex > 0 ? "mt-10 sm:mt-14" : ""
              }`}
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {words.map((word, wIndex) => {
                const globalIndex = currentStart + wIndex;
                if (wIndex === words.length - 1) {
                  wordIndex = globalIndex + 1;
                }
                return (
                  <RevealWord
                    key={`${pIndex}-${wIndex}`}
                    word={word}
                    index={globalIndex}
                    totalWords={allWords.length}
                    scrollYProgress={scrollYProgress}
                  />
                );
              })}
            </p>
          );

          return element;
        })}
      </div>
    </section>
  );
};

export default ScrollTextReveal;
