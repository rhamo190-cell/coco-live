import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useGetStream,
  useListChatMessages,
  useSendChatMessage,
  useListGifts,
  useSendGift,
  useListStreamLockedMedia,
  useUnlockMedia,
  type LockedMedia,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Gift Burst Overlay ───────────────────────────────────────────────────────

function GiftBurst({ giftName, onDone }: { giftName: string; onDone: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, tension: 60, friction: 5 }),
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(rotate, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.burstOverlay,
        { opacity, transform: [{ scale }, { rotate: spin }] },
      ]}
    >
      <LinearGradient colors={['#FF2D78', '#BF00FF', '#00E5FF']} style={styles.burstGradient}>
        <Text style={styles.burstEmoji}>🎁</Text>
        <Text style={styles.burstName}>{giftName}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Locked Media Card ────────────────────────────────────────────────────────

function LockedMediaCard({
  item,
  colors,
}: {
  item: LockedMedia;
  colors: ReturnType<typeof useColors>;
}) {
  const unlock = useUnlockMedia();
  const [unlocked, setUnlocked] = useState(item.isUnlocked);

  const handleUnlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    unlock.mutate(
      { id: item.id },
      { onSuccess: () => setUnlocked(true) }
    );
  };

  return (
    <View style={[styles.lockedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Blurred preview */}
      <View style={styles.lockedThumb}>
        <View style={[styles.lockedBlur, { backgroundColor: colors.muted }]}>
          <Ionicons name="lock-closed" size={28} color={colors.primary} />
        </View>
      </View>
      {!unlocked ? (
        <TouchableOpacity
          style={[styles.unlockBtn, { backgroundColor: colors.primary }]}
          onPress={handleUnlock}
        >
          <Ionicons name="diamond" size={14} color="#fff" />
          <Text style={styles.unlockBtnText}>{item.coinCost}</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.unlockBtn, { backgroundColor: '#00FF8830' }]}>
          <Ionicons name="checkmark-circle" size={14} color="#00FF88" />
          <Text style={[styles.unlockBtnText, { color: '#00FF88' }]}>Unlocked</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StreamViewerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const streamId = params.id ? Number(params.id) : 0;

  const [message, setMessage] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [burst, setBurst] = useState<{ id: number; name: string } | null>(null);
  const chatRef = useRef<FlatList>(null);
  const giftTrayAnim = useRef(new Animated.Value(0)).current;

  const { data: stream, isLoading: streamLoading } = useGetStream(streamId, {
    query: { enabled: !!streamId, refetchInterval: 10000 } as any,
  });
  const { data: messages = [], refetch: refetchChat } = useListChatMessages(streamId, undefined, {
    query: { enabled: !!streamId, refetchInterval: 3000 } as any,
  });
  const { data: gifts = [] } = useListGifts();
  const { data: lockedMedia = [] } = useListStreamLockedMedia(streamId, {
    query: { enabled: !!streamId } as any,
  });

  const sendChat = useSendChatMessage();
  const sendGift = useSendGift();

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // Animate gift tray
  useEffect(() => {
    Animated.spring(giftTrayAnim, {
      toValue: showGifts ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [showGifts]);

  const handleSendMessage = useCallback(() => {
    const text = message.trim();
    if (!text) return;
    setMessage('');
    sendChat.mutate(
      { streamId, data: { content: text } },
      { onSuccess: () => refetchChat() }
    );
  }, [message, streamId]);

  const handleSendGift = useCallback(
    (giftId: number, giftName: string) => {
      if (!stream) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBurst({ id: giftId, name: giftName });
      setShowGifts(false);
      sendGift.mutate({
        data: { streamId: stream.id, receiverId: stream.hostId, giftId, quantity: 1 },
      });
    },
    [stream]
  );

  if (streamLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!stream) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>Stream not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backPill, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const giftTrayY = giftTrayAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] });

  return (
    <View style={[styles.container, { backgroundColor: '#050014' }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── Video Area ── */}
        <View style={styles.videoArea}>
          <LinearGradient colors={['#1A0A33', '#050014', '#0D0025']} style={styles.videoPlaceholder}>
            {/* Neon ring frame */}
            <View style={styles.neonRing}>
              <Animated.View style={styles.neonRingInner}>
                <Ionicons name="videocam" size={64} color="#FF2D78" style={{ opacity: 0.7 }} />
              </Animated.View>
            </View>
          </LinearGradient>

          {/* Scanlines effect */}
          <View style={styles.scanlines} pointerEvents="none" />

          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.streamInfo}>
              <LinearGradient colors={['#FF2D78', '#BF00FF']} style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </LinearGradient>
              <View style={[styles.viewerPill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <Ionicons name="eye" size={14} color="#fff" />
                <Text style={styles.viewerCount}>{stream.viewerCount.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Host info bottom-left of video */}
          <View style={styles.hostInfo}>
            <View style={styles.hostAvatar}>
              <Text style={{ fontSize: 20 }}>
                {stream.hostDisplayName?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.hostName}>{stream.hostDisplayName}</Text>
              <Text style={styles.coinsEarned}>
                {(stream.totalCoinsEarned ?? 0).toLocaleString()} coins earned
              </Text>
            </View>
          </View>

          {/* Chat overlay — right side, bottom-aligned */}
          <View style={styles.chatOverlay} pointerEvents="box-none">
            <FlatList
              ref={chatRef}
              data={messages.slice(-20)}
              keyExtractor={(m) => String(m.id)}
              style={styles.chatList}
              contentContainerStyle={styles.chatListContent}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.chatRow}>
                  <LinearGradient
                    colors={['rgba(5,0,20,0.85)', 'rgba(13,0,37,0.85)']}
                    style={styles.chatBubble}
                  >
                    <Text style={styles.chatUser} numberOfLines={1}>{item.userDisplayName}</Text>
                    <Text style={styles.chatMsg}>{item.content}</Text>
                  </LinearGradient>
                </View>
              )}
            />
          </View>

          {/* Locked media strip — bottom of video */}
          {lockedMedia.length > 0 && (
            <View style={styles.lockedStrip}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 8 }}>
                {lockedMedia.map((m) => (
                  <LockedMediaCard key={m.id} item={m} colors={colors} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── Bottom Panel ── */}
        <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 8 }]}>
          {/* Gift tray */}
          <Animated.View style={[styles.giftTray, { transform: [{ translateY: giftTrayY }], opacity: giftTrayAnim }]}>
            <FlatList
              data={gifts}
              keyExtractor={(g) => String(g.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.giftList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.giftItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleSendGift(item.id, item.name)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.giftEmoji}>🎁</Text>
                  <Text style={[styles.giftName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.giftCost, { backgroundColor: '#FFD70020' }]}>
                    <Ionicons name="diamond" size={10} color="#FFD700" />
                    <Text style={styles.giftCostText}>{item.coinCost}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </Animated.View>

          {/* Chat input row */}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.chatInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Say something..."
              placeholderTextColor={colors.mutedForeground}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: message.trim() ? colors.primary : colors.muted }]}
              onPress={handleSendMessage}
              disabled={!message.trim()}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.giftBtn, { backgroundColor: showGifts ? '#FF2D78' : colors.card, borderColor: '#FF2D78' }]}
              onPress={() => setShowGifts((v) => !v)}
            >
              <Text style={{ fontSize: 22 }}>🎁</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Gift burst overlay */}
      {burst && (
        <GiftBurst giftName={burst.name} onDone={() => setBurst(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  videoArea: { flex: 1, position: 'relative' },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  neonRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#FF2D78',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  neonRingInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: '#BF00FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#BF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)' as any,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamInfo: { flexDirection: 'row', gap: 8 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 12, fontWeight: '700' as const, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  viewerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  viewerCount: { color: '#fff', fontSize: 13, fontWeight: '600' as const, fontFamily: 'Inter_600SemiBold' },
  hostInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF2D78',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BF00FF',
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  hostName: { color: '#fff', fontSize: 14, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  coinsEarned: { color: '#FFD700', fontSize: 11, fontFamily: 'Inter_400Regular' },
  chatOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 100,
    maxHeight: 200,
  },
  chatList: { flex: 1 },
  chatListContent: { paddingHorizontal: 12, gap: 6 },
  chatRow: { alignSelf: 'flex-start', maxWidth: '85%' },
  chatBubble: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chatUser: { color: '#FF2D78', fontSize: 12, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  chatMsg: { color: '#fff', fontSize: 12, fontFamily: 'Inter_400Regular', flexShrink: 1 },
  lockedStrip: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    left: 0,
  },
  lockedCard: {
    width: 72,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  lockedThumb: { height: 56 },
  lockedBlur: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 5,
  },
  unlockBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  bottomPanel: {
    backgroundColor: '#0D0025',
    borderTopWidth: 1,
    borderTopColor: '#2D1B4E',
    paddingTop: 8,
  },
  giftTray: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2D1B4E',
    marginBottom: 8,
  },
  giftList: { paddingHorizontal: 12, gap: 10 },
  giftItem: {
    width: 80,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  giftEmoji: { fontSize: 32 },
  giftName: { fontSize: 11, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  giftCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  giftCostText: { color: '#FFD700', fontSize: 11, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  chatInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  burstOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  burstGradient: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 30,
  },
  burstEmoji: { fontSize: 72 },
  burstName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    marginTop: 16,
    marginBottom: 24,
  },
  backPill: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
});
