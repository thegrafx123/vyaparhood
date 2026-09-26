import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../src/components/Buttons';
import { Heading } from '../../src/components/Heading';
import { Hatched } from '../../src/components/Hatched';
import { Check, CreditCard, Upload, X } from '../../src/components/icons';
import { Footer, HeaderRow, Screen } from '../../src/components/Layout';
import {
  DOCUMENT_RETENTION_DAYS,
  MASKED_AADHAAR_URL,
  MAX_DOCUMENT_MB,
  REQUIRE_BUSINESS_PROOF,
} from '../../src/config';
import { PickedFile, useApp } from '../../src/state/AppStore';
import { BORDER, colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

async function pickDocument(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  if (a.size && a.size > MAX_DOCUMENT_MB * 1024 * 1024) {
    Alert.alert('File too large', `Upload a PDF or photo under ${MAX_DOCUMENT_MB} MB.`);
    return null;
  }
  return { name: a.name, uri: a.uri, size: a.size ?? null, mimeType: a.mimeType ?? null };
}

/**
 * 12 · Verification documents (manual review).
 * Backend later: upload to a private bucket, admin-only access,
 * auto-delete after DOCUMENT_RETENTION_DAYS.
 */
export default function VerifyDocs() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const managing = mode === 'manage';
  const { state, actions } = useApp();
  const { businessProof, govId } = state.documents;
  const hasAny = !!businessProof || !!govId;
  const canSubmit = REQUIRE_BUSINESS_PROOF ? !!businessProof : true;

  const choose = async (key: 'businessProof' | 'govId') => {
    const file = await pickDocument();
    if (file) actions.setDocument(key, file);
  };

  const onSubmit = () => {
    if (hasAny) actions.patch({ verification: 'pending' });
    if (managing) router.back();
    else router.push(hasAny ? '/auth/under-review' : '/auth/notifications');
  };

  return (
    <Screen>
      <HeaderRow />
      <ScrollView contentContainerStyle={styles.content}>
        <Heading parts={["Let's verify", { accent: "you're real", squiggle: false }]} />
        <Text style={[t.subtitle, { marginTop: s(8) }]}>
          This is what keeps Vyaparhood free of fake profiles and cold DMs.
        </Text>

        <Text style={[t.label, { marginTop: s(28), marginBottom: s(10) }]}>
          Business proof
          {!REQUIRE_BUSINESS_PROOF && <Text style={styles.optional}> (optional for now)</Text>}
        </Text>
        <UploadBox
          file={businessProof}
          hint="GST certificate, shop license or website"
          icon={<Upload size={s(20)} color={colors.blue} strokeWidth={2.2} />}
          onPick={() => choose('businessProof')}
          onRemove={() => actions.setDocument('businessProof', null)}
        />

        <Text style={[t.label, { marginTop: s(22), marginBottom: s(10) }]}>
          Government ID<Text style={styles.optional}> (optional — adds an extra trust badge)</Text>
        </Text>
        <UploadBox
          file={govId}
          hint="Masked Aadhaar, PAN or driving licence"
          icon={<CreditCard size={s(20)} color={colors.blue} strokeWidth={2.2} />}
          onPick={() => choose('govId')}
          onRemove={() => actions.setDocument('govId', null)}
        />
        <View style={styles.aadhaar}>
          <Text style={styles.aadhaarText}>
            <Text style={styles.aadhaarBold}>Using Aadhaar? Upload the masked version only</Text> — it hides
            the first 8 digits. Download it free from{' '}
            <Text style={styles.aadhaarLink} onPress={() => Linking.openURL(MASKED_AADHAAR_URL)}>
              myAadhaar
            </Text>
            . PAN can be uploaded as is.
          </Text>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>🔒  Reviewed within 24 hours — you can keep exploring while we check.</Text>
          <Text style={styles.noteBody}>
            Your documents are stored encrypted for up to {DOCUMENT_RETENTION_DAYS} days, seen only by our
            verification team, then permanently deleted.
          </Text>
        </View>
      </ScrollView>
      <Footer>
        <PrimaryButton
          label={managing ? 'Save documents' : hasAny ? 'Submit for review' : 'Skip for now'}
          onPress={onSubmit}
          disabled={!canSubmit}
        />
      </Footer>
    </Screen>
  );
}

function UploadBox({
  file,
  hint,
  icon,
  onPick,
  onRemove,
}: {
  file: PickedFile | null;
  hint: string;
  icon: React.ReactNode;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable onPress={onPick} accessibilityRole="button" accessibilityLabel={file ? `Replace ${file.name}` : 'Tap to upload'}>
      <Hatched radius={s(22)} showIcon={false} style={styles.upload}>
        <View style={styles.uploadRow}>
          <View style={styles.uploadIcon}>{file ? <Check size={s(20)} color={colors.teal} strokeWidth={2.6} /> : icon}</View>
          <View style={{ flex: 1, marginLeft: s(14) }}>
            <Text style={styles.uploadTitle} numberOfLines={1}>
              {file ? file.name : 'Tap to upload'}
            </Text>
            <Text style={styles.uploadHint} numberOfLines={1}>
              {file ? 'Uploaded · tap to replace' : hint}
            </Text>
          </View>
          {file && (
            <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel="Remove file">
              <X size={s(18)} color={colors.text} strokeWidth={2.2} />
            </Pressable>
          )}
        </View>
      </Hatched>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: H_PAD, paddingTop: s(26), paddingBottom: s(24) },
  optional: { fontFamily: fonts.bodyMedium, color: '#BAC3D6' },
  upload: { height: s(76), alignItems: 'stretch' },
  uploadRow: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(16) },
  uploadIcon: {
    width: s(46),
    height: s(46),
    borderRadius: s(12),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: { fontFamily: fonts.display, fontSize: s(17), color: colors.blue, marginTop: s(2) },
  uploadHint: { fontFamily: fonts.body, fontSize: s(13.5), color: colors.textMuted, marginTop: -s(2) },
  aadhaar: { marginTop: s(10), paddingHorizontal: s(4) },
  aadhaarText: { fontFamily: fonts.body, fontSize: s(13.5), lineHeight: s(19), color: colors.text },
  aadhaarBold: { fontFamily: fonts.bodyBold, color: colors.ink },
  aadhaarLink: { fontFamily: fonts.bodyBold, color: colors.blue, textDecorationLine: 'underline' },
  note: { marginTop: s(22), backgroundColor: colors.tealSoft, borderRadius: s(20), padding: s(16) },
  noteTitle: { fontFamily: fonts.bodyBold, fontSize: s(15), lineHeight: s(21), color: colors.noteText },
  noteBody: { fontFamily: fonts.body, fontSize: s(13.5), lineHeight: s(19), color: colors.noteText, marginTop: s(6) },
});
