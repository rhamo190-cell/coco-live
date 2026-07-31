import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { NeonButton } from '@/components/NeonButton';
import { CountryCodePicker } from '@/components/CountryCodePicker';
import { useAuth } from '@/context/AuthContext';
import { useSendPhoneOtp } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const sendOtp = useSendPhoneOtp();

  const handleSendOtp = () => {
    if (!phone.trim()) return;
    
    sendOtp.mutate(
      { data: { phone: phone.trim(), countryCode } },
      {
        onSuccess: () => {
          router.push({
            pathname: '/(auth)/phone-verify',
            params: { phone: phone.trim(), countryCode },
          });
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
        style={[styles.container, { paddingTop: insets.top + 40 }]}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo area */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#FF2D78', '#BF00FF']}
              style={styles.logo}
            >
              <Text style={styles.logoText}>COCO</Text>
            </LinearGradient>
            <Text style={[styles.tagline, { color: colors.foreground }]}>
              Live Stream. Connect. Earn.
            </Text>
          </View>

          {/* Phone input */}
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.foreground }]}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <CountryCodePicker value={countryCode} onChange={setCountryCode} />
              <TextInput
                style={[
                  styles.phoneInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Enter your phone"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>
            <NeonButton
              title="Send Code"
              onPress={handleSendOtp}
              loading={sendOtp.isPending}
              disabled={!phone.trim()}
              style={styles.button}
            />
          </View>

          {/* Info */}
          <Text style={[styles.info, { color: colors.mutedForeground }]}>
            We'll send you a verification code to confirm your number
          </Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 80,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FF2D78',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500' as const,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: -8,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  phoneInput: {
    flex: 1,
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
  info: {
    marginTop: 40,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
