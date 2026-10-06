import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useDiscoveryContext } from '../src/api/hooks';
import { FadeUp } from '../src/motion';
import { useApp } from '../src/state/AppStore';
import { useAuth } from '../src/state/AuthProvider';
import { colors, fonts, s } from '../src/theme/tokens';
import { type as t } from '../src/theme/typography';
import { CtaButton, TextButton } from '../src/ui/Buttons';
import { CityPicker } from '../src/ui/CityPicker';
import { BottomSheet } from '../src/ui/Sheet';

/** Discover's city switcher: browse Citywide in another city. */
export default function CitySelect() {
  const router = useRouter();
  const { state, actions } = useApp();
  const { me } = useAuth();
  const { data: context } = useDiscoveryContext();
  const own = context?.live_city ?? me?.profile.city ?? null;
  const [city, setCity] = useState<string | null>(state.discoverCity ?? own);

  const apply = () => {
    actions.setDiscoverCity(city && city !== own ? city : null);
    actions.setDiscoverMode('citywide');
    router.back();
  };

  return (
    <BottomSheet onDismiss={() => router.back()} scroll>
      <FadeUp delay={100} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s(6) }}>
        <Text style={{ fontFamily: fonts.display, fontSize: s(20), color: colors.ink }} accessibilityRole="header">
          Browse a city
        </Text>
        {own && city !== own ? <TextButton label={`Back to ${own}`} onPress={() => setCity(own)} /> : null}
      </FadeUp>
      <FadeUp delay={130}>
        <Text style={[t.meta, { marginBottom: s(16) }]}>Citywide shows businesses in the city you pick.</Text>
      </FadeUp>
      <CityPicker value={city} onChange={setCity} suggested={own} baseDelay={160} />
      <View style={{ height: s(22) }} />
      <CtaButton label="Show this city" size="md" onPress={apply} disabled={!city} />
    </BottomSheet>
  );
}
