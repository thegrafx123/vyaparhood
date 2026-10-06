import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import * as api from '../../src/api';
import { friendlyError } from '../../src/api/errors';
import { keys } from '../../src/api/hooks';
import { useAuth } from '../../src/state/AuthProvider';
import { colors, fonts, s, TAB_PAD } from '../../src/theme/tokens';
import { type as t } from '../../src/theme/typography';
import { timeAgo } from '../../src/utils/time';
import { PillButton } from '../../src/ui/Buttons';
import { Card, Empty, Loading, Row } from '../../src/ui/Cards';
import { Field, Segmented, Toggle } from '../../src/ui/Form';
import { HeaderRow } from '../../src/ui/Header';
import { Search } from '../../src/ui/icons';
import { Screen } from '../../src/ui/Screen';

type Tab = 'reports' | 'members' | 'app';

/**
 * Admin tools (admins only — every action is re-checked by the database):
 * handle reports, ban members, grant membership / admin, and the switch
 * that turns billing on when payments go live.
 */
export default function Admin() {
  const { me } = useAuth();
  const [tab, setTab] = useState<Tab>('reports');

  if (!me?.profile.is_admin) {
    return (
      <Screen>
        <HeaderRow title="Admin" pad={TAB_PAD} />
        <Empty title="Admins only" />
      </Screen>
    );
  }

  return (
    <Screen>
      <HeaderRow title="Admin" pad={TAB_PAD} />
      <Segmented
        style={{ marginHorizontal: TAB_PAD, marginTop: s(14) }}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'reports', label: 'Reports' },
          { value: 'members', label: 'Members' },
          { value: 'app', label: 'App' },
        ]}
      />
      {tab === 'reports' && <ReportsTab />}
      {tab === 'members' && <MembersTab />}
      {tab === 'app' && <AppTab />}
    </Screen>
  );
}

function run(action: () => Promise<unknown>, after: () => void) {
  action()
    .then(after)
    .catch((e) => Alert.alert('Action failed', friendlyError(e)));
}

function ReportsTab() {
  const { data = [], isLoading, refetch } = useQuery({ queryKey: keys.admin('reports'), queryFn: api.admin.reports });
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(16), paddingBottom: s(40), gap: s(14) }}>
      {isLoading && <Loading />}
      {!isLoading && data.length === 0 && <Empty title="No reports" />}
      {data.map((r) => (
        <Card key={r.id}>
          <Text style={t.name}>{r.reported_name || '(no name)'}</Text>
          <Text style={t.meta}>
            {r.reason} · by {r.reporter_name} · {timeAgo(r.created_at)} · {r.status}
          </Text>
          {r.details ? <Text style={[t.body, { marginTop: s(8) }]}>{r.details}</Text> : null}
          <View style={{ flexDirection: 'row', gap: s(10), marginTop: s(12) }}>
            <PillButton
              label={r.reported_banned ? 'Unban' : 'Ban'}
              style={{ flex: 1 }}
              onPress={() =>
                run(
                  () => api.admin.setBanned(r.reported_id, !r.reported_banned),
                  () => run(() => api.admin.setReportStatus(r.id, 'actioned'), refetch),
                )
              }
            />
            <PillButton label="Dismiss" style={{ flex: 1 }} onPress={() => run(() => api.admin.setReportStatus(r.id, 'dismissed'), refetch)} />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

function MembersTab() {
  const [q, setQ] = useState('');
  const { data = [], isLoading, refetch } = useQuery({ queryKey: keys.admin('members', q), queryFn: () => api.admin.members(q) });

  const confirm = (title: string, action: () => Promise<unknown>) =>
    Alert.alert(title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => run(action, refetch) },
    ]);

  return (
    <>
      <View style={{ paddingHorizontal: TAB_PAD, marginTop: s(14) }}>
        <Field value={q} onChangeText={setQ} placeholder="Search by name or phone" autoCapitalize="none" left={<Search size={s(16)} color={colors.text} />} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: TAB_PAD, paddingTop: s(16), paddingBottom: s(40), gap: s(14) }}>
        {isLoading && <Loading />}
        {data.map((m) => (
          <Card key={m.id}>
            <Text style={t.name}>{m.full_name || '(no name yet)'}</Text>
            <Text style={t.meta}>
              {m.phone ? `+${m.phone}` : 'no phone'} · {m.city ?? 'no city'}
            </Text>
            <Text style={t.meta}>
              {m.membership_active ? 'Paid member' : 'No paid membership'}
              {m.is_admin ? ' · Admin' : ''}
              {m.is_banned ? ' · BANNED' : ''}
              {m.deleting ? ' · Deleting' : ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: s(8), marginTop: s(12) }}>
              <PillButton
                label={m.membership_active ? 'Revoke' : 'Grant'}
                style={{ flex: 1 }}
                onPress={() => confirm(`${m.membership_active ? 'Revoke' : 'Grant'} membership?`, () => api.admin.setMembership(m.id, !m.membership_active))}
              />
              <PillButton
                label={m.is_admin ? 'Un-admin' : 'Admin'}
                style={{ flex: 1 }}
                onPress={() => confirm(`${m.is_admin ? 'Remove' : 'Make'} admin?`, () => api.admin.setAdmin(m.id, !m.is_admin))}
              />
              <PillButton
                label={m.is_banned ? 'Unban' : 'Ban'}
                style={{ flex: 1 }}
                onPress={() => confirm(`${m.is_banned ? 'Unban' : 'Ban'} ${m.full_name || 'member'}?`, () => api.admin.setBanned(m.id, !m.is_banned))}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </>
  );
}

function AppTab() {
  const { me, refreshMe } = useAuth();
  const [busy, setBusy] = useState(false);
  const billing = !!me?.billingEnabled;

  const flip = (v: boolean) =>
    Alert.alert(
      v ? 'Turn billing on?' : 'Turn billing off?',
      v
        ? 'Members without a paid membership will be sent to the paywall. Only do this once a payment provider is connected.'
        : 'Everyone gets free beta access again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setBusy(true);
            run(
              () => api.admin.setBilling(v),
              () => refreshMe().finally(() => setBusy(false)),
            );
          },
        },
      ],
    );

  return (
    <View style={{ paddingHorizontal: TAB_PAD, paddingTop: s(18) }}>
      <Card elevated="softer" pad={s(4)} style={{ paddingHorizontal: s(16) }}>
        <Row
          label="Billing enabled"
          right={busy ? <Loading style={{ flex: 0, padding: 0 }} /> : <Toggle label="Billing enabled" value={billing} onChange={flip} />}
        />
      </Card>
      <Text style={[t.meta, { marginTop: s(12), fontFamily: fonts.body }]}>
        Off = free beta: everyone picks a plan on the paywall and gets in without paying.
      </Text>
    </View>
  );
}
