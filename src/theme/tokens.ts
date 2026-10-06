import { Dimensions } from 'react-native';

/**
 * The designs are 390 × 844 pt phone frames. Every size in this app is
 * written in design points and passed through `s()`, which scales it to
 * the current device width so layouts keep their proportions.
 */
const DESIGN_WIDTH = 390;
const screenWidth = Dimensions.get('window').width;
const factor = Math.min(Math.max(screenWidth, 320), 460) / DESIGN_WIDTH;

export const s = (n: number) => Math.round(n * factor * 10) / 10;

/** Colours taken from the design files. */
export const colors = {
  ink: '#16233F',
  blue: '#2F6FEA',
  lime: '#B6FF3C',
  bg: '#F8FAFF',
  white: '#FFFFFF',

  text: '#5A6B8C',
  muted: '#8A97B5',
  placeholder: '#B7C1D9',
  line: '#E3ECFF',
  lineSoft: '#E7ECF7',
  dot: '#C9D6EE',
  handle: '#D7E0F2',

  blueSoft: '#EAF2FF',
  blueSoft2: '#E9EFFC',
  inputBg: '#F4F7FF',

  teal: '#1A9385',
  tealSoft: '#E6F7F4',
  tealBlob: '#22B8A6',
  orange: '#C85A32',
  orangeSoft: '#FFEFE7',
  peach: '#FF8A5B',
  yellow: '#B8790A',
  yellowSoft: '#FFF6E3',
  green: '#7FCB13',
  greenText: '#5A8C3A',
  star: '#FFC93C',

  navyText: '#8FA0C7',
  splash: '#16233F',
  alertBg: 'rgba(247,247,250,0.98)',
  alertText: '#6B7280',
  alertLine: 'rgba(0,0,0,0.15)',
  dim: 'rgba(15,20,35,0.5)',
  backdrop: 'rgba(22,35,63,0.55)',
  error: '#D14343',
};

/**
 * Font families (loaded in app/_layout.tsx). Custom fonts must not be
 * combined with `fontWeight` on Android, so each weight is its own family.
 */
export const fonts = {
  display: 'Baloo2_800ExtraBold',
  displayBold: 'Baloo2_700Bold',
  script: 'Caveat_700Bold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemi: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  bodyHeavy: 'DMSans_800ExtraBold',
  system: undefined as string | undefined,
};

/** Page padding on onboarding / form screens. */
export const H_PAD = s(26);
/** Page padding on the main tab screens. */
export const TAB_PAD = s(20);

/** Hard "sticker" shadows from the design (box-shadow strings). */
export const shadow = {
  cta: `${s(5)}px ${s(6)}px 0px ${colors.ink}`,
  ctaPressed: `${s(2)}px ${s(3)}px 0px ${colors.ink}`,
  card: `${s(4)}px ${s(5)}px 0px ${colors.ink}`,
  soft: `${s(4)}px ${s(5)}px 0px rgba(22,35,63,0.15)`,
  softer: `${s(4)}px ${s(5)}px 0px rgba(22,35,63,0.12)`,
  chip: `${s(3)}px ${s(4)}px 0px ${colors.ink}`,
  deep: `${s(5)}px ${s(6)}px 0px rgba(22,35,63,0.2)`,
  sheetTop: `0px ${-s(8)}px ${s(24)}px rgba(22,35,63,0.08)`,
  alert: `0px ${s(12)}px ${s(34)}px rgba(0,0,0,0.32)`,
};
