import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useGetWallet,
  useListWalletTransactions,
  useRechargeWallet,
  useRequestPayout,
  type WalletTransaction,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { NeonButton } from '@/components/NeonButton';

// ─── Coin Packages ────────────────────────────────────────────────────────────

const PACKAGES = [
  { id: 'starter',  label: 'Starter',  coins: 100,    price: 0.99,  color: ['#1A1A2E', '#2D1B4E'] as [string, string],  glow: '#8B7AA8', popular: false },
  { id: 'basic',    label: 'Basic',    coins: 500,    price: 3.99,  color: ['#0D0025', '#1A0A33'] as [string, string],  glow: '#00E5FF', popular: false },
  { id: 'popular',  label: 'Popular',  coins: 1200,   price: 8.99,  color: ['#2D0050', '#FF2D7820'] as [string, string], glow: '#FF2D78', popular: true },
  { id: 'premium',  label: 'Premium',  coins: 2500,   price: 17.99, color: ['#1A1A00', '#FFD70020'] as [string, string], glow: '#FFD700', popular: false },
  { id: 'elite',    label: 'Elite',    coins: 5500,   price: 34.99, color: ['#1A0030', '#BF00FF20'] as [string, string], glow: '#BF00FF', popular: false },
  { id: 'vip',      label: 'VIP',      coins: 12000,  price: 69.99, color: ['#2D0010', '#FF2D7840'] as [string, string], glow: '#FF2D78', popular: false },
] as const;

type PackageId = (typeof PACKAGES)[number]['id'];

function PackageCard({
  pkg,
  selected,
  onSelect,
  colors,
}: {
  pkg: (typeof PACKAGES)[number];
  selected: boolean;
  onSelect: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.8}
      style={[
        styles.pkgCard,
        selected && { borderColor: pkg.glow, shadowColor: pkg.glow, shadowOpacity: 0.7, shadowRadius: 16, elevation: 10 },
        !selected && { borderColor: colors.border },
      ]}
    >
      <LinearGradient colors={pkg.color} style={styles.pkgGradient}>
        {pkg.popular && (
          <View style={[styles.popularBadge, { backgroundColor: pkg.glow }]}>
            <Text style={styles.popularText}>POPULAR</Text>
          </View>
        )}
        <Text style={{ fontSize: 32 }}>💎</Text>
        <Text style={[styles.pkgCoins, { color: pkg.glow }]}>{pkg.coins.toLocaleString()}</Text>
        <Text style={styles.pkgLabel}>{pkg.label}</Text>
        <View style={[styles.pkgPrice, { backgroundColor: selected ? pkg.glow + '30' : 'rgba(255,255,255,0.06)' }]}>
          <Text style={[styles.pkgPriceText, { color: selected ? pkg.glow : colors.foreground }]}>
            ${pkg.price}
          </Text>
        </View>
        {selected && (
          <View style={[styles.selectedCheck, { backgroundColor: pkg.glow }]}>
            <Ionicons name="checkmark" size={14} color="#000" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TxRow({ tx, colors }: { tx: WalletTransaction; colors: ReturnType<typeof useColors> }) {
  const isIn = tx.type === 'recharge' || tx.type === 'gift_received';
  const statusColor = tx.status === 'approved' || tx.status === 'completed' ? '#00FF88' : tx.status === 'rejected' ? '#FF3366' : '#FFD700';

  const typeIcon: Record<string, string> = {
    recharge: 'add-circle',
    gift_received: 'gift',
    gift_sent: 'gift-outline',
    unlock: 'lock-open',
    payout: 'arrow-up-circle',
  };

  return (
    <View style={[styles.txRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.txIcon, { backgroundColor: isIn ? '#00FF8820' : '#FF336620' }]}>
        <Ionicons name={(typeIcon[tx.type] ?? 'swap-horizontal') as any} size={20} color={isIn ? '#00FF88' : '#FF3366'} />
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txType, { color: colors.foreground }]}>
          {tx.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </Text>
        <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
          {new Date(tx.createdAt).toLocaleDateString()} · {tx.method ?? 'in-app'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={[styles.txCoins, { color: isIn ? '#00FF88' : '#FF3366' }]}>
          {isIn ? '+' : '-'}{tx.coins.toLocaleString()} coins
        </Text>
        <View style={[styles.txStatus, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.txStatusText, { color: statusColor }]}>
            {tx.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selectedPkg, setSelectedPkg] = useState<PackageId | null>(null);
  const [showPayout, setShowPayout] = useState(false);
  const [payoutCoins, setPayoutCoins] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutAccount, setPayoutAccount] = useState('');

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useGetWallet();
  const { data: transactions = [], isLoading: txLoading, refetch: refetchTx } = useListWalletTransactions();

  const recharge = useRechargeWallet();
  const requestPayout = useRequestPayout();

  const selectedPackage = PACKAGES.find((p) => p.id === selectedPkg);

  const handleRecharge = () => {
    if (!selectedPkg || !selectedPackage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recharge.mutate(
      {
        data: {
          coinPackage: selectedPkg,
          method: 'card',
          amount: selectedPackage.price,
          currency: 'USD',
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Request Submitted', 'Your recharge request is pending admin approval.');
          setSelectedPkg(null);
          refetchWallet();
          refetchTx();
        },
        onError: () => Alert.alert('Error', 'Failed to submit recharge. Please try again.'),
      }
    );
  };

  const handlePayout = () => {
    const coins = parseInt(payoutCoins, 10);
    if (isNaN(coins) || coins <= 0) { Alert.alert('Invalid Amount', 'Enter a valid coin amount.'); return; }
    if (!payoutMethod.trim()) { Alert.alert('Missing Info', 'Please enter your payout method.'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    requestPayout.mutate(
      { data: { coins, method: payoutMethod.trim(), accountDetails: payoutAccount.trim() } },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Request Submitted', 'Your payout request is pending admin approval.');
          setShowPayout(false);
          setPayoutCoins('');
          setPayoutMethod('');
          setPayoutAccount('');
          refetchTx();
        },
        onError: () => Alert.alert('Error', 'Failed to submit payout.'),
      }
    );
  };

  const handleRefresh = () => { refetchWallet(); refetchTx(); };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
      refreshControl={
        <RefreshControl refreshing={walletLoading || txLoading} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      {/* ── Balance Card ── */}
      <LinearGradient
        colors={['#2D0050', '#050014', '#001A2D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceGlow} />
        <Text style={styles.balanceLabel}>Coin Balance</Text>
        {walletLoading ? (
          <ActivityIndicator color="#FFD700" size="large" style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.balanceRow}>
            <Text style={{ fontSize: 36 }}>💎</Text>
            <Text style={styles.balanceAmount}>{(wallet?.coins ?? 0).toLocaleString()}</Text>
          </View>
        )}
        <View style={styles.balanceStats}>
          <View style={styles.balanceStat}>
            <Text style={styles.balanceStatLabel}>Total Earned</Text>
            <Text style={[styles.balanceStatValue, { color: '#00FF88' }]}>
              +{(wallet?.totalEarned ?? 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceStat}>
            <Text style={styles.balanceStatLabel}>Total Spent</Text>
            <Text style={[styles.balanceStatValue, { color: '#FF3366' }]}>
              -{(wallet?.totalSpent ?? 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceStat}>
            <Text style={styles.balanceStatLabel}>Pending Payout</Text>
            <Text style={[styles.balanceStatValue, { color: '#FFD700' }]}>
              {(wallet?.pendingPayout ?? 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Recharge ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <LinearGradient colors={['#FF2D78', '#BF00FF']} style={styles.sectionDot} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recharge Coins</Text>
        </View>
        <View style={styles.pkgGrid}>
          {PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              selected={selectedPkg === pkg.id}
              onSelect={() => setSelectedPkg(selectedPkg === pkg.id ? null : pkg.id)}
              colors={colors}
            />
          ))}
        </View>
        {selectedPackage && (
          <NeonButton
            title={recharge.isPending ? 'Submitting…' : `Buy ${selectedPackage.coins.toLocaleString()} coins — $${selectedPackage.price}`}
            onPress={handleRecharge}
            loading={recharge.isPending}
            style={{ marginTop: 16 }}
          />
        )}
      </View>

      {/* ── Payout ── */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.payoutHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowPayout((v) => !v)}
        >
          <View style={styles.sectionHeader}>
            <LinearGradient colors={['#00E5FF', '#00FF88']} style={styles.sectionDot} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Request Payout</Text>
          </View>
          <Ionicons name={showPayout ? 'chevron-up' : 'chevron-down'} size={22} color={colors.mutedForeground} />
        </TouchableOpacity>

        {showPayout && (
          <View style={[styles.payoutForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Coins to withdraw</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Enter coin amount"
              placeholderTextColor={colors.mutedForeground}
              value={payoutCoins}
              onChangeText={setPayoutCoins}
              keyboardType="number-pad"
            />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Payout method</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. PayPal, Bank Transfer, Crypto"
              placeholderTextColor={colors.mutedForeground}
              value={payoutMethod}
              onChangeText={setPayoutMethod}
            />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Account details</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Email, wallet address, or account number"
              placeholderTextColor={colors.mutedForeground}
              value={payoutAccount}
              onChangeText={setPayoutAccount}
              multiline
              numberOfLines={3}
            />
            <NeonButton
              title={requestPayout.isPending ? 'Submitting…' : 'Submit Payout Request'}
              onPress={handlePayout}
              loading={requestPayout.isPending}
              variant="secondary"
            />
          </View>
        )}
      </View>

      {/* ── Transaction History ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <LinearGradient colors={['#FFD700', '#FF6B35']} style={styles.sectionDot} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transaction History</Text>
        </View>
        <View style={[styles.txList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {txLoading && <ActivityIndicator color={colors.primary} style={{ padding: 24 }} />}
          {!txLoading && transactions.length === 0 && (
            <View style={styles.emptyTx}>
              <Ionicons name="receipt-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTxText, { color: colors.mutedForeground }]}>No transactions yet</Text>
            </View>
          )}
          {transactions.map((tx) => (
            <TxRow key={tx.id} tx={tx} colors={colors} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 24 },

  // Balance
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#BF00FF40',
    shadowColor: '#BF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  balanceGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF2D7815',
  },
  balanceLabel: { color: '#8B7AA8', fontSize: 13, fontFamily: 'Inter_500Medium', letterSpacing: 1.5, textTransform: 'uppercase' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 },
  balanceAmount: {
    fontSize: 56,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  balanceStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  balanceStat: { flex: 1, alignItems: 'center' },
  balanceStatLabel: { color: '#8B7AA8', fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  balanceStatValue: { fontSize: 16, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  balanceDivider: { width: 1, height: 32, backgroundColor: '#2D1B4E' },

  // Sections
  section: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionDot: { width: 4, height: 22, borderRadius: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },

  // Packages
  pkgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pkgCard: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pkgGradient: { padding: 16, alignItems: 'center', gap: 8, minHeight: 140, position: 'relative' },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularText: { color: '#000', fontSize: 9, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  pkgCoins: { fontSize: 24, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  pkgLabel: { color: '#8B7AA8', fontSize: 12, fontFamily: 'Inter_500Medium' },
  pkgPrice: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  pkgPriceText: { fontSize: 15, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Payout
  payoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  payoutForm: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  formTextArea: { height: 80, textAlignVertical: 'top' },

  // Transactions
  txList: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, gap: 3 },
  txType: { fontSize: 14, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  txDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  txCoins: { fontSize: 15, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  txStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  txStatusText: { fontSize: 10, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  emptyTx: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTxText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
