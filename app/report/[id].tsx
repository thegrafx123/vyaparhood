import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OutlineButton, PrimaryButton } from '../../src/components/Buttons';
import { Radio, TextField } from '../../src/components/Controls';
import { Divider, HeaderRow, KeyboardArea, Screen, SoftCard } from '../../src/components/Layout';
import { friendlyError } from '../../src/api/errors';
import { useBlock, useMember, useReport } from '../../src/api/hooks';
import { ReportReason } from '../../src/api/types';
import { colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

const REASONS: { id: ReportReason; label: string }[] = [
  { id: 'fake', label: 'Fake profile or scam' },
  { id: 'inappropriate', label: 'Inappropriate messages' },
  { id: 'spam', label: 'Spam or solicitation' },
  { id: 'harassment', label: 'Harassment or abuse' },
  { id: 'other', label: 'Something else' },
];

/** 25 · Report or block. */
export default function ReportOrBlock() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member } = useMember(String(id));
  const report = useReport();
  const blockMember = useBlock();
  const [reason, setReason] = useState(0);
  const [details, setDetails] = useState('');

  if (!member) return null;

  const leaveToDiscover = () => {
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/discover');
  };

  const submit = () =>
    report.mutate(
      { memberId: member.id, reason: REASONS[reason].id, details: details.trim() },
      {
        onSuccess: () =>
          Alert.alert('Report submitted', 'Our safety team will review it within 24 hours. Thank you for flagging it.', [
            { text: 'OK', onPress: () => router.back() },
          ]),
        onError: (e) => Alert.alert("Couldn't submit", friendlyError(e)),
      },
    );

  const block = () =>
    Alert.alert(
      `Block ${member.full_name}?`,
      "They won't be able to see you or message you, and they'll be removed from your Discover feed and chats.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () =>
            blockMember.mutate(member.id, {
              onSuccess: leaveToDiscover,
              onError: (e) => Alert.alert("Couldn't block", friendlyError(e)),
            }),
        },
      ],
    );

  return (
    <Screen>
      <KeyboardArea>
        <HeaderRow title="Report or block" />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[t.subtitle, { fontSize: s(16.5), lineHeight: s(24) }]}>
            Your report is confidential. Our safety team reviews every submission within 24 hours.
          </Text>

          <SoftCard radius={s(26)} style={{ marginTop: s(20) }} innerStyle={{ paddingHorizontal: s(20), paddingVertical: s(4) }}>
            {REASONS.map((r, i) => (
              <View key={r.id}>
                {i > 0 && <Divider />}
                <Pressable
                  style={styles.row}
                  onPress={() => setReason(i)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: reason === i }}
                >
                  <Radio selected={reason === i} />
                  <Text style={styles.reason}>{r.label}</Text>
                </Pressable>
              </View>
            ))}
          </SoftCard>

          <TextField
            containerStyle={{ marginTop: s(22) }}
            label="Add details"
            optionalHint="(optional)"
            placeholder="Tell us what happened..."
            value={details}
            onChangeText={setDetails}
            multiline
            height={s(104)}
            maxLength={1000}
          />

          <PrimaryButton style={{ marginTop: s(24) }} label="Submit report" circle="none" onPress={submit} loading={report.isPending} />
          <OutlineButton
            style={{ marginTop: s(16) }}
            height={s(58)}
            label="Block this member"
            textColor={colors.danger}
            borderColor={colors.danger}
            borderWidth={s(2.2)}
            onPress={block}
          />
          <Text style={styles.fine}>Blocking also removes this member from your Discover feed and chats.</Text>
        </ScrollView>
      </KeyboardArea>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: H_PAD, paddingTop: s(22), paddingBottom: s(40) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: s(15) },
  reason: { fontFamily: fonts.bodyBold, fontSize: s(16.5), color: colors.ink, marginLeft: s(16) },
  fine: {
    fontFamily: fonts.body,
    fontSize: s(13.5),
    lineHeight: s(19),
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: s(14),
  },
});
