import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
};

// Animation types
type AnimationType = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'blur';

// Animated section wrapper component
interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  animation?: AnimationType;
  duration?: number;
  scale?: number;
}

export const AnimatedSection = ({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up',
  animation = 'slide-up',
  duration = 0.7,
  scale = 0.95
}: AnimatedSectionProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });

  const getInitialStyles = (): React.CSSProperties => {
    switch (animation) {
      case 'fade':
        return { opacity: 0 };
      case 'slide-up':
        return { opacity: 0, transform: 'translateY(60px)' };
      case 'slide-down':
        return { opacity: 0, transform: 'translateY(-60px)' };
      case 'slide-left':
        return { opacity: 0, transform: 'translateX(60px)' };
      case 'slide-right':
        return { opacity: 0, transform: 'translateX(-60px)' };
      case 'scale':
        return { opacity: 0, transform: `scale(${scale})` };
      case 'blur':
        return { opacity: 0, filter: 'blur(10px)', transform: 'translateY(30px)' };
      default:
        // Legacy direction support
        switch (direction) {
          case 'up': return { opacity: 0, transform: 'translateY(60px)' };
          case 'down': return { opacity: 0, transform: 'translateY(-60px)' };
          case 'left': return { opacity: 0, transform: 'translateX(60px)' };
          case 'right': return { opacity: 0, transform: 'translateX(-60px)' };
          default: return { opacity: 0, transform: 'translateY(60px)' };
        }
    }
  };

  const getVisibleStyles = (): React.CSSProperties => {
    return {
      opacity: 1,
      transform: 'translate(0) scale(1)',
      filter: 'blur(0px)'
    };
  };

  const initialStyles = getInitialStyles();
  const visibleStyles = getVisibleStyles();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(isVisible ? visibleStyles : initialStyles),
        transition: `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform, filter'
      }}
    >
      {children}
    </div>
  );
};

// Staggered animation container for grids/lists
interface StaggeredContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: AnimationType;
}

export const StaggeredContainer = ({
  children,
  className = '',
  staggerDelay = 100,
  animation = 'slide-up'
}: StaggeredContainerProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children) ? children.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.98)',
            transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerDelay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerDelay}ms`,
            willChange: 'opacity, transform'
          }}
        >
          {child}
        </div>
      )) : children}
    </div>
  );
};

// Counter animation for stats
interface AnimatedCounterProps {
  value: string;
  className?: string;
  duration?: number;
}

export const AnimatedCounter = ({ value, className = '', duration = 2000 }: AnimatedCounterProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
  const [displayValue, setDisplayValue] = useState('0');
  
  useEffect(() => {
    if (!isVisible) return;
    
    // Extract numeric part and suffix
    const numericMatch = value.match(/[\d.]+/);
    const numericValue = numericMatch ? parseFloat(numericMatch[0]) : 0;
    const prefix = value.match(/^[^\d]*/)?.[0] || '';
    const suffix = value.replace(/^[^\d]*[\d.]+/, '');
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = numericValue * eased;
      
      // Format based on original value
      let formatted: string;
      if (value.includes('.')) {
        formatted = current.toFixed(1);
      } else {
        formatted = Math.floor(current).toString();
      }
      
      setDisplayValue(`${prefix}${formatted}${suffix}`);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isVisible, value, duration]);
  
  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
};
