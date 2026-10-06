import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { friendlyError } from '../../src/api/errors';
import { useMember, useMyRating, useRate } from '../../src/api/hooks';
import { FadeUp, StarPop } from '../../src/motion';
import { colors, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { CtaButton } from '../../src/ui/Buttons';
import { Loading } from '../../src/ui/Cards';
import { Chip, Field, Helper } from '../../src/ui/Form';
import { BackButton } from '../../src/ui/Header';
import { AccentHeading } from '../../src/ui/Heading';
import { Star } from '../../src/ui/icons';
import { Footer, KeyboardArea, Screen } from '../../src/ui/Screen';

const TAGS = ['Professional', 'Great conversation', 'On time', 'Would recommend', 'Responsive'];

/** 22 · Rate a meeting. Only possible with members you're connected to. */
export default function RateMeeting() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: m } = useMember(id);
  const { data: existing, isLoading } = useMyRating(id);
  const rate = useRate();
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const first = m?.full_name.split(' ')[0] ?? 'them';

  useEffect(() => {
    if (existing) {
      setStars(existing.stars);
      setTags(existing.tags);
      setNote(existing.note);
    }
  }, [existing]);

  const submit = () => {
    if (!id || stars < 1) {
      setError('Tap a star to rate.');
      return;
    }
    rate.mutate(
      { memberId: id, rating: { stars, tags, note: note.trim() } },
      { onSuccess: () => router.back(), onError: (e) => setError(friendlyError(e)) },
    );
  };

  return (
    <Screen texture>
      <KeyboardArea>
        <FadeUp delay={20} style={{ paddingHorizontal: s(24), paddingTop: s(22), flexDirection: 'row' }}>
          <BackButton />
        </FadeUp>
        {isLoading ? (
          <Loading />
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: s(20), paddingBottom: s(24) }}>
            <FadeUp delay={80}>
              <AccentHeading parts={['How was your', { accent: 'meetup', squiggle: false }, `with ${first}?`]} size={27} accentSize={32} lineHeight={1.15} />
              <Text style={[t.subtitle, { fontSize: s(13), marginTop: s(8) }]}>
                Keeps the community honest — for everyone who meets them after you.
              </Text>
            </FadeUp>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: s(8), marginTop: s(26) }} accessibilityRole="adjustable" accessibilityLabel={`Rating: ${stars} of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <StarPop key={n} delay={160 + (n - 1) * 50}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} onPress={() => setStars(n)} hitSlop={4}>
                    <Star size={s(34)} color={colors.ink} fill={n <= stars ? colors.star : colors.white} />
                  </Pressable>
                </StarPop>
              ))}
            </View>

            <FadeUp delay={400} style={{ marginTop: s(28) }}>
              <Text style={[t.label, { marginBottom: s(10) }]}>What stood out?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
                {TAGS.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="md"
                    selected={tags.includes(tag)}
                    onPress={() => setTags((v) => (v.includes(tag) ? v.filter((x) => x !== tag) : [...v, tag]))}
                  />
                ))}
              </View>
            </FadeUp>

            <FadeUp delay={460} style={{ marginTop: s(22) }}>
              <Field
                label={`Add a note for ${first}`}
                optional="(optional)"
                value={note}
                onChangeText={setNote}
                placeholder="Great chat about the launch plan — thank you!"
                multiline
                maxLength={280}
              />
            </FadeUp>
            {error ? <Helper error>{error}</Helper> : null}
          </ScrollView>
        )}
        <View>
          <FadeUp delay={500}>
            <Footer style={{ paddingTop: s(10) }}>
              <CtaButton label="Submit rating" icon="check" onPress={submit} loading={rate.isPending} disabled={stars < 1} />
            </Footer>
          </FadeUp>
        </View>
      </KeyboardArea>
    </Screen>
  );
}
