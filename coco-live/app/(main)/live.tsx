import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { NeonButton } from '@/components/NeonButton';
import { useAuth } from '@/context/AuthContext';
import { useCreateStream, useUpdateStream, useListStreams } from '@workspace/api-client-react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function LiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  
  const { data: myStreams = [] } = useListStreams({ limit: 10 });
  const myActiveStream = myStreams.find(s => s.hostId === user?.id && s.isLive);
  
  const createStream = useCreateStream();
  const updateStream = useUpdateStream();

  const handleGoLive = () => {
    if (!title.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    createStream.mutate(
      { data: { title: title.trim() } },
      {
        onSuccess: (stream) => {
          updateStream.mutate({ id: stream.id, data: { isLive: true } });
          setTitle('');
        },
      }
    );
  };

  const handleEndStream = () => {
    if (!myActiveStream) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateStream.mutate({
      id: myActiveStream.id,
      data: { isLive: false },
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 80 }]}
    >
      <LinearGradient
        colors={['#FF2D78', '#BF00FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.titleGradient}
      >
        <Text style={styles.title}>GO LIVE</Text>
      </LinearGradient>

      {myActiveStream ? (
        <View style={styles.activeStream}>
          <View style={[styles.liveCard, { backgroundColor: colors.card }]}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>YOU'RE LIVE</Text>
            </View>
            
            <Text style={[styles.streamTitle, { color: colors.foreground }]}>
              {myActiveStream.title}
            </Text>
            
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Ionicons name="eye" size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {myActiveStream.viewerCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  viewers
                </Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="cash" size={24} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {myActiveStream.totalCoinsEarned || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  coins
                </Text>
              </View>
            </View>

            <NeonButton
              title="End Stream"
              onPress={handleEndStream}
              variant="ghost"
              loading={updateStream.isPending}
              style={styles.endButton}
            />
          </View>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Stream Title
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="What's your stream about?"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            
            <NeonButton
              title="Start Live Stream"
              onPress={handleGoLive}
              loading={createStream.isPending || updateStream.isPending}
              disabled={!title.trim()}
              style={styles.button}
            />
          </View>

          <View style={[styles.tips, { backgroundColor: colors.muted }]}>
            <Ionicons name="bulb" size={24} color={colors.accent} />
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.foreground }]}>
                Tips for a great stream
              </Text>
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                • Choose a catchy title{'\n'}
                • Engage with viewers{'\n'}
                • Thank gift senders{'\n'}
                • Keep content fresh
              </Text>
            </View>
          </View>
        </View>
      )}
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
  titleGradient: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  form: {
    gap: 24,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    gap: 20,
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  button: {
    marginTop: 8,
  },
  tips: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  tipContent: {
    flex: 1,
    gap: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
  },
  activeStream: {
    gap: 24,
  },
  liveCard: {
    padding: 24,
    borderRadius: 16,
    gap: 24,
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF2D78',
    borderRadius: 12,
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'center',
  },
  stat: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  endButton: {
    marginTop: 8,
  },
});
