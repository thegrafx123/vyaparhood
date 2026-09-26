import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../src/components/Buttons';
import { Chip, TextField } from '../../src/components/Controls';
import { Heading } from '../../src/components/Heading';
import { Star } from '../../src/components/icons';
import { Footer, HeaderRow, KeyboardArea, Screen } from '../../src/components/Layout';
import { getMember, relationWith, useApp } from '../../src/state/AppStore';
import { colors, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { firstName } from '../../src/utils/validation';

const TAGS = ['Professional', 'Great conversation', 'On time', 'Would recommend', 'Responsive'];

/** 24 · Rate a meetup. Only possible with accepted connections. */
export default function RateMeetup() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, actions } = useApp();
  const member = getMember(state, String(id));
  const existing = state.ratings.find((r) => r.memberId === String(id));
  const [stars, setStars] = useState(existing?.stars ?? 0);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [note, setNote] = useState(existing?.note ?? '');

  if (!member) return null;
  const first = firstName(member.name);
  const canRate = relationWith(state, member.id).status === 'connected';

  const submit = () => {
    actions.addRating({ memberId: member.id, stars, tags, note: note.trim() });
    Alert.alert('Rating saved', `Thanks — this helps everyone who meets ${first} after you.`);
    router.back();
  };

  return (
    <Screen>
      <KeyboardArea>
        <HeaderRow />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Heading parts={['How was your', { accent: 'meetup', squiggle: false }, `with ${first}?`]} />
          <Text style={[t.subtitle, { marginTop: s(8) }]}>
            Keeps the community honest — for everyone who meets them after you.
          </Text>

          <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`${stars} of 5 stars`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setStars(n)} hitSlop={6} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
                <Star
                  size={s(40)}
                  color={colors.ink}
                  fill={n <= stars ? colors.star : colors.white}
                  strokeWidth={1.6}
                />
              </Pressable>
            ))}
          </View>

          <Text style={[t.label, { marginTop: s(28), marginBottom: s(12) }]}>What stood out?</Text>
          <View style={styles.chips}>
            {TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={tags.includes(tag)}
                onPress={() => setTags((x) => (x.includes(tag) ? x.filter((y) => y !== tag) : [...x, tag]))}
              />
            ))}
          </View>

          <TextField
            containerStyle={{ marginTop: s(24) }}
            label={`Add a note for ${first}`}
            optionalHint="(optional)"
            placeholder="Great chat about the launch plan — thank you!"
            value={note}
            onChangeText={setNote}
            multiline
            height={s(110)}
            maxLength={280}
          />
          {!canRate && (
            <Text style={[t.helper, { marginTop: s(12) }]}>
              You can rate members once you're connected.
            </Text>
          )}
        </ScrollView>
        <Footer>
          <PrimaryButton label="Submit rating" onPress={submit} disabled={stars === 0 || !canRate} />
        </Footer>
      </KeyboardArea>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: H_PAD, paddingTop: s(26), paddingBottom: s(24) },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: s(14), marginTop: s(30) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(9) },
});
