import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { NeonButton } from '@/components/NeonButton';
import { useAuth } from '@/context/AuthContext';
import { useUpdateUser, useGetWallet } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: wallet } = useGetWallet();
  const updateUser = useUpdateUser();

  const handleSave = () => {
    if (!user || !displayName.trim()) return;
    
    updateUser.mutate(
      { id: user.id, data: { displayName: displayName.trim() } },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (!user) return null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 80 }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#FF2D78', '#BF00FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.avatarGradient}
        >
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarText}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          )}
        </LinearGradient>
        
        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display Name"
              placeholderTextColor={colors.mutedForeground}
            />
            <View style={styles.editButtons}>
              <NeonButton
                title="Save"
                onPress={handleSave}
                loading={updateUser.isPending}
                style={styles.editButton}
              />
              <NeonButton
                title="Cancel"
                onPress={() => {
                  setDisplayName(user.displayName);
                  setIsEditing(false);
                }}
                variant="ghost"
                style={styles.editButton}
              />
            </View>
          </View>
        ) : (
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {user.displayName}
            </Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        
        <Text style={[styles.rank, { color: colors.accent }]}>
          {user.rank}
        </Text>
      </View>

      {/* Stats */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.stat}>
          <Ionicons name="cash" size={32} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {wallet?.coins.toLocaleString() || user.coins.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Coins
          </Text>
          <TouchableOpacity onPress={() => router.push('/wallet')}>
            <Text style={[styles.link, { color: colors.primary }]}>
              Manage Wallet
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Ionicons name="people" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {user.followerCount || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Followers
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Ionicons name="person-add" size={32} color={colors.secondary} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {user.followingCount || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Following
          </Text>
        </View>
      </View>

      {/* Badges */}
      {user.activeBadgeName && (
        <TouchableOpacity
          onPress={() => router.push('/badges')}
          style={[styles.badgeCard, { backgroundColor: colors.card }]}
        >
          <View style={styles.badgeHeader}>
            <Ionicons name="trophy" size={24} color={colors.accent} />
            <Text style={[styles.badgeTitle, { color: colors.foreground }]}>
              Active Badge
            </Text>
          </View>
          <LinearGradient
            colors={['#FFD700', '#FF6B35']}
            style={styles.badgeGradient}
          >
            <Text style={styles.badgeName}>{user.activeBadgeName}</Text>
          </LinearGradient>
          <Text style={[styles.link, { color: colors.primary }]}>
            View All Badges
          </Text>
        </TouchableOpacity>
      )}

      {/* Logout */}
      <NeonButton
        title="Logout"
        onPress={handleLogout}
        variant="ghost"
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  rank: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  editForm: {
    width: '100%',
    gap: 16,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
  },
  statsCard: {
    flexDirection: 'row',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2D1B4E',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  link: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  badgeCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    gap: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  badgeGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    color: '#000000',
  },
  logoutButton: {
    marginTop: 16,
  },
});
