import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';

const PROP_FIRMS = [
  {
    name: 'MJ-Markets',
    description: 'Funded trading challenges',
    discount: 'VIP20',
    url: '',
  },
];

const BROKERS = [
  {
    name: 'Trusted Broker Partner',
    description: 'Reliable execution and tight spreads',
    url: '',
  },
];

const MEMBERSHIP_TIERS = [
  {
    name: 'Gold VIP',
    price: '75',
    description: 'Full Gold institutional analysis',
    features: ['XAUUSD liquidity zones & reaction areas', 'Daily scenario mapping', 'Members-only Gold chat'],
  },
  {
    name: 'Pro (4 Markets)',
    price: '75',
    description: 'Multi-asset coverage',
    features: ['NQ, ES, BTC, XAU analysis', 'Consolidated institutional analysis', 'Members-only Pro chat'],
  },
  {
    name: 'All Access',
    price: '99',
    description: 'Everything unlocked',
    features: ['Gold VIP + 4 Markets', 'All premium content', 'All members-only chats'],
    isBestValue: true,
  },
];

function openLink(url: string) {
  if (!url) {
    Alert.alert('Coming Soon', 'This link will be available soon.');
    return;
  }
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link.'));
}

export default function TradersHubScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { subscriptionUrl } = useApp();

  const handleSubscribe = () => {
    if (subscriptionUrl) {
      openLink(subscriptionUrl);
    } else {
      Alert.alert('Coming Soon', 'Subscription links will be available soon.');
    }
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 12 + webTopInset,
            paddingBottom: Platform.OS === 'web' ? 84 : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Ionicons name="briefcase" size={20} color={c.gold} />
          <Text style={[styles.headerTitle, { color: c.gold }]}>Traders Hub</Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>
          Everything you need to execute
        </Text>

        <Text style={[styles.sectionTitle, { color: c.text }]}>MJliquidity Memberships</Text>
        <View style={styles.tiersSection}>
          {MEMBERSHIP_TIERS.map((tier, index) => (
            <View
              key={index}
              style={[
                styles.tierCard,
                {
                  backgroundColor: c.card,
                  borderColor: tier.isBestValue ? c.gold : c.cardBorder,
                  borderWidth: tier.isBestValue ? 2 : 1,
                },
              ]}
            >
              {tier.isBestValue && (
                <View style={[styles.bestValueBadge, { backgroundColor: c.gold }]}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
              )}
              <Text style={[styles.tierName, { color: c.text }]}>{tier.name}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.tierPrice, { color: c.gold }]}>{tier.price}</Text>
                <Text style={[styles.tierPricePeriod, { color: c.textMuted }]}>/month</Text>
              </View>
              <Text style={[styles.tierDescription, { color: c.textSecondary }]}>{tier.description}</Text>
              <View style={styles.featuresList}>
                {tier.features.map((feature, fIndex) => (
                  <View key={fIndex} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={c.gold} />
                    <Text style={[styles.featureText, { color: c.textSecondary }]}>{feature}</Text>
                  </View>
                ))}
              </View>
              <Pressable onPress={handleSubscribe} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
                <LinearGradient
                  colors={tier.isBestValue ? [c.gold, c.goldDark] : [c.surfaceElevated, c.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tierBtn}
                >
                  <Text style={[styles.tierBtnText, { color: tier.isBestValue ? '#0A0A0A' : c.gold }]}>Subscribe</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Prop / Funded Challenges</Text>
        {PROP_FIRMS.map((firm, index) => (
          <Pressable
            key={index}
            onPress={() => openLink(firm.url)}
            style={[styles.linkCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
          >
            <View style={styles.linkCardLeft}>
              <View style={[styles.linkIcon, { backgroundColor: c.goldMuted }]}>
                <Ionicons name="trophy-outline" size={20} color={c.gold} />
              </View>
              <View style={styles.linkCardText}>
                <Text style={[styles.linkCardTitle, { color: c.text }]}>{firm.name}</Text>
                <Text style={[styles.linkCardDesc, { color: c.textMuted }]}>{firm.description}</Text>
              </View>
            </View>
            <View style={styles.linkCardRight}>
              {firm.discount ? (
                <View style={[styles.discountBadge, { backgroundColor: c.goldMuted }]}>
                  <Text style={[styles.discountText, { color: c.gold }]}>{firm.discount}</Text>
                </View>
              ) : null}
              <Feather name="arrow-right" size={18} color={c.textMuted} />
            </View>
          </Pressable>
        ))}

        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24 }]}>Brokers</Text>
        {BROKERS.map((broker, index) => (
          <Pressable
            key={index}
            onPress={() => openLink(broker.url)}
            style={[styles.linkCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
          >
            <View style={styles.linkCardLeft}>
              <View style={[styles.linkIcon, { backgroundColor: c.goldMuted }]}>
                <Ionicons name="business-outline" size={20} color={c.gold} />
              </View>
              <View style={styles.linkCardText}>
                <Text style={[styles.linkCardTitle, { color: c.text }]}>{broker.name}</Text>
                <Text style={[styles.linkCardDesc, { color: c.textMuted }]}>{broker.description}</Text>
              </View>
            </View>
            <Feather name="arrow-right" size={18} color={c.textMuted} />
          </Pressable>
        ))}

        <View style={[styles.disclaimerSection, { borderColor: c.border }]}>
          <Text style={[styles.disclaimerTitle, { color: c.textMuted }]}>MJliquidity Disclaimer</Text>
          <Text style={[styles.disclaimerText, { color: c.textMuted }]}>
            MJliquidity provides market analysis, educational content, and informational tools only.
            We do not provide financial advice, investment advice, portfolio management, or trading recommendations.
            All content shared inside the app is for educational and informational purposes only.
            Trading financial markets involves significant risk. Past performance does not guarantee future results.
            You may lose part or all of your capital. You are solely responsible for your own trading decisions and risk management.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 28, fontFamily: 'DMSans_700Bold', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginTop: 4, marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', marginBottom: 14 },
  tiersSection: { gap: 14, marginBottom: 32 },
  tierCard: { borderRadius: 16, padding: 20, overflow: 'hidden' },
  bestValueBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 14, paddingVertical: 6, borderBottomLeftRadius: 12 },
  bestValueText: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: '#0A0A0A', letterSpacing: 1 },
  tierName: { fontSize: 20, fontFamily: 'DMSans_700Bold', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginBottom: 6 },
  tierPrice: { fontSize: 32, fontFamily: 'DMSans_700Bold' },
  tierPricePeriod: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  tierDescription: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginBottom: 14 },
  featuresList: { gap: 8, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, fontFamily: 'DMSans_400Regular', flex: 1 },
  tierBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  tierBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  linkCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  linkCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  linkIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkCardText: { flex: 1 },
  linkCardTitle: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', marginBottom: 2 },
  linkCardDesc: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
  linkCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  discountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  discountText: { fontSize: 11, fontFamily: 'DMSans_700Bold', letterSpacing: 0.5 },
  disclaimerSection: { marginTop: 32, paddingTop: 20, borderTopWidth: 1 },
  disclaimerTitle: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  disclaimerText: { fontSize: 11, fontFamily: 'DMSans_400Regular', lineHeight: 18 },
});
