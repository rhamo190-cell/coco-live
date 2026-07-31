import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type BadgeCategory = 'tornado' | 'lightning' | 'flower' | 'lion' | string;

const CATEGORY_CONFIG: Record<string, {
  color: [string, string];
  glow: string;
  emoji: string;
  tierColors: string[];
}> = {
  tornado:   { color: ['#001A2D', '#00E5FF20'], glow: '#00E5FF', emoji: '🌀', tierColors: ['#4A90D9', '#00BFFF', '#00E5FF', '#7DF9FF', '#E0FFFF'] },
  lightning: { color: ['#1A1A00', '#FFD70020'], glow: '#FFD700', emoji: '⚡', tierColors: ['#DAA520', '#FFB800', '#FFD700', '#FFE55C', '#FFF5A0'] },
  flower:    { color: ['#2D0020', '#FF2D7820'], glow: '#FF2D78', emoji: '🌸', tierColors: ['#C0266A', '#E82D78', '#FF2D78', '#FF70A6', '#FFB3D0'] },
  lion:      { color: ['#2D1000', '#FF6B3520'], glow: '#FF6B35', emoji: '🦁', tierColors: ['#C45000', '#E05A10', '#FF6B35', '#FF9970', '#FFD0B0'] },
};

const getCategoryConfig = (category: string) =>
  CATEGORY_CONFIG[category.toLowerCase()] ?? CATEGORY_CONFIG.tornado;

interface BadgeCardProps {
  badge: {
    id: number;
    name: string;
    category: string;
    tier: number;
    animationType: string;
    description?: string | null;
  };
  owned?: boolean;
  active?: boolean;
  onEquip?: (badgeId: number) => void;
  equipLoading?: boolean;
  size?: 'small' | 'medium';
}

export function BadgeCard({ badge, owned = false, active = false, onEquip, equipLoading, size = 'medium' }: BadgeCardProps) {
  const cfg = getCategoryConfig(badge.category);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Tier clamped 1-5
  const tier = Math.max(1, Math.min(5, badge.tier ?? 1));
  const tierColor = cfg.tierColors[tier - 1];

  useEffect(() => {
    // Glow pulse
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );

    // Scale pulse (only for active badge)
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.97, duration: 900, useNativeDriver: true }),
      ])
    );

    // Float (slight vertical bob)
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -4, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 4, duration: 1800, useNativeDriver: true }),
      ])
    );

    glow.start();
    if (active || owned) pulse.start();
    if (owned) float.start();

    return () => { glow.stop(); pulse.stop(); float.stop(); };
  }, [active, owned]);

  const borderOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const shadowRadius = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 24] });

  const isSmall = size === 'small';
  const cardSize = isSmall ? 90 : 120;
  const emojiSize = isSmall ? 30 : 42;
  const fontSize = isSmall ? 10 : 12;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { width: cardSize, transform: [{ scale: pulseAnim }, { translateY: floatAnim }] },
        !owned && styles.dimmed,
      ]}
    >
      <Animated.View
        style={[
          styles.glowBorder,
          {
            borderColor: tierColor,
            shadowColor: cfg.glow,
            shadowRadius,
            opacity: borderOpacity,
          },
        ]}
      >
        <LinearGradient colors={cfg.color} style={[styles.card, { height: cardSize }]}>
          {/* Active crown */}
          {active && (
            <View style={[styles.activeCrown, { backgroundColor: cfg.glow }]}>
              <Ionicons name="star" size={10} color="#000" />
            </View>
          )}

          {/* Tier indicator */}
          <View style={styles.tierRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.tierDot,
                  { backgroundColor: i < tier ? tierColor : '#FFFFFF15' },
                ]}
              />
            ))}
          </View>

          {/* Badge emoji / icon */}
          <Text style={{ fontSize: emojiSize }}>{cfg.emoji}</Text>

          {/* Shimmer ring behind emoji */}
          <Animated.View
            style={[
              styles.shimmerRing,
              {
                borderColor: tierColor,
                opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] }),
                width: emojiSize + 20,
                height: emojiSize + 20,
                borderRadius: (emojiSize + 20) / 2,
                position: 'absolute',
                top: 24,
              },
            ]}
          />

          {/* Badge name */}
          <Text
            style={[styles.name, { color: tierColor, fontSize }]}
            numberOfLines={2}
          >
            {badge.name}
          </Text>

          {/* Equip button */}
          {owned && onEquip && !active && (
            <TouchableOpacity
              style={[styles.equipBtn, { backgroundColor: tierColor + '30', borderColor: tierColor }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onEquip(badge.id);
              }}
              disabled={equipLoading}
            >
              <Text style={[styles.equipText, { color: tierColor }]}>
                {equipLoading ? '…' : 'Equip'}
              </Text>
            </TouchableOpacity>
          )}

          {active && (
            <View style={[styles.equipBtn, { backgroundColor: cfg.glow + '40', borderColor: cfg.glow }]}>
              <Text style={[styles.equipText, { color: cfg.glow }]}>Active</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  dimmed: { opacity: 0.45 },
  glowBorder: {
    borderRadius: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    elevation: 8,
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 6,
    position: 'relative',
  },
  activeCrown: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierRow: { flexDirection: 'row', gap: 3, position: 'absolute', top: 8, left: 8 },
  tierDot: { width: 5, height: 5, borderRadius: 3 },
  shimmerRing: { borderWidth: 1, position: 'absolute' },
  name: {
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  equipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  equipText: { fontSize: 10, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
});
