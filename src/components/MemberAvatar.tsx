import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useSignedUrl } from '../api/hooks';
import { colors } from '../theme/tokens';
import { Avatar } from './Hatched';

/** Avatar that loads a member's private photo through a short-lived link. */
export function MemberAvatar({
  path,
  size,
  radius,
  verified,
  online,
  dashed = colors.blue,
  style,
}: {
  path: string | null | undefined;
  size: number;
  radius?: number;
  verified?: boolean;
  online?: boolean;
  dashed?: string | false;
  style?: StyleProp<ViewStyle>;
}) {
  const url = useSignedUrl('avatars', path);
  return <Avatar size={size} radius={radius} uri={url ?? null} verified={verified} online={online} dashed={dashed} style={style} />;
}
