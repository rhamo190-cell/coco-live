import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Gift } from '@workspace/api-client-react';
import { LinearGradient } from 'expo-linear-gradient';

interface GiftCardProps {
  gift: Gift;
  onPress: () => void;
  selected?: boolean;
}

export function GiftCard({ gift, onPress, selected = false }: GiftCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <LinearGradient
        colors={selected ? ['#FF2D78', '#BF00FF'] : ['#0D0025', '#0D0025']}
        style={[
          styles.card,
          {
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
      >
        {gift.imageUrl ? (
          <Image source={{ uri: gift.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <Text style={styles.placeholderText}>🎁</Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {gift.name}
        </Text>
        <View style={[styles.costBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.costText, { color: colors.accentForeground }]}>
            {gift.coinCost}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
  },
  card: {
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  name: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  costBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  costText: {
    fontSize: 11,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
});
