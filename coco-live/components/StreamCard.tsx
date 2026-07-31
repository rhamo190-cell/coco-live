import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
import type { Stream } from '@workspace/api-client-react';
import { LinearGradient } from 'expo-linear-gradient';

interface StreamCardProps {
  stream: Stream;
  onPress: () => void;
}

export function StreamCard({ stream, onPress }: StreamCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {stream.thumbnailUrl ? (
            <Image source={{ uri: stream.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.muted }]}>
              <Ionicons name="videocam" size={48} color={colors.mutedForeground} />
            </View>
          )}
          
          {/* Live badge */}
          {stream.isLive && (
            <LinearGradient
              colors={['#FF2D78', '#BF00FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.liveBadge}
            >
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </LinearGradient>
          )}

          {/* Viewer count */}
          <View style={[styles.viewerBadge, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
            <Ionicons name="eye" size={14} color="#FFFFFF" />
            <Text style={styles.viewerText}>{stream.viewerCount}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.hostRow}>
            {stream.hostAvatar ? (
              <Image source={{ uri: stream.hostAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {stream.hostDisplayName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.hostInfo}>
              <Text style={[styles.hostName, { color: colors.foreground }]} numberOfLines={1}>
                {stream.hostDisplayName || 'Anonymous'}
              </Text>
              <Text style={[styles.title, { color: colors.mutedForeground }]} numberOfLines={1}>
                {stream.title}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  viewerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  viewerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  info: {
    padding: 12,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 15,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
