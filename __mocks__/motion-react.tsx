/**
 * Global test mock for motion/react (Framer Motion).
 * Registered in vitest.config.mts resolve.alias so ALL tests get this automatically.
 * ADR-3: AnimatePresence renders children; motion.X is a Proxy returning plain HTML element.
 * Strips animation-only props (initial/animate/exit/transition/variants/whileHover/etc.)
 * that are not valid DOM attributes and would cause React warnings in jsdom.
 */
import React from 'react';

// Props to strip (animation-only, not valid DOM attrs)
const MOTION_ONLY_PROPS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileDrag',
  'whileInView',
  'drag',
  'dragConstraints',
  'dragElastic',
  'dragMomentum',
  'layout',
  'layoutId',
  'onAnimationStart',
  'onAnimationComplete',
  'onDragStart',
  'onDragEnd',
]);

function stripMotionProps(props: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!MOTION_ONLY_PROPS.has(key)) {
      clean[key] = value;
    }
  }
  return clean;
}

// Factory: returns a plain element-rendering component for a given HTML tag
function createMotionComponent(tag: string) {
  return function MotionElement({
    children,
    ...props
  }: { children?: React.ReactNode } & Record<string, unknown>) {
    return React.createElement(tag, stripMotionProps(props), children);
  };
}

// Proxy-based motion namespace: motion.div, motion.span, motion.button, etc.
export const motion = new Proxy(
  {},
  {
    get(_target, tag: string) {
      return createMotionComponent(tag);
    },
  },
);

// AnimatePresence: just renders its children (no animation in jsdom)
export function AnimatePresence({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

// useAnimation stub
export function useAnimation() {
  return {
    start: () => Promise.resolve(),
    stop: () => {},
    set: () => {},
  };
}

// useMotionValue stub
export function useMotionValue(initial: number) {
  return {
    get: () => initial,
    set: () => {},
    onChange: () => () => {},
  };
}

export default { motion, AnimatePresence, useAnimation, useMotionValue };
