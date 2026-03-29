import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface WordProps {
  word: string;
  range: [number, number];
  scrollYProgress: MotionValue<number>;
}

const RevealWord = ({ word, range, scrollYProgress }: WordProps) => {
  const opacity = useTransform(scrollYProgress, range, [0.12, 1]);
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
    offset: ["start 0.35", "end start"],
  });

  const allWords = useMemo(() => {
    return paragraphs.flatMap((p) => p.split(" "));
  }, [paragraphs]);

  const totalWords = allWords.length;

  const getWordRange = (index: number): [number, number] => {
    const wordSpan = 0.08;
    const usableRange = 1 - wordSpan;
    const start = (index / (totalWords - 1)) * usableRange;
    const end = start + wordSpan;
    return [start, end];
  };

  let globalIndex = 0;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: "200vh" }}
    >
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">

        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
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
        </div>
      </div>
    </div>
  );
};

export default ScrollTextReveal;
