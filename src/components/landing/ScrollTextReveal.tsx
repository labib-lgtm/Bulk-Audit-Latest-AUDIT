import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface WordProps {
  word: string;
  index: number;
  totalWords: number;
  scrollYProgress: any;
  hasEmoji?: boolean;
}

const RevealWord = ({ word, index, totalWords, scrollYProgress }: WordProps) => {
  const start = index / totalWords;
  const end = start + 1 / totalWords;

  const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
  const blur = useTransform(scrollYProgress, [start, end], [3, 0]);

  return (
    <motion.span
      style={{ opacity, filter: blur as any }}
      className="inline-block mr-[0.3em]"
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
    offset: ["start 0.8", "end 0.2"],
  });

  const allWords = paragraphs.flatMap((p, pi) => {
    const words = p.split(" ").map((w) => ({ word: w, paragraphIndex: pi }));
    return words;
  });

  let wordIndex = 0;

  return (
    <section
      ref={containerRef}
      className="relative min-h-[120vh] flex items-center justify-center px-4 sm:px-6"
      style={{
        background:
          "radial-gradient(ellipse at 60% 50%, hsl(var(--primary) / 0.25) 0%, hsl(var(--background)) 70%)",
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-5xl mx-auto">
        {paragraphs.map((paragraph, pIndex) => {
          const words = paragraph.split(" ");
          const currentStart = wordIndex;

          return (
            <p
              key={pIndex}
              className={`text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-medium leading-[1.3] tracking-tight ${
                pIndex > 0 ? "mt-8 sm:mt-12" : ""
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
        })}
      </div>
    </section>
  );
};

export default ScrollTextReveal;
