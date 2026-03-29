import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface WordProps {
  word: string;
  range: [number, number];
  scrollYProgress: MotionValue<number>;
}

const RevealWord = ({ word, range, scrollYProgress }: WordProps) => {
  const opacity = useTransform(scrollYProgress, range, [0.15, 1]);
  const isEmoji = /[✦✧⚡★●◆✶✹]/.test(word);

  return (
    <motion.span
      style={{ opacity }}
      className={`inline ${isEmoji ? "text-primary" : ""}`}
    >
      {word}{" "}
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
    offset: ["start start", "end start"],
  });

  const allWords = useMemo(() => {
    return paragraphs.flatMap((p) => p.split(" "));
  }, [paragraphs]);

  const totalWords = allWords.length;

  const getWordRange = (index: number): [number, number] => {
    const start = index / totalWords;
    const end = (index + 1) / totalWords;
    return [start, end];
  };

  // Fade out entire section at the very end of scroll
  const sectionOpacity = useTransform(scrollYProgress, [0.85, 1], [1, 0]);

  let globalIndex = 0;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: `${Math.max(150, totalWords * 3)}vh` }}
    >
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <motion.div
          className="relative max-w-4xl mx-auto px-6 sm:px-10 lg:px-16"
          style={{ opacity: sectionOpacity }}
        >
          {paragraphs.map((paragraph, pIndex) => {
            const words = paragraph.split(" ");

            return (
              <p
                key={pIndex}
                className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.35] tracking-[-0.01em] text-foreground ${
                  pIndex > 0 ? "mt-6 sm:mt-8" : ""
                }`}
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {words.map((word, wIndex) => {
                  const idx = globalIndex;
                  globalIndex++;
                  return (
                    <RevealWord
                      key={`${pIndex}-${wIndex}`}
                      word={word}
                      range={getWordRange(idx)}
                      scrollYProgress={scrollYProgress}
                    />
                  );
                })}
              </p>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default ScrollTextReveal;
