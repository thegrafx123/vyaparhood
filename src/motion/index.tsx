import React, { useEffect, useState } from 'react';
import { Pressable, PressableProps, StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  css,
  cubicBezier,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { s } from '../theme/tokens';

/**
 * Every animation from the design artifact, as reusable components.
 * Names, timings and curves match the design's CSS keyframes one to one
 * (vhFadeUp, vhCtaBreathe, vhKenBurns, vhDraw, vhWiggle, …).
 *
 * If the phone has "Reduce motion" turned on, everything renders in its
 * final position without moving.
 */

/** cubic-bezier(.2,.8,.2,1) — the design's main easing. */
export const EASE = cubicBezier(0.2, 0.8, 0.2, 1);
/** cubic-bezier(.3,1.4,.6,1) — overshooting pop used for pins. */
export const EASE_PIN = cubicBezier(0.3, 1.4, 0.6, 1);

/**
 * The design's entrance (vhFadeUp) only slides up. Set this to true to
 * also fade elements in while they slide.
 */
export const ENTRANCE_FADE = false;

type Style = StyleProp<ViewStyle>;
type Children = { children?: React.ReactNode; style?: Style; pointerEvents?: 'box-none' | 'none' | 'auto' };

/* ------------------------------------------------------------------ */
/* Keyframes (created once, reused)                                    */
/* ------------------------------------------------------------------ */

const cache = new Map<string, ReturnType<typeof css.keyframes>>();
function memo(key: string, make: () => ReturnType<typeof css.keyframes>) {
  let k = cache.get(key);
  if (!k) {
    k = make();
    cache.set(key, k);
  }
  return k;
}

const fadeUpKf = (d: number) =>
  memo(`fadeUp${d}`, () =>
    css.keyframes({
      from: { transform: [{ translateY: s(d) }], ...(ENTRANCE_FADE ? { opacity: 0 } : null) },
      to: { transform: [{ translateY: 0 }], ...(ENTRANCE_FADE ? { opacity: 1 } : null) },
    }),
  );

const breatheKf = css.keyframes({
  '0%': { transform: [{ scale: 1 }] },
  '50%': { transform: [{ scale: 1.02 }] },
  '100%': { transform: [{ scale: 1 }] },
});

const kenBurnsKf = (from: number) =>
  memo(`ken${from}`, () =>
    css.keyframes({ from: { transform: [{ scale: from }] }, to: { transform: [{ scale: 1 }] } }),
  );

const wiggleKf = css.keyframes({
  '0%': { transform: [{ rotate: '0deg' }] },
  '25%': { transform: [{ rotate: '-8deg' }] },
  '75%': { transform: [{ rotate: '8deg' }] },
  '100%': { transform: [{ rotate: '0deg' }] },
});

const floatKf = (d: number) =>
  memo(`float${d}`, () =>
    css.keyframes({
      '0%': { transform: [{ translateY: 0 }] },
      '50%': { transform: [{ translateY: -s(d) }] },
      '100%': { transform: [{ translateY: 0 }] },
    }),
  );

const popKf = (from: number, peak: number) =>
  memo(`pop${from}-${peak}`, () =>
    css.keyframes({
      '0%': { transform: [{ scale: from }] },
      '70%': { transform: [{ scale: peak }] },
      '100%': { transform: [{ scale: 1 }] },
    }),
  );

const pinPopKf = (from: number, dy: number) =>
  memo(`pin${from}${dy}`, () =>
    css.keyframes({
      '0%': { transform: [{ scale: from }, { translateY: s(dy) }] },
      '70%': { transform: [{ scale: 1.08 }, { translateY: 0 }] },
      '100%': { transform: [{ scale: 1 }, { translateY: 0 }] },
    }),
  );

const pulseKf = css.keyframes({
  '0%': { transform: [{ scale: 1 }] },
  '50%': { transform: [{ scale: 1.06 }] },
  '100%': { transform: [{ scale: 1 }] },
});

const pulseDotKf = css.keyframes({
  '0%': { transform: [{ scale: 1 }], opacity: 1 },
  '50%': { transform: [{ scale: 1.3 }], opacity: 0.55 },
  '100%': { transform: [{ scale: 1 }], opacity: 1 },
});

const pingKf = (to: number) =>
  memo(`ping${to}`, () =>
    css.keyframes({
      from: { transform: [{ scale: 1 }], opacity: 0.55 },
      to: { transform: [{ scale: to }], opacity: 0 },
    }),
  );

const ringPulseKf = css.keyframes({
  from: { transform: [{ scale: 0.7 }], opacity: 0.9 },
  to: { transform: [{ scale: 1 }], opacity: 1 },
});

const haloKf = (to: number) =>
  memo(`halo${to}`, () =>
    css.keyframes({
      '0%': { transform: [{ scale: 1 }], opacity: 0.16 },
      '50%': { transform: [{ scale: to }], opacity: 0.08 },
      '100%': { transform: [{ scale: 1 }], opacity: 0.16 },
    }),
  );

const sheetInKf = css.keyframes({
  from: { transform: [{ scale: 0.85 }] },
  to: { transform: [{ scale: 1 }] },
});

const sheetUpKf = css.keyframes({
  from: { transform: [{ translateY: s(56) }] },
  to: { transform: [{ translateY: 0 }] },
});

const fadeToKf = (to: number) =>
  memo(`fadeTo${to}`, () => css.keyframes({ from: { opacity: 0 }, to: { opacity: to } }));

const settleKf = (from: number) =>
  memo(`settle${from}`, () =>
    css.keyframes({ from: { transform: [{ scale: from }] }, to: { transform: [{ scale: 1 }] } }),
  );

const slideXKf = (dx: number) =>
  memo(`slideX${dx}`, () =>
    css.keyframes({ from: { transform: [{ translateX: s(dx) }] }, to: { transform: [{ translateX: 0 }] } }),
  );

const starPopKf = css.keyframes({
  '0%': { transform: [{ scale: 0.4 }, { rotate: '-15deg' }] },
  '65%': { transform: [{ scale: 1.2 }, { rotate: '6deg' }] },
  '100%': { transform: [{ scale: 1 }, { rotate: '0deg' }] },
});

/* ------------------------------------------------------------------ */
/* Building block                                                      */
/* ------------------------------------------------------------------ */

type Anim = {
  name: ReturnType<typeof css.keyframes>;
  duration: number;
  delay?: number;
  easing?: typeof EASE | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  loop?: boolean;
};

function animStyle(a: Anim) {
  return {
    animationName: a.name,
    animationDuration: a.duration,
    animationDelay: a.delay ?? 0,
    animationTimingFunction: a.easing ?? EASE,
    animationIterationCount: a.loop ? ('infinite' as const) : 1,
    animationFillMode: 'both' as const,
  };
}

function Animate({ anim, style, children, pointerEvents }: Children & { anim: Anim }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View pointerEvents={pointerEvents} style={[style, reduced ? null : animStyle(anim)]}>
      {children}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Entrances                                                           */
/* ------------------------------------------------------------------ */

/** vhFadeUp — slides content up into place. Delays are in ms. */
export function FadeUp({
  delay = 0,
  duration = 550,
  distance = 28,
  ...rest
}: Children & { delay?: number; duration?: number; distance?: number }) {
  return <Animate anim={{ name: fadeUpKf(distance), duration, delay }} {...rest} />;
}

/** vhPop / vhCheckPop — scales up with a small overshoot. */
export function Pop({
  delay = 0,
  duration = 400,
  from = 0.4,
  peak = 1.12,
  ...rest
}: Children & { delay?: number; duration?: number; from?: number; peak?: number }) {
  return <Animate anim={{ name: popKf(from, peak), duration, delay }} {...rest} />;
}

/** vhPinPop — map pins and the city pill drop in with a bounce. */
export function PinPop({
  delay = 0,
  from = 0.5,
  dy = -8,
  ...rest
}: Children & { delay?: number; from?: number; dy?: number }) {
  return <Animate anim={{ name: pinPopKf(from, dy), duration: 500, delay, easing: EASE_PIN }} {...rest} />;
}

/** vhSheetIn — permission dialogs scale in. */
export function SheetIn({ delay = 0, ...rest }: Children & { delay?: number }) {
  return <Animate anim={{ name: sheetInKf, duration: 350, delay }} {...rest} />;
}

/** vhSheetUp — bottom sheets slide up. */
export function SheetUp({ delay = 0, ...rest }: Children & { delay?: number }) {
  return <Animate anim={{ name: sheetUpKf, duration: 450, delay }} {...rest} />;
}

/** vhFadeIn — backdrops fade to a given opacity. */
export function FadeTo({ to = 1, duration = 400, ...rest }: Children & { to?: number; duration?: number }) {
  return <Animate anim={{ name: fadeToKf(to), duration, easing: 'ease' }} {...rest} />;
}

/** vhBubbleInL / vhBubbleInR — chat bubbles slide in from their side. */
export function BubbleIn({ side, delay = 0, ...rest }: Children & { side: 'left' | 'right'; delay?: number }) {
  return <Animate anim={{ name: slideXKf(side === 'left' ? -10 : 10), duration: 400, delay }} {...rest} />;
}

/** vhStarPop — rating stars spin-pop in. */
export function StarPop({ delay = 0, ...rest }: Children & { delay?: number }) {
  return <Animate anim={{ name: starPopKf, duration: 400, delay }} {...rest} />;
}

/** vhToggleSettle — switches settle into place. */
export function Settle({ delay = 0, from = 1.15, ...rest }: Children & { delay?: number; from?: number }) {
  return <Animate anim={{ name: settleKf(from), duration: 300, delay }} {...rest} />;
}

/** vhKenBurns — slow zoom-out on hero photos. */
export function KenBurns({
  from = 1.06,
  duration = 8000,
  origin = '50% 20%',
  style,
  children,
}: Children & { from?: number; duration?: number; origin?: string }) {
  return (
    <Animate
      anim={{ name: kenBurnsKf(from), duration, easing: 'ease-out' }}
      style={[{ transformOrigin: origin }, style]}
    >
      {children}
    </Animate>
  );
}

/* ------------------------------------------------------------------ */
/* Loops                                                               */
/* ------------------------------------------------------------------ */

/** vhCtaBreathe — the main button gently grows and shrinks. */
export function Breathe(props: Children) {
  return <Animate anim={{ name: breatheKf, duration: 2600, easing: 'ease-in-out', loop: true }} {...props} />;
}

/** vhWiggle — small icons rock side to side. */
export function Wiggle({ delay = 0, ...rest }: Children & { delay?: number }) {
  return <Animate anim={{ name: wiggleKf, duration: 3200, delay, easing: 'ease-in-out', loop: true }} {...rest} />;
}

/**
 * vhFloat — stickers bob up and down. `enterDelay` plays the vhFadeUp
 * entrance first (as the design chains both on the same element).
 */
export function Float({
  distance = 7,
  duration = 3400,
  delay = 0,
  enterDelay,
  style,
  children,
}: Children & { distance?: number; duration?: number; delay?: number; enterDelay?: number }) {
  const inner = (
    <Animate anim={{ name: floatKf(distance), duration, delay, easing: 'ease-in-out', loop: true }}>{children}</Animate>
  );
  if (enterDelay === undefined) return <View style={style}>{inner}</View>;
  return (
    <FadeUp delay={enterDelay} duration={500} style={style}>
      {inner}
    </FadeUp>
  );
}

/** vhPulse — the logo on the location screen. */
export function Pulse(props: Children) {
  return <Animate anim={{ name: pulseKf, duration: 2200, easing: 'ease-in-out', loop: true }} {...props} />;
}

/** vhPulseDot — small status dot. */
export function PulseDot(props: Children) {
  return <Animate anim={{ name: pulseDotKf, duration: 1800, easing: 'ease-in-out', loop: true }} {...props} />;
}

/** vhRingPulse — radar ring that keeps expanding from the centre. */
export function RingPulse(props: Children) {
  return <Animate anim={{ name: ringPulseKf, duration: 2600, easing: 'ease-out', loop: true }} {...props} />;
}

/**
 * vhPing — a ring that ripples out from a dot (the unread bell dot).
 * Wrap the dot; `size` is the dot's outer size.
 */
export function Ping({
  size,
  spread = s(7),
  color,
  style,
  children,
}: Children & { size: number; spread?: number; color: string }) {
  const reduced = useReducedMotion();
  return (
    <View style={style}>
      {!reduced && (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color },
            animStyle({ name: pingKf((size + spread * 2) / size), duration: 1800, easing: 'ease-out', loop: true }),
          ]}
        />
      )}
      {children}
    </View>
  );
}

/** vhCenterPulse — the soft halo breathing around "you" on the radar. */
export function Halo({
  size,
  grow = 1.3,
  color,
  style,
}: { size: number; grow?: number; color: string; style?: Style }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: 0.16 },
        style,
        reduced ? null : animStyle({ name: haloKf(grow), duration: 2200, easing: 'ease-in-out', loop: true }),
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* vhDraw — hand-drawn underline that draws itself                     */
/* ------------------------------------------------------------------ */

const AnimatedPath = Animated.createAnimatedComponent(Path);
const WAVE = 'M2 8c8-8 16 6 24-2s16-6 24 2 16 6 24-2 16-6 24 2';
const WAVE_LENGTH = 130;

export function Squiggle({
  width,
  height = s(10),
  color,
  delay = 550,
  animate = true,
}: {
  width: number;
  height?: number;
  color: string;
  delay?: number;
  /** false = already drawn (the design leaves some underlines static). */
  animate?: boolean;
}) {
  const reduced = useReducedMotion();
  const still = reduced || !animate;
  const offset = useSharedValue(still ? 0 : WAVE_LENGTH);

  useEffect(() => {
    if (still) return;
    offset.value = withDelay(delay, withTiming(0, { duration: 600, easing: Easing.bezier(0, 0, 0.58, 1) }));
  }, [delay, offset, still]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <Svg width={width} height={height} viewBox="0 0 120 12" preserveAspectRatio="none">
      <AnimatedPath
        d={WAVE}
        stroke={color}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={[WAVE_LENGTH, WAVE_LENGTH]}
        animatedProps={props}
      />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Press feedback                                                      */
/* ------------------------------------------------------------------ */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * `button:active, a:active { transform: scale(0.97) }` from the design.
 * A Pressable that shrinks slightly while held. `style` sizes the
 * pressable itself, so flex / width work as on any View.
 */
export function PressScale({
  scaleTo = 0.97,
  style,
  children,
  ...press
}: Omit<PressableProps, 'style' | 'children'> & { scaleTo?: number; style?: Style; children?: React.ReactNode }) {
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - scaleTo) * pressed.value }],
  }));
  return (
    <AnimatedPressable
      {...press}
      style={[style, animated]}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 100 });
        press.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: 120 });
        press.onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}

/** true while a Pressable is held — for the CTA's shadow swap. */
export function usePressed() {
  const [pressed, setPressed] = useState(false);
  const offset = useSharedValue(0);
  // s() is a plain JS function, so it can't run inside the UI-thread worklet.
  const dx = s(2);
  const dy = s(3);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: dx * offset.value }, { translateY: dy * offset.value }],
  }));
  return {
    pressed,
    style,
    handlers: {
      onPressIn: () => {
        setPressed(true);
        offset.value = withTiming(1, { duration: 120 });
      },
      onPressOut: () => {
        setPressed(false);
        offset.value = withTiming(0, { duration: 120 });
      },
    },
  };
}
