'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'fade-in' | 'scale-up';
  delay?: number;
  duration?: number;
  className?: string;
}

export default function ScrollAnimation({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  className = '',
}: ScrollAnimationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [delay]);

  const animationClasses = {
    'fade-up': {
      initial: 'opacity-0 translate-y-12',
      animate: 'opacity-100 translate-y-0',
    },
    'fade-down': {
      initial: 'opacity-0 -translate-y-12',
      animate: 'opacity-100 translate-y-0',
    },
    'fade-left': {
      initial: 'opacity-0 translate-x-12',
      animate: 'opacity-100 translate-x-0',
    },
    'fade-right': {
      initial: 'opacity-0 -translate-x-12',
      animate: 'opacity-100 translate-x-0',
    },
    'fade-in': {
      initial: 'opacity-0',
      animate: 'opacity-100',
    },
    'scale-up': {
      initial: 'opacity-0 scale-95',
      animate: 'opacity-100 scale-100',
    },
  };

  const { initial, animate } = animationClasses[animation];

  return (
    <div
      ref={ref}
      className={`${initial} ${isVisible ? animate : ''} transition-all ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
}

// Hook personalizado para scroll animations
export function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, rootMargin: '50px' }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
}
