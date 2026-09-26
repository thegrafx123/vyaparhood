import { StyleSheet } from 'react-native';
import { colors, fonts, s } from './tokens';

export const type = StyleSheet.create({
  /** Big onboarding / form headings ("Find the right people in your city"). */
  h1: { fontFamily: fonts.display, fontSize: s(30), lineHeight: s(37), color: colors.ink },
  /** Tab screen titles ("Discover", "Requests"). */
  pageTitle: { fontFamily: fonts.display, fontSize: s(31), lineHeight: s(38), color: colors.ink },
  /** Header titles next to a back button ("Set up your profile"). */
  headerTitle: { fontFamily: fonts.display, fontSize: s(21), lineHeight: s(28), color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: s(15.5), lineHeight: s(22.5), color: colors.text },
  label: { fontFamily: fonts.bodyBold, fontSize: s(15), lineHeight: s(20), color: colors.ink },
  helper: { fontFamily: fonts.body, fontSize: s(12.5), lineHeight: s(17), color: colors.textMuted },
  body: { fontFamily: fonts.body, fontSize: s(15.5), lineHeight: s(23), color: colors.text },
  bodyInk: { fontFamily: fonts.body, fontSize: s(15.5), lineHeight: s(22), color: colors.ink },
  name: { fontFamily: fonts.display, fontSize: s(17.5), lineHeight: s(23), color: colors.ink },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: s(13),
    letterSpacing: s(0.8),
    color: colors.textMuted,
  },
  link: { fontFamily: fonts.displayBold, fontSize: s(16), color: colors.blue },
  error: { fontFamily: fonts.bodyMedium, fontSize: s(12.5), lineHeight: s(17), color: colors.error },
});
