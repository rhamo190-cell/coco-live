import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { NeonButton } from '@/components/NeonButton';
import { useAuth } from '@/context/AuthContext';
import { useVerifyPhoneOtp } from '@workspace/api-client-react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PhoneVerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; countryCode: string }>();
  const { setToken, setUser } = useAuth();
  const [otp, setOtp] = useState('');
  const verifyOtp = useVerifyPhoneOtp();

  const handleVerify = () => {
    if (!params.phone || otp.length !== 6) return;

    verifyOtp.mutate(
      { data: { phone: params.phone, otp } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          setUser(data.user);
          router.replace('/(main)');
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#050014', '#0D0025', '#1A0A33']}
        style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom }]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Verify Code</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Enter the 6-digit code sent to{'\n'}
              {params.countryCode} {params.phone}
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <NeonButton
              title="Verify"
              onPress={handleVerify}
              loading={verifyOtp.isPending}
              disabled={otp.length !== 6}
              style={styles.button}
            />
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  form: {
    gap: 24,
  },
  input: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    marginTop: 8,
  },
});
