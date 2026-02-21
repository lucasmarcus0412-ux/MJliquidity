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
import Colors from '@/constants/colors';

const PROP_FIRMS = [
  {
    name: 'MJ-Markets',
    description: 'Funded trading challenges',
    discount: 'VIP20',
    url: 'https://mj-markets.com',
  },
];

const BROKERS = [
  {
    name: 'PU Prime',
    description: 'Exclusive Promotions',
    url: 'https://www.puprime.partners/forex-trading-account/?affid=7522195',
  },
  {
    name: 'Vantage',
    description: 'Award-winning CFD broker',
    url: 'https://vigco.co/la-com/IqU5ltdv',
  },
  {
    name: 'MYFX Markets',
    description: 'Global forex & CFD broker',
    url: 'https://myfxmarkets.com/?ibCode=5002140',
  },
];

const COPY_TRADING = [
  {
    name: 'MJcopier — PU Prime',
    description: 'Copy trade with referral code 26UCDR',
    url: 'https://puprime.onelink.me/O5Jx?af_xp=referral&pid=SHARE&deep_link_value=code-26UCDR|platform-copytrading&deep_link_sub1=spid-907723&af_dp=com.pubusiness.pu%3A%2F%2F&af_force_deeplink=true&campaignCode=DjkYH3BslKWqSRCviNlgqw==',
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

interface LinkItemProps {
  name: string;
  description: string;
  url: string;
  icon: string;
  discount?: string;
}

function LinkItem({ name, description, url, icon, discount }: LinkItemProps) {
  const c = Colors.dark;
  return (
    <Pressable
      onPress={() => openLink(url)}
      style={[styles.linkCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
    >
      <View style={styles.linkCardLeft}>
        <View style={[styles.linkIcon, { backgroundColor: c.goldMuted }]}>
          <Ionicons name={icon as any} size={20} color={c.gold} />
        </View>
        <View style={styles.linkCardText}>
          <Text style={[styles.linkCardTitle, { color: c.text }]}>{name}</Text>
          <Text style={[styles.linkCardDesc, { color: c.textMuted }]}>{description}</Text>
        </View>
      </View>
      <View style={styles.linkCardRight}>
        {discount ? (
          <View style={[styles.discountBadge, { backgroundColor: c.goldMuted }]}>
            <Text style={[styles.discountText, { color: c.gold }]}>{discount}</Text>
          </View>
        ) : null}
        <Feather name="arrow-right" size={18} color={c.textMuted} />
      </View>
    </Pressable>
  );
}

export default function TradingHubScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: insets.top + 12 + webTopInset,
          paddingBottom: Platform.OS === 'web' ? 84 : 120,
        }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Ionicons name="link" size={20} color={c.gold} />
          <Text style={[styles.headerTitle, { color: c.gold }]}>Trading Hub</Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>
          Brokers, Prop Firms & Copy Trading
        </Text>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Trusted Broker Partners</Text>
        {BROKERS.map((broker, i) => (
          <LinkItem key={i} {...broker} icon="business-outline" />
        ))}

        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24 }]}>Prop / Funded Challenges</Text>
        {PROP_FIRMS.map((firm, i) => (
          <LinkItem key={i} {...firm} icon="trophy-outline" />
        ))}

        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 24 }]}>Copy Trading</Text>
        {COPY_TRADING.map((item, i) => (
          <LinkItem key={i} {...item} icon="copy-outline" />
        ))}

        <View style={[styles.disclaimerSection, { borderColor: c.border }]}>
          <Text style={[styles.disclaimerTitle, { color: c.textMuted }]}>MJliquidity Disclaimer</Text>
          <Text style={[styles.disclaimerText, { color: c.textMuted }]}>
            MJliquidity provides market analysis, educational content, and informational tools only.
          </Text>
          <Text style={[styles.disclaimerText, { color: c.textMuted, marginTop: 8 }]}>
            We do not provide financial advice, investment advice, portfolio management, or trading recommendations.
          </Text>
          <Text style={[styles.disclaimerText, { color: c.textMuted, marginTop: 8 }]}>
            All content shared inside the app, including charts, levels, scenarios, commentary, or educational material, is for educational and informational purposes only and should not be considered financial advice or a solicitation to buy or sell any financial instrument.
          </Text>
          <Text style={[styles.disclaimerText, { color: c.textMuted, marginTop: 8 }]}>
            Trading financial markets involves significant risk. Past performance does not guarantee future results. You may lose part or all of your capital.
          </Text>
          <Text style={[styles.disclaimerText, { color: c.textMuted, marginTop: 8 }]}>
            You are solely responsible for your own trading decisions and risk management.
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
