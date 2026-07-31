import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  useListBadges,
  useGetUserBadges,
  useEquipBadge,
  useGetMe,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { BadgeCard } from '@/components/BadgeCard';

const { width: SCREEN_W } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'tornado',   label: 'Tornado',   emoji: '🌀', glow: '#00E5FF', count: 50 },
  { key: 'lightning', label: 'Lightning', emoji: '⚡', glow: '#FFD700', count: 50 },
  { key: 'flower',    label: 'Flower',    emoji: '🌸', glow: '#FF2D78', count: 50 },
  { key: 'lion',      label: 'Lion',      emoji: '🦁', glow: '#FF6B35', count: 50 },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

const NUM_COLS = 3;
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - 32 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;

export default function BadgesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('tornado');
  const [equipingId, setEquipingId] = useState<number | null>(null);

  const { data: me } = useGetMe({ query: { enabled: true } as any });
  const {
    data: allBadges = [],
    isLoading: badgesLoading,
    refetch: refetchBadges,
  } = useListBadges({ category: activeCategory });

  const {
    data: userBadges = [],
    isLoading: userBadgesLoading,
    refetch: refetchUserBadges,
  } = useGetUserBadges(me?.id ?? 0, {
    query: { enabled: !!me?.id } as any,
  });

  const equipBadge = useEquipBadge();

  const ownedBadgeIds = useMemo(
    () => new Set(userBadges.map((ub) => ub.badgeId)),
    [userBadges]
  );
  const activeBadgeId = me?.activeBadgeId;

  const handleEquip = (badgeId: number) => {
    if (!me) return;
    setEquipingId(badgeId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    equipBadge.mutate(
      { userId: me.id, data: { badgeId } },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          refetchUserBadges();
          refetchBadges();
        },
        onSettled: () => setEquipingId(null),
      }
    );
  };

  const handleRefresh = () => { refetchBadges(); refetchUserBadges(); };

  const activeCat = CATEGORIES.find((c) => c.key === activeCategory)!;

  const isLoading = badgesLoading || userBadgesLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#050014', '#0D0025']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Badge Collection</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          200 cinematic animated badges across 4 categories
        </Text>

        {/* Category Tabs */}
        <View style={styles.tabRow}>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.tab,
                  { borderColor: isActive ? cat.glow : colors.border },
                  isActive && {
                    backgroundColor: cat.glow + '20',
                    shadowColor: cat.glow,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 10,
                    elevation: 6,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveCategory(cat.key);
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? cat.glow : colors.mutedForeground },
                  ]}
                >
                  {cat.label}
                </Text>
                <Text style={[styles.tabCount, { color: isActive ? cat.glow : colors.mutedForeground }]}>
                  {cat.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category glow bar */}
        <View style={[styles.glowBar, { backgroundColor: activeCat.glow, shadowColor: activeCat.glow }]} />
      </LinearGradient>

      {/* ── Badge Grid ── */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={activeCat.glow} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading {activeCat.label} badges…
          </Text>
        </View>
      ) : (
        <FlatList
          data={allBadges}
          keyExtractor={(b) => String(b.id)}
          numColumns={NUM_COLS}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + 40 },
          ]}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={activeCat.glow} />
          }
          ListHeaderComponent={
            <View style={styles.gridHeader}>
              <View style={[styles.statChip, { backgroundColor: activeCat.glow + '15', borderColor: activeCat.glow + '40' }]}>
                <Text style={[styles.statChipText, { color: activeCat.glow }]}>
                  {ownedBadgeIds.size} owned
                </Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: '#FFFFFF10', borderColor: '#FFFFFF20' }]}>
                <Text style={[styles.statChipText, { color: colors.mutedForeground }]}>
                  {allBadges.length} total
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 64 }}>{activeCat.emoji}</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No {activeCat.label} badges found
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const owned = ownedBadgeIds.has(item.id);
            const isActive = activeBadgeId === item.id;
            return (
              <View style={{ width: CARD_W, alignItems: 'center', marginBottom: CARD_GAP }}>
                <BadgeCard
                  badge={item}
                  owned={owned}
                  active={isActive}
                  onEquip={owned ? handleEquip : undefined}
                  equipLoading={equipingId === item.id}
                  size="medium"
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#2D1B4E',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    marginBottom: 20,
  },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  tabCount: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  glowBar: {
    height: 3,
    borderRadius: 2,
    marginHorizontal: 40,
    marginBottom: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },

  // Grid
  grid: { paddingHorizontal: 16, paddingTop: 20 },
  row: { gap: CARD_GAP, justifyContent: 'flex-start' },
  gridHeader: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statChipText: { fontSize: 13, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },

  // States
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
