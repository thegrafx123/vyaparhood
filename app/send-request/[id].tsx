import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../src/components/Buttons';
import { Hatched } from '../../src/components/Hatched';
import { BottomSheet } from '../../src/components/Layout';
import { getMember, useApp } from '../../src/state/AppStore';
import { BORDER, colors, fonts, s } from '../../src/theme/tokens';
import { firstName } from '../../src/utils/validation';

const MAX = 300;
const MIN = 10;

/** 20 · Send a connection request with a note (bottom sheet). */
export default function SendRequest() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useApp();
  const member = getMember(state, String(id));
  const [note, setNote] = useState('');

  if (!member) return null;
  const ok = note.trim().length >= MIN;

  return (
    <BottomSheet onDismiss={() => router.back()}>
      <View style={styles.row}>
        <Hatched radius={s(14)} iconSize={s(16)} style={{ width: s(46), height: s(46) }} />
        <View style={{ marginLeft: s(14) }}>
          <Text style={styles.small}>Sending a request to</Text>
          <Text style={styles.name}>{member.name}</Text>
        </View>
      </View>

      <View style={styles.box}>
        <TextInput
          value={note}
          onChangeText={(v) => setNote(v.slice(0, MAX))}
          placeholder={`Hi ${firstName(member.name)}, I run … and would love to …`}
          placeholderTextColor={colors.placeholder}
          multiline
          autoFocus
          maxLength={MAX}
          textAlignVertical="top"
          style={styles.input}
          accessibilityLabel="Your note"
        />
      </View>
      <Text style={styles.count}>
        {note.length} / {MAX}
      </Text>

      <PrimaryButton
        style={{ marginTop: s(12) }}
        label="Send Request"
        icon="send"
        disabled={!ok}
        onPress={() => {
          actions.sendRequest(member.id, note.trim());
          router.back();
        }}
      />
      <Text style={styles.fine}>They'll see your note before they approve. You can chat once they accept.</Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  small: { fontFamily: fonts.body, fontSize: s(14), color: colors.textMuted },
  name: { fontFamily: fonts.display, fontSize: s(19), color: colors.ink, marginTop: -s(2) },
  box: {
    marginTop: s(20),
    minHeight: s(104),
    borderRadius: s(22),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    paddingHorizontal: s(16),
    paddingVertical: s(12),
  },
  input: { fontFamily: fonts.body, fontSize: s(17), lineHeight: s(25), color: colors.ink, minHeight: s(80), padding: 0 },
  count: { alignSelf: 'flex-end', fontFamily: fonts.body, fontSize: s(13.5), color: '#BAC3D6', marginTop: s(6) },
  fine: {
    fontFamily: fonts.body,
    fontSize: s(13.5),
    lineHeight: s(19),
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: s(12),
  },
});
