import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { keys, useDocuments } from '../../src/api/hooks';
import { VerificationDoc } from '../../src/api/types';
import { PrimaryButton } from '../../src/components/Buttons';
import { Hatched } from '../../src/components/Hatched';
import { Heading } from '../../src/components/Heading';
import { Check, CreditCard, Upload, X } from '../../src/components/icons';
import { Footer, HeaderRow, Screen } from '../../src/components/Layout';
import {
  DOCUMENT_RETENTION_DAYS,
  MASKED_AADHAAR_URL,
  MAX_DOCUMENT_MB,
  REQUIRE_BUSINESS_PROOF,
} from '../../src/config';
import { reportError } from '../../src/lib/sentry';
import { useAuth } from '../../src/state/AuthProvider';
import { BORDER, colors, fonts, H_PAD, s } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';

type Kind = VerificationDoc['kind'];

/**
 * 12 · Verification documents. Files go to the private
 * "verification-docs" bucket (only you and admins can open them) and are
 * permanently deleted after DOCUMENT_RETENTION_DAYS by a daily job.
 */
export default function VerifyDocs() {
  const router = useRouter();
  const qc = useQueryClient();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const managing = mode === 'manage';
  const { me, refreshMe } = useAuth();
  const { data: docs = [], isLoading } = useDocuments();
  const [busy, setBusy] = useState<Kind | null>(null);

  const latest = (kind: Kind) => docs.find((d) => d.kind === kind) ?? null;
  const businessProof = latest('business_proof');
  const govId = latest('gov_id');
  const hasAny = docs.length > 0;
  const canSubmit = REQUIRE_BUSINESS_PROOF ? !!businessProof : true;
  const status = me?.profile.verification_status ?? 'none';

  const choose = async (kind: Kind) => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    if (a.size && a.size > MAX_DOCUMENT_MB * 1024 * 1024) {
      Alert.alert('File too large', `Upload a PDF or photo under ${MAX_DOCUMENT_MB} MB.`);
      return;
    }
    setBusy(kind);
    try {
      const existing = latest(kind);
      if (existing && existing.status === 'pending') await api.documents.remove(existing);
      await api.documents.upload(kind, { uri: a.uri, name: a.name, mimeType: a.mimeType ?? null, size: a.size ?? null });
      await qc.invalidateQueries({ queryKey: keys.documents });
      await refreshMe();
    } catch (e) {
      reportError(e, { where: 'upload-doc', kind });
      Alert.alert("Couldn't upload", friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (doc: VerificationDoc) => {
    try {
      await api.documents.remove(doc);
      await qc.invalidateQueries({ queryKey: keys.documents });
    } catch (e) {
      Alert.alert("Couldn't remove", friendlyError(e));
    }
  };

  const onSubmit = () => {
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
        {managing && (
          <Text style={[t.label, { marginTop: s(12), color: status === 'verified' ? colors.teal : colors.yellow }]}>
            Status: {status === 'verified' ? 'Verified ✓' : status === 'pending' ? 'Under review' : status === 'rejected' ? 'Not approved — please upload again' : 'Not submitted'}
          </Text>
        )}

        <Text style={[t.label, { marginTop: s(24), marginBottom: s(10) }]}>
          Business proof
          {!REQUIRE_BUSINESS_PROOF && <Text style={styles.optional}> (optional for now)</Text>}
        </Text>
        <UploadBox
          doc={businessProof}
          busy={busy === 'business_proof'}
          hint="GST certificate, shop license or website"
          icon={<Upload size={s(20)} color={colors.blue} strokeWidth={2.2} />}
          onPick={() => choose('business_proof')}
          onRemove={remove}
        />

        <Text style={[t.label, { marginTop: s(22), marginBottom: s(10) }]}>
          Government ID<Text style={styles.optional}> (optional — adds an extra trust badge)</Text>
        </Text>
        <UploadBox
          doc={govId}
          busy={busy === 'gov_id'}
          hint="Masked Aadhaar, PAN or driving licence"
          icon={<CreditCard size={s(20)} color={colors.blue} strokeWidth={2.2} />}
          onPick={() => choose('gov_id')}
          onRemove={remove}
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
            Your documents are stored privately for up to {DOCUMENT_RETENTION_DAYS} days, seen only by our
            verification team, then permanently deleted.
          </Text>
        </View>
        {isLoading && <ActivityIndicator style={{ marginTop: s(16) }} color={colors.blue} />}
      </ScrollView>
      <Footer>
        <PrimaryButton
          label={managing ? 'Done' : hasAny ? 'Submit for review' : 'Skip for now'}
          onPress={onSubmit}
          disabled={!canSubmit || !!busy}
        />
      </Footer>
    </Screen>
  );
}

function UploadBox({
  doc,
  busy,
  hint,
  icon,
  onPick,
  onRemove,
}: {
  doc: VerificationDoc | null;
  busy: boolean;
  hint: string;
  icon: React.ReactNode;
  onPick: () => void;
  onRemove: (doc: VerificationDoc) => void;
}) {
  const statusText = doc
    ? doc.status === 'approved'
      ? 'Approved'
      : doc.status === 'rejected'
        ? 'Not approved · tap to upload again'
        : 'Uploaded · tap to replace'
    : hint;
  return (
    <Pressable
      onPress={onPick}
      disabled={busy || doc?.status === 'approved'}
      accessibilityRole="button"
      accessibilityLabel={doc ? `Replace ${doc.file_name}` : 'Tap to upload'}
    >
      <Hatched radius={s(22)} showIcon={false} style={styles.upload}>
        <View style={styles.uploadRow}>
          <View style={styles.uploadIcon}>
            {busy ? (
              <ActivityIndicator color={colors.blue} />
            ) : doc ? (
              <Check size={s(20)} color={colors.teal} strokeWidth={2.6} />
            ) : (
              icon
            )}
          </View>
          <View style={{ flex: 1, marginLeft: s(14) }}>
            <Text style={styles.uploadTitle} numberOfLines={1}>
              {busy ? 'Uploading…' : doc ? doc.file_name : 'Tap to upload'}
            </Text>
            <Text style={styles.uploadHint} numberOfLines={1}>
              {statusText}
            </Text>
          </View>
          {doc && doc.status === 'pending' && !busy && (
            <Pressable onPress={() => onRemove(doc)} hitSlop={10} accessibilityLabel="Remove file">
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
