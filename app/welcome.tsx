import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { completeWelcome } = useApp();

  const handleGetStarted = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    completeWelcome();
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.topGlow]} />

      <View style={[styles.content, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 20, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]}>
        <View style={styles.logoSection}>
          <Animated.View
            entering={Platform.OS !== 'web' ? FadeIn.duration(1200) : undefined}
            style={styles.logoContainer}
          >
            <View style={styles.logoGlow} />
            <Image
              source={require('@/assets/images/mj-logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            entering={Platform.OS !== 'web' ? FadeInUp.delay(400).duration(800) : undefined}
            style={styles.brandingContainer}
          >
            <Text style={[styles.trademark, { color: c.gold }]}>MJliquidity™</Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={Platform.OS !== 'web' ? FadeInDown.delay(800).duration(800) : undefined}
          style={styles.bottomSection}
        >
          <View style={styles.featuresRow}>
            <View style={styles.featurePill}>
              <View style={[styles.featureDot, { backgroundColor: c.gold }]} />
              <Text style={[styles.featureText, { color: c.textSecondary }]}>Market Analysis</Text>
            </View>
            <View style={styles.featurePill}>
              <View style={[styles.featureDot, { backgroundColor: c.gold }]} />
              <Text style={[styles.featureText, { color: c.textSecondary }]}>Community</Text>
            </View>
            <View style={styles.featurePill}>
              <View style={[styles.featureDot, { backgroundColor: c.gold }]} />
              <Text style={[styles.featureText, { color: c.textSecondary }]}>VIP Access</Text>
            </View>
          </View>

          <Pressable onPress={handleGetStarted} style={styles.buttonWrapper}>
            <LinearGradient
              colors={[c.gold, c.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.getStartedButton}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </LinearGradient>
          </Pressable>

          <Text style={[styles.disclaimer, { color: c.textMuted }]}>
            Free analysis available for everyone
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
    marginBottom: 24,
  },
  logoGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 130,
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
  },
  logo: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  brandingContainer: {
    alignItems: 'center',
  },
  trademark: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 10,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)',
    backgroundColor: 'rgba(201, 168, 76, 0.05)',
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  featureText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  getStartedButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    color: '#0A0A0A',
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
  },
});
