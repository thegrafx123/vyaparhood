import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { friendlyError } from '../../src/api/errors';
import { useBlock, useMember, useReport } from '../../src/api/hooks';
import { ReportReason } from '../../src/api/types';
import { FadeUp } from '../../src/motion';
import { colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { CtaButton, PillButton } from '../../src/ui/Buttons';
import { Field, Helper, Radio } from '../../src/ui/Form';
import { HeaderRow } from '../../src/ui/Header';
import { KeyboardArea, Screen } from '../../src/ui/Screen';

const REASONS: { id: ReportReason; label: string }[] = [
  { id: 'fake', label: 'Fake profile or scam' },
  { id: 'inappropriate', label: 'Inappropriate messages' },
  { id: 'spam', label: 'Spam or solicitation' },
  { id: 'harassment', label: 'Harassment or abuse' },
  { id: 'other', label: 'Something else' },
];

/** 23 · Report or block a member. */
export default function ReportBlock() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: m } = useMember(id);
  const report = useReport();
  const block = useBlock();
  const [reason, setReason] = useState<ReportReason>('fake');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const name = m?.full_name ?? 'this member';

  const submit = () => {
    if (!id) return;
    setError(null);
    report.mutate(
      { memberId: id, reason, details: details.trim() },
      {
        onSuccess: () =>
          Alert.alert('Report sent', 'Thanks for telling us. Our safety team reviews every report within 24 hours.', [
            { text: 'OK', onPress: () => router.back() },
          ]),
        onError: (e) => setError(friendlyError(e)),
      },
    );
  };

  const confirmBlock = () => {
    if (!id) return;
    Alert.alert(`Block ${name}?`, 'They will disappear from your Discover feed, requests and chats. They are not told.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () =>
          block.mutate(id, {
            onSuccess: () => router.replace('/discover'),
            onError: (e) => setError(friendlyError(e)),
          }),
      },
    ]);
  };

  return (
    <Screen texture>
      <KeyboardArea>
        <HeaderRow title="Report or block" />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: s(18), paddingBottom: s(40) }}>
          <FadeUp delay={60}>
            <Text style={[t.body, { fontSize: s(13) }]}>
              Your report is confidential. Our safety team reviews every submission within 24 hours.
            </Text>
          </FadeUp>

          <FadeUp delay={120} style={{ marginTop: s(18) }}>
            <View
              accessibilityRole="radiogroup"
              style={{
                backgroundColor: colors.white,
                borderWidth: s(2.5),
                borderColor: colors.ink,
                borderRadius: s(18),
                paddingHorizontal: s(16),
                paddingVertical: s(4),
                boxShadow: `${s(4)}px ${s(5)}px 0px rgba(22,35,63,0.12)`,
              }}
            >
              {REASONS.map((r, i) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: reason === r.id }}
                  onPress={() => setReason(r.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: s(12),
                    paddingVertical: s(13),
                    paddingHorizontal: s(4),
                    borderBottomWidth: i < REASONS.length - 1 ? s(2) : 0,
                    borderBottomColor: colors.line,
                  }}
                >
                  <Radio selected={reason === r.id} />
                  <Text style={t.row}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
          </FadeUp>

          <FadeUp delay={200} style={{ marginTop: s(18) }}>
            <Field
              label="Add details"
              optional="(optional)"
              value={details}
              onChangeText={setDetails}
              placeholder="Tell us what happened..."
              multiline
              height={s(70)}
              maxLength={1000}
            />
          </FadeUp>
          {error ? <Helper error>{error}</Helper> : null}

          <FadeUp delay={260} style={{ marginTop: s(22) }}>
            <CtaButton label="Submit report" circle="none" size="md" onPress={submit} loading={report.isPending} />
            <PillButton label="Block this member" tone="danger" size="lg" onPress={confirmBlock} loading={block.isPending} style={{ marginTop: s(10) }} />
            <Text style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: s(11), lineHeight: s(15), color: colors.muted, marginTop: s(12) }}>
              Blocking also removes this member from your Discover feed and chats.
            </Text>
          </FadeUp>
        </ScrollView>
      </KeyboardArea>
    </Screen>
  );
}
