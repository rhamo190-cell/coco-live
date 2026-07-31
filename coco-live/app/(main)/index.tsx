import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { StreamCard } from '@/components/StreamCard';
import { useListStreams } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showLiveOnly, setShowLiveOnly] = useState(true);
  
  const { data: streams = [], isLoading, refetch } = useListStreams(
    showLiveOnly ? { live: true, limit: 50 } : { limit: 50 }
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#FF2D78', '#BF00FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.titleGradient}
      >
        <Text style={styles.title}>LIVE NOW</Text>
      </LinearGradient>
      <Text style={[styles.count, { color: colors.mutedForeground }]}>
        {streams.length} {streams.length === 1 ? 'stream' : 'streams'}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        No live streams right now
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
        Check back soon or start your own stream
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={streams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <StreamCard
            stream={item}
            onPress={() => router.push(`/stream/${item.id}`)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        numColumns={2}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      />
      {isLoading && streams.length === 0 && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 8,
  },
  header: {
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  titleGradient: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  count: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingLeft: 8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
