import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';

const FEATURES = [
  { icon: 'analytics-outline' as const, title: 'Daily Intraday Analysis', description: 'Expert market breakdowns every trading day' },
  { icon: 'chatbubbles-outline' as const, title: 'Community Chat', description: 'Connect with like-minded traders' },
  { icon: 'notifications-outline' as const, title: 'Live Market Updates', description: 'Real-time alerts on key market moves' },
  { icon: 'school-outline' as const, title: 'Trading Education', description: 'Learn strategies and improve your edge' },
];

export default function SubscribeScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { isAdmin, subscriptionUrl, setSubscriptionUrlValue } = useApp();
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(subscriptionUrl);

  const handleSubscribe = async () => {
    if (!subscriptionUrl) {
      Alert.alert('Coming Soon', 'The subscription link will be available soon.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Linking.openURL(subscriptionUrl);
    } catch {
      Alert.alert('Error', 'Could not open the subscription link.');
    }
  };

  const handleSaveUrl = async () => {
    await setSubscriptionUrlValue(urlInput.trim());
    setEditingUrl(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20 + webTopInset,
            paddingBottom: Platform.OS === 'web' ? 84 : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={[styles.logoCircle, { borderColor: c.gold }]}>
            <Ionicons name="flash" size={32} color={c.gold} />
          </View>
          <Text style={[styles.heroTitle, { color: c.text }]}>MJ Liquidity</Text>
          <Text style={[styles.heroSubtitle, { color: c.gold }]}>Trading Community</Text>
          <Text style={[styles.heroDescription, { color: c.textSecondary }]}>
            Join our exclusive trading community for daily intraday analysis, market updates, and a supportive network of traders.
          </Text>
        </View>

        <View style={styles.featuresSection}>
          {FEATURES.map((feature, index) => (
            <View
              key={index}
              style={[styles.featureCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
            >
              <View style={[styles.featureIconBg, { backgroundColor: c.goldMuted }]}>
                <Ionicons name={feature.icon} size={22} color={c.gold} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: c.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, { color: c.textMuted }]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable onPress={handleSubscribe} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
          <LinearGradient
            colors={[c.gold, c.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subscribeButton}
          >
            <Ionicons name="card-outline" size={20} color="#0A0A0A" />
            <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
            <Feather name="arrow-right" size={18} color="#0A0A0A" />
          </LinearGradient>
        </Pressable>

        <Text style={[styles.priceNote, { color: c.textMuted }]}>
          Monthly pay-as-you-go subscription. Cancel anytime.
        </Text>

        {isAdmin && (
          <View style={[styles.adminSection, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={styles.adminSectionHeader}>
              <Ionicons name="settings-outline" size={18} color={c.gold} />
              <Text style={[styles.adminSectionTitle, { color: c.gold }]}>Admin Settings</Text>
            </View>

            {editingUrl ? (
              <View style={styles.urlEditRow}>
                <TextInput
                  placeholder="Paste your payment link here"
                  placeholderTextColor={c.textMuted}
                  style={[
                    styles.urlInput,
                    { color: c.text, backgroundColor: c.inputBackground, borderColor: c.inputBorder },
                  ]}
                  value={urlInput}
                  onChangeText={setUrlInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <View style={styles.urlBtnRow}>
                  <Pressable
                    onPress={handleSaveUrl}
                    style={[styles.urlSaveBtn, { backgroundColor: c.gold }]}
                  >
                    <Text style={[styles.urlSaveBtnText, { color: '#0A0A0A' }]}>Save</Text>
                  </Pressable>
                  <Pressable onPress={() => { setEditingUrl(false); setUrlInput(subscriptionUrl); }}>
                    <Text style={[styles.urlCancelText, { color: c.textMuted }]}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => { setUrlInput(subscriptionUrl); setEditingUrl(true); }}
                style={[styles.urlDisplayRow, { borderColor: c.border }]}
              >
                <Ionicons name="link-outline" size={16} color={c.textMuted} />
                <Text
                  style={[styles.urlDisplayText, { color: subscriptionUrl ? c.textSecondary : c.textMuted }]}
                  numberOfLines={1}
                >
                  {subscriptionUrl || 'Tap to set payment link'}
                </Text>
                <Feather name="edit-2" size={14} color={c.textMuted} />
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroDescription: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 21,
    paddingHorizontal: 10,
  },
  featuresSection: {
    gap: 10,
    marginBottom: 28,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 18,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  subscribeBtnText: {
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    color: '#0A0A0A',
  },
  priceNote: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  adminSection: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  adminSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  adminSectionTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
  urlEditRow: {
    gap: 10,
  },
  urlInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
  },
  urlBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  urlSaveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 10,
  },
  urlSaveBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
  urlCancelText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  urlDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  urlDisplayText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
});
