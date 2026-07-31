import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NeonButton } from '@/components/NeonButton';
import {
  useAdminGetUser,
  useAdminUpdateUser,
  useAdminListWalletTransactions,
  useAdminApproveTransaction,
  useAdminRejectTransaction,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const RANKS = ['Newcomer', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend', 'Elite'];

// ─── User Editor ─────────────────────────────────────────────────────────────

function UserEditor() {
  const colors = useColors();
  const [userId, setUserId] = useState('');
  const [editedRank, setEditedRank] = useState('');
  const [editedCoins, setEditedCoins] = useState('');
  const [editedBadgeId, setEditedBadgeId] = useState('');
  const [editedName, setEditedName] = useState('');
  const [makeAdmin, setMakeAdmin] = useState<boolean | null>(null);
  const [showRankPicker, setShowRankPicker] = useState(false);

  // Only fetch when userId is a valid number
  const parsedId = parseInt(userId, 10);
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
    refetch,
  } = useAdminGetUser(parsedId, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: { enabled: !isNaN(parsedId) && parsedId > 0 && userId.trim() !== '' } as any,
  });

  const updateUser = useAdminUpdateUser();

  const handleSearch = () => {
    if (!userId.trim() || isNaN(parsedId)) return;
    refetch();
  };

  // Pre-fill fields when user loads
  React.useEffect(() => {
    if (user) {
      setEditedRank(user.rank ?? '');
      setEditedCoins(String(user.coins ?? ''));
      setEditedBadgeId(user.activeBadgeId != null ? String(user.activeBadgeId) : '');
      setEditedName(user.displayName ?? '');
      setMakeAdmin(user.isAdmin ?? false);
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;

    const payload: Record<string, unknown> = {};
    if (editedName.trim() && editedName !== user.displayName) payload.displayName = editedName.trim();
    if (editedRank && editedRank !== user.rank) payload.rank = editedRank;
    const coinsNum = parseInt(editedCoins, 10);
    if (!isNaN(coinsNum) && coinsNum !== user.coins) payload.coins = coinsNum;
    const badgeNum = parseInt(editedBadgeId, 10);
    if (!isNaN(badgeNum) && badgeNum !== user.activeBadgeId) payload.activeBadgeId = badgeNum;
    if (makeAdmin !== null && makeAdmin !== user.isAdmin) payload.isAdmin = makeAdmin;

    if (Object.keys(payload).length === 0) {
      Alert.alert('No Changes', 'Nothing to update.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateUser.mutate(
      { id: user.id, data: payload as Parameters<typeof updateUser.mutate>[0]['data'] },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Updated', `User #${user.id} updated successfully.`);
          refetch();
        },
        onError: () => {
          Alert.alert('Error', 'Failed to update user.');
        },
      }
    );
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="person-circle" size={22} color="#00E5FF" />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>User Editor</Text>
      </View>
      <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
        Enter any user ID to view and modify their account
      </Text>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, flex: 1 }]}
          placeholder="Enter User ID…"
          placeholderTextColor={colors.mutedForeground}
          value={userId}
          onChangeText={setUserId}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: '#00E5FF' }]}
          onPress={handleSearch}
        >
          <Ionicons name="search" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {userLoading && (
        <ActivityIndicator style={{ marginTop: 16 }} color={colors.primary} />
      )}

      {/* Error */}
      {userError && !userLoading && (
        <View style={[styles.errorBox, { backgroundColor: '#FF336620' }]}>
          <Ionicons name="alert-circle" size={18} color="#FF3366" />
          <Text style={[styles.errorText, { color: '#FF3366' }]}>User not found</Text>
        </View>
      )}

      {/* User Found */}
      {user && !userLoading && (
        <View style={styles.userEditor}>
          {/* User Info Badge */}
          <View style={[styles.userBadge, { borderColor: colors.border }]}>
            <View>
              <Text style={[styles.userIdLabel, { color: colors.mutedForeground }]}>User ID #{user.id}</Text>
              <Text style={[styles.userName, { color: colors.foreground }]}>{user.displayName}</Text>
              <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>
                {user.phone ?? user.email ?? 'No contact'} · {user.isAdmin ? 'Admin' : 'User'}
              </Text>
            </View>
            <View style={[
              styles.liveBadge,
              { backgroundColor: user.isLive ? '#00FF88' : colors.muted },
            ]}>
              <Text style={[styles.liveBadgeText, { color: user.isLive ? '#000' : colors.mutedForeground }]}>
                {user.isLive ? 'LIVE' : 'offline'}
              </Text>
            </View>
          </View>

          {/* Editable Fields */}
          <View style={styles.fields}>
            <FieldLabel label="Display Name" color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Display name"
              placeholderTextColor={colors.mutedForeground}
            />

            <FieldLabel label="Rank" color={colors.mutedForeground} />
            <TouchableOpacity
              style={[styles.input, styles.pickerBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => setShowRankPicker(!showRankPicker)}
            >
              <Text style={{ color: editedRank ? colors.foreground : colors.mutedForeground }}>
                {editedRank || 'Select rank…'}
              </Text>
              <Ionicons name={showRankPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showRankPicker && (
              <View style={[styles.rankList, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                {RANKS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rankItem, { borderBottomColor: colors.border }]}
                    onPress={() => { setEditedRank(r); setShowRankPicker(false); }}
                  >
                    <Text style={[styles.rankItemText, {
                      color: r === editedRank ? '#FF2D78' : colors.foreground,
                      fontWeight: r === editedRank ? '700' : '400',
                    }]}>{r}</Text>
                    {r === editedRank && <Ionicons name="checkmark" size={18} color="#FF2D78" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <FieldLabel label="Coins Balance" color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              value={editedCoins}
              onChangeText={setEditedCoins}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
            />

            <FieldLabel label="Active Badge ID" color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              value={editedBadgeId}
              onChangeText={setEditedBadgeId}
              placeholder="Badge ID (optional)"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
            />

            <FieldLabel label="Admin Access" color={colors.mutedForeground} />
            <View style={styles.toggleRow}>
              <ToggleChip
                label="Admin"
                active={makeAdmin === true}
                onPress={() => setMakeAdmin(true)}
                colors={colors}
                activeColor="#FF2D78"
              />
              <ToggleChip
                label="Regular User"
                active={makeAdmin === false}
                onPress={() => setMakeAdmin(false)}
                colors={colors}
                activeColor="#00E5FF"
              />
            </View>
          </View>

          <NeonButton
            title={updateUser.isPending ? 'Saving…' : 'Save Changes'}
            onPress={handleSave}
            loading={updateUser.isPending}
            style={styles.saveBtn}
          />
        </View>
      )}
    </View>
  );
}

// ─── Wallet Transactions ──────────────────────────────────────────────────────

function WalletApprovals() {
  const colors = useColors();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const { data: transactions = [], isLoading, refetch } = useAdminListWalletTransactions({
    status: filter,
  });

  const approve = useAdminApproveTransaction();
  const reject = useAdminRejectTransaction();

  const handleApprove = (id: number) => {
    Alert.alert('Approve Transaction', 'Are you sure you want to approve this recharge?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          approve.mutate({ id }, {
            onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); refetch(); },
          });
        },
      },
    ]);
  };

  const handleReject = (id: number) => {
    Alert.alert('Reject Transaction', 'This will deny the recharge request.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          reject.mutate({ id }, {
            onSuccess: () => refetch(),
          });
        },
      },
    ]);
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return '#00FF88';
    if (status === 'rejected') return '#FF3366';
    return '#FFD700';
  };

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="wallet" size={22} color="#FFD700" />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Wallet Transactions</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['pending', 'approved', 'rejected'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              { borderColor: colors.border },
              filter === f && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterTabText,
              { color: filter === f ? '#fff' : colors.mutedForeground },
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}

      {!isLoading && transactions.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No {filter} transactions
          </Text>
        </View>
      )}

      {transactions.map((tx) => (
        <View key={tx.id} style={[styles.txCard, { borderColor: colors.border }]}>
          <View style={styles.txRow}>
            <View style={styles.txInfo}>
              <Text style={[styles.txTitle, { color: colors.foreground }]}>
                User #{tx.userId} · {tx.type}
              </Text>
              <Text style={[styles.txMeta, { color: colors.mutedForeground }]}>
                {tx.coins} coins · {tx.amount != null ? `${tx.amount} ${tx.currency ?? ''}` : 'no amount'} · {tx.method ?? '—'}
              </Text>
              <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
                {new Date(tx.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(tx.status) + '25' }]}>
              <Text style={[styles.statusText, { color: statusColor(tx.status) }]}>
                {tx.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {filter === 'pending' && (
            <View style={styles.txActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#00FF8825', borderColor: '#00FF88' }]}
                onPress={() => handleApprove(tx.id)}
              >
                <Ionicons name="checkmark-circle" size={16} color="#00FF88" />
                <Text style={[styles.actionBtnText, { color: '#00FF88' }]}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FF336625', borderColor: '#FF3366' }]}
                onPress={() => handleReject(tx.id)}
              >
                <Ionicons name="close-circle" size={16} color="#FF3366" />
                <Text style={[styles.actionBtnText, { color: '#FF3366' }]}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={[styles.fieldLabel, { color }]}>{label}</Text>
  );
}

function ToggleChip({
  label, active, onPress, colors, activeColor,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  activeColor: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { borderColor: active ? activeColor : colors.border, backgroundColor: active ? activeColor + '20' : 'transparent' },
      ]}
      onPress={onPress}
    >
      {active && <Ionicons name="checkmark" size={14} color={activeColor} />}
      <Text style={[styles.chipText, { color: active ? activeColor : colors.mutedForeground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  if (!user?.isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="lock-closed" size={64} color="#FF3366" />
        <Text style={[styles.accessDenied, { color: colors.foreground }]}>Access Denied</Text>
        <Text style={[styles.accessDeniedSub, { color: colors.mutedForeground }]}>
          Admin privileges required
        </Text>
        <NeonButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 24, paddingHorizontal: 40 }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <LinearGradient
        colors={['#FF2D78', '#BF00FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.titleGradient}
      >
        <Ionicons name="shield-checkmark" size={22} color="#fff" />
        <Text style={styles.title}>ADMIN PANEL</Text>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#FF2D7820' }]}>
          <Ionicons name="person" size={20} color="#FF2D78" />
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Logged in as</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]} numberOfLines={1}>
            {user.displayName}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#00E5FF20' }]}>
          <Ionicons name="id-card" size={20} color="#00E5FF" />
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Your ID</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>#{user.id}</Text>
        </View>
      </View>

      {/* User Editor */}
      <UserEditor />

      {/* Wallet Approvals */}
      <WalletApprovals />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 20 },
  titleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    gap: 4,
  },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  statValue: { fontSize: 16, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  section: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: -8,
  },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  userEditor: { gap: 16 },
  userBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  userIdLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  userName: { fontSize: 18, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  userMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  liveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  liveBadgeText: { fontSize: 12, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  fields: { gap: 10 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: -4 },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankList: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: -4,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankItemText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  saveBtn: { marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterTabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  txCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  txInfo: { flex: 1, gap: 3 },
  txTitle: { fontSize: 14, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  txMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  txDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  txActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  accessDenied: { fontSize: 28, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', marginTop: 16 },
  accessDeniedSub: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 8 },
});
