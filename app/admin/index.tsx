import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { keys } from '../../src/api/hooks';
import { AdminDoc } from '../../src/api/types';
import { OutlineButton } from '../../src/components/Buttons';
import { Segmented } from '../../src/components/Controls';
import { HeaderRow, Screen, SoftCard } from '../../src/components/Layout';
import { useAuth } from '../../src/state/AuthProvider';
import { BORDER, colors, fonts, s, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { timeAgo } from '../../src/utils/time';

type Tab = 'verify' | 'reports' | 'members';

/**
 * Admin tools (admins only — every action is re-checked by the database).
 * Verify documents, handle reports, grant membership / admin, ban.
 */
export default function Admin() {
  const { me } = useAuth();
  const [tab, setTab] = useState<Tab>('verify');

  if (!me?.profile.is_admin) {
    return (
      <Screen>
        <HeaderRow title="Admin" style={{ paddingHorizontal: TAB_PAD }} />
        <Text style={[t.bodyInk, { padding: TAB_PAD }]}>Admins only.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <HeaderRow title="Admin" style={{ paddingHorizontal: TAB_PAD }} />
      <Segmented
        style={{ marginHorizontal: TAB_PAD, marginTop: s(10) }}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'verify', label: 'Verify' },
          { value: 'reports', label: 'Reports' },
          { value: 'members', label: 'Members' },
        ]}
      />
      {tab === 'verify' && <VerifyTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'members' && <MembersTab />}
    </Screen>
  );
}

function run(action: () => Promise<unknown>, after: () => void) {
  action()
    .then(after)
    .catch((e) => Alert.alert('Action failed', friendlyError(e)));
}

function VerifyTab() {
  const qc = useQueryClient();
  const { data = [], isLoading, refetch } = useQuery({ queryKey: keys.admin('docs'), queryFn: api.admin.pendingDocs });

  // Group documents by member.
  const byUser = data.reduce<Record<string, AdminDoc[]>>((acc, d) => {
    (acc[d.user_id] ??= []).push(d);
    return acc;
  }, {});

  const open = async (d: AdminDoc) => {
    try {
      Linking.openURL(await api.signedUrl('verification-docs', d.storage_path, 300));
    } catch (e) {
      Alert.alert("Couldn't open file", friendlyError(e));
    }
  };

  const review = (userId: string, approve: boolean) =>
    run(() => api.admin.review(userId, approve), () => {
      refetch();
      qc.invalidateQueries({ queryKey: keys.admin('members') });
    });

  return (
    <ScrollView contentContainerStyle={styles.list}>
      {isLoading && <ActivityIndicator color={colors.blue} />}
      {Object.entries(byUser).map(([userId, docs]) => (
        <SoftCard key={userId} radius={s(22)} style={styles.card} innerStyle={{ padding: s(16) }}>
          <Text style={t.name}>{docs[0].user_name || 'Unnamed member'}</Text>
          <Text style={styles.meta}>{docs[0].user_email}</Text>
          {docs.map((d) => (
            <Pressable key={d.doc_id} onPress={() => open(d)} style={styles.doc}>
              <Text style={styles.docKind}>{d.kind === 'gov_id' ? 'Government ID' : 'Business proof'}</Text>
              <Text style={styles.docName} numberOfLines={1}>
                {d.file_name} · {timeAgo(d.created_at)} · tap to open
              </Text>
            </Pressable>
          ))}
          <View style={styles.actions}>
            <OutlineButton label="Reject" onPress={() => review(userId, false)} style={{ flex: 1 }} />
            <OutlineButton label="Approve" fill={colors.lime} onPress={() => review(userId, true)} style={{ flex: 1, marginLeft: s(12) }} />
          </View>
        </SoftCard>
      ))}
      {!isLoading && data.length === 0 && <Text style={styles.empty}>No documents waiting for review.</Text>}
    </ScrollView>
  );
}

function ReportsTab() {
  const { data = [], isLoading, refetch } = useQuery({ queryKey: keys.admin('reports'), queryFn: api.admin.reports });
  return (
    <ScrollView contentContainerStyle={styles.list}>
      {isLoading && <ActivityIndicator color={colors.blue} />}
      {data.map((r) => (
        <SoftCard key={r.id} radius={s(22)} style={styles.card} innerStyle={{ padding: s(16) }}>
          <Text style={t.name}>
            {r.reported_name} {r.reported_banned ? '· BANNED' : ''}
          </Text>
          <Text style={styles.meta}>
            {r.reason} · by {r.reporter_name} · {timeAgo(r.created_at)} · {r.status}
          </Text>
          {r.details ? <Text style={[t.body, { marginTop: s(8) }]}>{r.details}</Text> : null}
          <View style={styles.actions}>
            <OutlineButton
              label={r.reported_banned ? 'Unban' : 'Ban'}
              onPress={() =>
                run(() => api.admin.setBanned(r.reported_id, !r.reported_banned), () =>
                  run(() => api.admin.setReportStatus(r.id, 'actioned'), refetch),
                )
              }
              style={{ flex: 1 }}
            />
            <OutlineButton
              label="Dismiss"
              onPress={() => run(() => api.admin.setReportStatus(r.id, 'dismissed'), refetch)}
              style={{ flex: 1, marginLeft: s(12) }}
            />
          </View>
        </SoftCard>
      ))}
      {!isLoading && data.length === 0 && <Text style={styles.empty}>No reports.</Text>}
    </ScrollView>
  );
}

function MembersTab() {
  const [q, setQ] = useState('');
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: keys.admin('members', q),
    queryFn: () => api.admin.members(q),
  });

  const confirm = (title: string, action: () => Promise<unknown>) =>
    Alert.alert(title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => run(action, refetch) },
    ]);

  return (
    <>
      <View style={styles.search}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name or email"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          style={styles.searchInput}
        />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {isLoading && <ActivityIndicator color={colors.blue} />}
        {data.map((m) => (
          <SoftCard key={m.id} radius={s(22)} style={styles.card} innerStyle={{ padding: s(16) }}>
            <Text style={t.name}>{m.full_name || '(no name yet)'}</Text>
            <Text style={styles.meta}>
              {m.email} · {m.city ?? 'no city'} · {m.verification_status}
            </Text>
            <Text style={styles.meta}>
              {m.membership_active ? 'Member' : 'No membership'}
              {m.is_admin ? ' · Admin' : ''}
              {m.is_banned ? ' · BANNED' : ''}
            </Text>
            <View style={styles.actions}>
              <OutlineButton
                label={m.membership_active ? 'Revoke' : 'Grant'}
                height={s(40)}
                onPress={() =>
                  confirm(`${m.membership_active ? 'Revoke' : 'Grant'} membership?`, () =>
                    api.admin.setMembership(m.id, !m.membership_active),
                  )
                }
                style={{ flex: 1 }}
              />
              <OutlineButton
                label={m.is_admin ? 'Un-admin' : 'Admin'}
                height={s(40)}
                onPress={() => confirm(`${m.is_admin ? 'Remove' : 'Make'} admin?`, () => api.admin.setAdmin(m.id, !m.is_admin))}
                style={{ flex: 1, marginLeft: s(8) }}
              />
              <OutlineButton
                label={m.is_banned ? 'Unban' : 'Ban'}
                height={s(40)}
                onPress={() => confirm(`${m.is_banned ? 'Unban' : 'Ban'} ${m.full_name || 'member'}?`, () => api.admin.setBanned(m.id, !m.is_banned))}
                style={{ flex: 1, marginLeft: s(8) }}
              />
            </View>
          </SoftCard>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: TAB_PAD, paddingTop: s(16), paddingBottom: s(40) },
  card: { marginBottom: s(14) },
  meta: { fontFamily: fonts.body, fontSize: s(14), color: colors.textMuted, marginTop: s(2) },
  doc: { marginTop: s(10), padding: s(12), borderRadius: s(14), backgroundColor: colors.blueSoft },
  docKind: { fontFamily: fonts.bodyBold, fontSize: s(14.5), color: colors.ink },
  docName: { fontFamily: fonts.body, fontSize: s(13.5), color: colors.blue, marginTop: s(2) },
  actions: { flexDirection: 'row', marginTop: s(14) },
  empty: { fontFamily: fonts.body, fontSize: s(16), color: colors.text, textAlign: 'center', marginTop: s(40) },
  search: {
    marginHorizontal: TAB_PAD,
    marginTop: s(14),
    height: s(48),
    borderRadius: s(24),
    borderWidth: BORDER,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    justifyContent: 'center',
    paddingHorizontal: s(18),
  },
  searchInput: { fontFamily: fonts.body, fontSize: s(16), color: colors.ink, paddingVertical: 0 },
});
