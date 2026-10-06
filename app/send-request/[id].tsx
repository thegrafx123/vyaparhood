import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { friendlyError } from '../../src/api/errors';
import { useMember, useSendRequest } from '../../src/api/hooks';
import { FadeUp } from '../../src/motion';
import { colors, fonts, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { MemberPhoto } from '../../src/ui/Avatar';
import { CtaButton } from '../../src/ui/Buttons';
import { Loading } from '../../src/ui/Cards';
import { Helper } from '../../src/ui/Form';
import { BottomSheet } from '../../src/ui/Sheet';

const MIN = 10;
const MAX = 300;

/** 18 · Send request — a short note travels with every request. */
export default function SendRequest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: m, isLoading } = useMember(id);
  const send = useSendRequest();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const first = m?.full_name.split(' ')[0] ?? '';
  const length = note.trim().length;

  const submit = () => {
    if (!m || length < MIN) {
      setError(`Write at least ${MIN} characters so they know why you're reaching out.`);
      return;
    }
    setError(null);
    send.mutate(
      { memberId: m.id, note: note.trim() },
      {
        onSuccess: () => {
          setSent(true);
          setTimeout(() => router.back(), 900);
        },
        onError: (e) => setError(friendlyError(e)),
      },
    );
  };

  const blocked = m && m.relation !== 'none';

  return (
    <BottomSheet onDismiss={() => router.back()}>
      {isLoading || !m ? (
        <Loading style={{ flex: 0, height: s(200) }} />
      ) : (
        <>
          <FadeUp delay={150} style={{ flexDirection: 'row', alignItems: 'center', gap: s(12) }}>
            <MemberPhoto path={m.photo_path} size={s(46)} radius={s(14)} />
            <View>
              <Text style={{ fontFamily: fonts.body, fontSize: s(11.5), color: colors.muted }}>Sending a request to</Text>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: s(16), color: colors.ink }}>{m.full_name}</Text>
            </View>
          </FadeUp>

          {blocked ? (
            <FadeUp delay={220} style={{ marginTop: s(18) }}>
              <Text style={t.body}>
                {m.relation === 'connected'
                  ? `You're already connected with ${first}. Say hi in Chats.`
                  : m.relation === 'outgoing'
                    ? `Your request to ${first} is waiting for a reply.`
                    : m.relation === 'incoming'
                      ? `${first} already sent you a request — check your Requests tab.`
                      : 'You can’t send a request to this member.'}
              </Text>
            </FadeUp>
          ) : (
            <>
              <FadeUp delay={220} style={{ marginTop: s(18) }}>
                <View
                  style={{
                    backgroundColor: colors.white,
                    borderWidth: s(2.5),
                    borderColor: error ? colors.error : colors.ink,
                    borderRadius: s(18),
                    paddingHorizontal: s(16),
                    paddingVertical: s(12),
                    minHeight: s(100),
                  }}
                >
                  <TextInput
                    value={note}
                    onChangeText={(v) => {
                      setNote(v.slice(0, MAX));
                      if (error) setError(null);
                    }}
                    multiline
                    autoFocus
                    maxLength={MAX}
                    placeholder={`Hi ${first}, I run … and would love to …`}
                    placeholderTextColor={colors.placeholder}
                    textAlignVertical="top"
                    accessibilityLabel="Your note"
                    style={{ fontFamily: fonts.bodyMedium, fontSize: s(14), lineHeight: s(21), color: colors.ink, minHeight: s(76), padding: 0 }}
                  />
                </View>
                <Text style={{ textAlign: 'right', fontFamily: fonts.body, fontSize: s(11.5), color: colors.placeholder, marginTop: s(6) }}>
                  {length} / {MAX}
                </Text>
                {error ? <Helper error>{error}</Helper> : null}
              </FadeUp>
              <FadeUp delay={300} style={{ marginTop: s(14) }}>
                <CtaButton
                  label={sent ? 'Request sent!' : 'Send Request'}
                  icon={sent ? 'check' : 'send'}
                  size="md"
                  onPress={submit}
                  loading={send.isPending}
                  disabled={sent}
                />
              </FadeUp>
              <FadeUp delay={360}>
                <Text style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: s(11.5), lineHeight: s(16), color: colors.muted, marginTop: s(12) }}>
                  They'll see your note before they approve. You can chat once they accept.
                </Text>
              </FadeUp>
            </>
          )}
        </>
      )}
    </BottomSheet>
  );
}
