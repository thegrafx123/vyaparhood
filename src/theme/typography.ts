import { StyleSheet } from 'react-native';
import { colors, fonts, s } from './tokens';

/** Text styles used across the designs. Sizes are design points. */
export const type = StyleSheet.create({
  /** Page titles on tab screens ("Discover", "Requests"). */
  pageTitle: { fontFamily: fonts.display, fontSize: s(26), lineHeight: s(34), color: colors.ink },
  /** Titles next to a back button ("Set up your profile"). */
  headerTitle: { fontFamily: fonts.display, fontSize: s(18), lineHeight: s(24), color: colors.ink },
  subtitle: { fontFamily: fonts.bodyMedium, fontSize: s(13.5), lineHeight: s(20), color: colors.text },
  label: { fontFamily: fonts.bodyBold, fontSize: s(12), lineHeight: s(16), color: colors.ink },
  helper: { fontFamily: fonts.body, fontSize: s(10.5), lineHeight: s(14), color: colors.muted },
  body: { fontFamily: fonts.bodyMedium, fontSize: s(13.5), lineHeight: s(21), color: colors.text },
  row: { fontFamily: fonts.bodySemi, fontSize: s(13.5), lineHeight: s(18), color: colors.ink },
  name: { fontFamily: fonts.displayBold, fontSize: s(14.5), lineHeight: s(20), color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: s(12), lineHeight: s(16), color: colors.text },
  small: { fontFamily: fonts.body, fontSize: s(11), lineHeight: s(15), color: colors.muted },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: s(11.5),
    letterSpacing: s(0.5),
    color: colors.muted,
    textTransform: 'uppercase',
  },
  link: { fontFamily: fonts.bodyBold, fontSize: s(12.5), color: colors.blue },
  error: { fontFamily: fonts.bodyMedium, fontSize: s(11.5), lineHeight: s(16), color: colors.error },
});
