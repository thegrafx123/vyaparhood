import { Dimensions } from 'react-native';

/**
 * The designs are iPhone frames exported at 3x (1170 × 2532 px),
 * i.e. a 390 × 844 pt canvas. Every size in this app is written in
 * design points and passed through `s()`, which scales it to the
 * current device width so layouts keep their proportions.
 */
const DESIGN_WIDTH = 390;
const screenWidth = Dimensions.get('window').width;
const factor = Math.min(Math.max(screenWidth, 320), 460) / DESIGN_WIDTH;

export const s = (n: number) => Math.round(n * factor * 10) / 10;

/** Colours sampled directly from the design files. */
export const colors = {
  ink: '#142340',
  blue: '#2F6FEA',
  lime: '#B6FF3C',
  green: '#7CC810',
  online: '#79BC0A',
  bg: '#F9FAFF',
  white: '#FFFFFF',

  text: '#5B6B85',
  textMuted: '#858FA2',
  placeholder: '#AEB6CB',
  divider: '#E4E9F4',

  blueSoft: '#E8EFFC',
  inputBg: '#EEF3FD',
  hatch: '#E8F0FC',
  hatchStripe: '#DCE6FB',
  hatchIcon: '#8FAEEA',
  hatchText: '#5A82CA',

  tealSoft: '#E4F4F2',
  teal: '#0A8B75',
  noteText: '#0D695C',
  orangeSoft: '#FCECE4',
  orange: '#B05028',
  peachIcon: '#F08A5D',
  yellowSoft: '#FCF4E4',
  yellow: '#A17206',
  blueTag: '#3C63AE',

  radar: '#DCE8FC',
  radarRing: '#C6D3F5',
  radarHalo: '#CFDDFB',

  shadowSoft: '#D5DBE8',
  dot: '#CBD5EA',
  alert: '#FF8B5E',
  star: '#FFC83D',
  danger: '#B75E26',
  error: '#D14343',

  navy: '#15213D',
  navyText: '#A9B3C8',
  splash: '#121A33',
  blobLime: '#C3FF5A',
  blobReview: '#ECF8E0',
  blobTeal: '#D8F0F0',
  heroSky: '#B4DBFD',
  backdrop: 'rgba(20, 35, 64, 0.42)',
};

/**
 * Font families (loaded in app/_layout.tsx). Custom fonts must not be
 * combined with `fontWeight` on Android, so weights are separate families.
 */
export const fonts = {
  display: 'Baloo2_800ExtraBold',
  displayBold: 'Baloo2_700Bold',
  displaySemi: 'Baloo2_600SemiBold',
  script: 'Caveat_700Bold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
};

/** Outline width used on every bordered element (5px @3x). */
export const BORDER = s(1.7);
/** Horizontal page padding on onboarding / form screens. */
export const H_PAD = s(26);
/** Horizontal page padding on the main tab screens. */
export const TAB_PAD = s(20);
/** Offset of the hard "sticker" shadow under buttons and cards. */
export const HARD_SHADOW = { x: s(5), y: s(6) };
export const SOFT_SHADOW = { x: s(4), y: s(5) };
