import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SheetUp } from '../motion';
import { colors, fonts, s } from '../theme/tokens';

/** A small built-in emoji picker for chat (no extra library). */
const SETS: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '🙂', '😉', '😍', '🤩', '😘', '😎', '🤓', '🤔', '🤗', '🙌', '😌', '😇', '🥳', '😴', '😬', '😮', '😢', '😭', '😤', '🙏'],
  },
  {
    label: 'Work',
    emojis: ['👍', '👎', '👏', '🤝', '💪', '✌️', '👌', '👋', '🙋', '💼', '📈', '📊', '💰', '💸', '🧾', '📦', '🚚', '🏪', '🏢', '🛍️', '📍', '📅', '⏰', '📞', '✉️', '💡', '🚀', '✅'],
  },
  {
    label: 'Food',
    emojis: ['☕', '🍵', '🧋', '🥤', '🍕', '🍔', '🌮', '🥗', '🍛', '🍜', '🍰', '🎂', '🍫', '🍎', '🥭', '🍋', '🥐', '🍪', '🍩', '🍿', '🥂', '🍽️', '🧁', '🍦', '🥘', '🍱', '🍣', '🫖'],
  },
  {
    label: 'Symbols',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🔥', '✨', '⭐', '🌟', '🎉', '🎊', '💯', '👀', '🙈', '🌸', '🌈', '☀️', '🌙', '⚡', '🎯', '🏆', '🎁', '📸', '🎵', '🇮🇳', '➕', '❓'],
  },
];

export function EmojiPanel({ onPick, bottomInset }: { onPick: (emoji: string) => void; bottomInset: number }) {
  const [set, setSet] = useState(0);
  return (
    <SheetUp>
      <View
        style={{
          backgroundColor: colors.white,
          borderTopWidth: s(2),
          borderTopColor: colors.line,
          paddingBottom: Math.max(bottomInset, s(10)),
        }}
      >
        <View style={{ flexDirection: 'row', gap: s(6), paddingHorizontal: s(14), paddingTop: s(10) }}>
          {SETS.map((g, i) => (
            <Pressable
              key={g.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: set === i }}
              onPress={() => setSet(i)}
              style={{
                paddingVertical: s(5),
                paddingHorizontal: s(12),
                borderRadius: 999,
                backgroundColor: set === i ? colors.ink : colors.inputBg,
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: s(11.5), color: set === i ? colors.white : colors.text }}>{g.label}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView style={{ maxHeight: s(210) }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: s(8), paddingVertical: s(8) }}>
          {SETS[set].emojis.map((e) => (
            <Pressable
              key={e}
              accessibilityRole="button"
              accessibilityLabel={`Insert ${e}`}
              onPress={() => onPick(e)}
              style={({ pressed }) => ({
                width: '14.28%',
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: s(12),
                backgroundColor: pressed ? colors.blueSoft : 'transparent',
              })}
            >
              <Text style={{ fontSize: s(26) }}>{e}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SheetUp>
  );
}
