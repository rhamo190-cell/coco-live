import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';

interface CoinPackageCardProps {
  name: string;
  coins: number;
  price?: string;
  popular?: boolean;
  onPress: () => void;
}

export function CoinPackageCard({ name, coins, price, popular = false, onPress }: CoinPackageCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <LinearGradient
        colors={popular ? ['#FF2D78', '#BF00FF'] : ['#0D0025', '#1A0A33']}
        style={[
          styles.card,
          {
            borderWidth: popular ? 2 : 1,
            borderColor: popular ? colors.accent : colors.border,
          },
        ]}
      >
        {popular && (
          <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.popularText, { color: colors.accentForeground }]}>POPULAR</Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
        <Text style={[styles.coins, { color: popular ? colors.accent : colors.primary }]}>
          {coins.toLocaleString()}
        </Text>
        <Text style={[styles.coinsLabel, { color: colors.mutedForeground }]}>coins</Text>
        {price && (
          <Text style={[styles.price, { color: colors.foreground }]}>{price}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    minHeight: 160,
    justifyContent: 'center',
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  coins: {
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  coinsLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  price: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
});
