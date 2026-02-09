import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { AnalysisPost, getAnalysisPosts } from '@/lib/storage';

function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(ts);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface QuickAction {
  label: string;
  icon: string;
  locked?: boolean;
  gold?: boolean;
  onPress: () => void;
}

export default function HomeScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { isAdmin, userName, loginAdmin, logoutAdmin, setUserNameValue } = useApp();

  const [recentPosts, setRecentPosts] = useState<AnalysisPost[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  const loadData = useCallback(async () => {
    const posts = await getAnalysisPosts('free');
    setRecentPosts(posts.slice(0, 3));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogin = () => {
    if (loginAdmin(password)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPassword('');
      setShowLogin(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Incorrect', 'The admin password is incorrect.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of admin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logoutAdmin();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await setUserNameValue(nameInput.trim());
      setEditingName(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const quickActions: QuickAction[] = [
    {
      label: 'Free Analysis',
      icon: 'analytics-outline',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/free' as any);
      },
    },
    {
      label: 'Gold VIP',
      icon: 'diamond-outline',
      locked: true,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/subscribe' as any);
      },
    },
    {
      label: '4 Markets',
      icon: 'bar-chart-outline',
      locked: true,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/subscribe' as any);
      },
    },
    {
      label: 'Education',
      icon: 'school-outline',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/free' as any);
      },
    },
    {
      label: 'Traders Hub',
      icon: 'briefcase-outline',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/chat' as any);
      },
    },
    {
      label: 'Subscribe',
      icon: 'card-outline',
      gold: true,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/subscribe' as any);
      },
    },
  ];

  const displayName = userName || 'Trader';

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16 + webTopInset,
            paddingBottom: Platform.OS === 'web' ? 84 : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('@/assets/images/mj-logo.jpeg')}
              style={styles.logo}
            />
            <Text style={[styles.brandName, { color: c.gold }]}>MJliquidity</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setNameInput(userName);
              setShowSettings(true);
            }}
            hitSlop={12}
          >
            <View style={[styles.settingsBtn, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Ionicons name="settings-outline" size={20} color={c.textSecondary} />
            </View>
          </Pressable>
        </View>

        <View style={styles.greetingSection}>
          <Text style={[styles.greetingText, { color: c.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.greetingName, { color: c.text }]}>{displayName}</Text>
        </View>

        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: c.card,
                  borderColor: action.gold ? c.gold : c.cardBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {action.gold ? (
                <LinearGradient
                  colors={['rgba(201, 168, 76, 0.15)', 'rgba(201, 168, 76, 0.05)']}
                  style={styles.actionCardGradient}
                />
              ) : null}
              <View style={[
                styles.actionIconWrap,
                { backgroundColor: action.gold ? c.goldMuted : c.goldSubtle },
              ]}>
                <Ionicons
                  name={action.icon as any}
                  size={24}
                  color={action.gold ? c.gold : c.textSecondary}
                />
                {action.locked && (
                  <View style={[styles.lockBadge, { backgroundColor: c.gold }]}>
                    <Ionicons name="lock-closed" size={8} color="#0A0A0A" />
                  </View>
                )}
              </View>
              <Text style={[
                styles.actionLabel,
                { color: action.gold ? c.gold : c.text },
              ]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Latest Free Analysis</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/free' as any);
              }}
            >
              <Text style={[styles.seeAllText, { color: c.gold }]}>See All</Text>
            </Pressable>
          </View>

          {recentPosts.length > 0 ? (
            recentPosts.map((post) => (
              <View
                key={post.id}
                style={[styles.recentCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
              >
                <View style={styles.recentCardTop}>
                  <View style={[styles.categoryBadge, { backgroundColor: c.goldMuted }]}>
                    <Text style={[styles.categoryText, { color: c.gold }]}>
                      {post.category.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.timeText, { color: c.textMuted }]}>
                    {formatTime(post.timestamp)}
                  </Text>
                </View>
                <Text
                  style={[styles.recentTitle, { color: c.text }]}
                  numberOfLines={2}
                >
                  {post.title}
                </Text>
              </View>
            ))
          ) : (
            <View style={[styles.emptyRecent, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Ionicons name="analytics-outline" size={28} color={c.textMuted} />
              <Text style={[styles.emptyRecentText, { color: c.textMuted }]}>
                No analysis posts yet
              </Text>
            </View>
          )}
        </View>

        <View style={styles.disclaimerSection}>
          <View style={[styles.disclaimerDivider, { backgroundColor: c.border }]} />
          <Text style={[styles.disclaimerText, { color: c.textMuted }]}>
            MJliquidity{'\u2122'} - Trading involves significant risk. Past performance is not
            indicative of future results. Always do your own research before making
            investment decisions.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.settingsModal, { backgroundColor: c.surface }]}>
            <View style={styles.modalHandle}>
              <View style={[styles.handleBar, { backgroundColor: c.textMuted }]} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Settings</Text>
              <Pressable
                onPress={() => {
                  setShowSettings(false);
                  setShowLogin(false);
                  setEditingName(false);
                  setPassword('');
                }}
                hitSlop={12}
              >
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: c.textMuted }]}>PROFILE</Text>
                <View style={[styles.settingsCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  {editingName ? (
                    <View style={styles.editNameRow}>
                      <TextInput
                        placeholder="Your display name"
                        placeholderTextColor={c.textMuted}
                        style={[styles.nameInput, { color: c.text, backgroundColor: c.inputBackground, borderColor: c.inputBorder }]}
                        value={nameInput}
                        onChangeText={setNameInput}
                        autoFocus
                      />
                      <Pressable onPress={handleSaveName} style={[styles.saveBtn, { backgroundColor: c.gold }]}>
                        <Ionicons name="checkmark" size={18} color="#0A0A0A" />
                      </Pressable>
                      <Pressable onPress={() => { setEditingName(false); setNameInput(userName); }} hitSlop={8}>
                        <Ionicons name="close" size={20} color={c.textMuted} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => { setNameInput(userName); setEditingName(true); }}
                      style={styles.settingsRow}
                    >
                      <View style={styles.settingsRowLeft}>
                        <Ionicons name="person-outline" size={20} color={c.textSecondary} />
                        <View>
                          <Text style={[styles.settingsLabel, { color: c.text }]}>Display Name</Text>
                          <Text style={[styles.settingsValue, { color: c.textMuted }]}>
                            {userName || 'Not set'}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: c.textMuted }]}>ADMIN</Text>
                <View style={[styles.settingsCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  {isAdmin ? (
                    <>
                      <View style={styles.settingsRow}>
                        <View style={styles.settingsRowLeft}>
                          <Ionicons name="shield-checkmark" size={20} color={c.gold} />
                          <View>
                            <Text style={[styles.settingsLabel, { color: c.text }]}>Admin Mode</Text>
                            <Text style={[styles.settingsValue, { color: c.success }]}>Active</Text>
                          </View>
                        </View>
                      </View>
                      <View style={[styles.divider, { backgroundColor: c.border }]} />
                      <Pressable onPress={handleLogout} style={styles.settingsRow}>
                        <View style={styles.settingsRowLeft}>
                          <Ionicons name="log-out-outline" size={20} color={c.error} />
                          <Text style={[styles.settingsLabel, { color: c.error }]}>Log Out</Text>
                        </View>
                      </Pressable>
                    </>
                  ) : showLogin ? (
                    <View style={styles.loginSection}>
                      <Text style={[styles.loginTitle, { color: c.text }]}>Admin Login</Text>
                      <TextInput
                        placeholder="Enter admin password"
                        placeholderTextColor={c.textMuted}
                        style={[styles.passwordInput, { color: c.text, backgroundColor: c.inputBackground, borderColor: c.inputBorder }]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoFocus
                      />
                      <View style={styles.loginBtnRow}>
                        <Pressable onPress={handleLogin} style={[styles.loginBtn, { backgroundColor: c.gold }]}>
                          <Text style={[styles.loginBtnText, { color: '#0A0A0A' }]}>Login</Text>
                        </Pressable>
                        <Pressable onPress={() => { setShowLogin(false); setPassword(''); }}>
                          <Text style={[styles.cancelText, { color: c.textMuted }]}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable onPress={() => setShowLogin(true)} style={styles.settingsRow}>
                      <View style={styles.settingsRowLeft}>
                        <Ionicons name="lock-closed-outline" size={20} color={c.textSecondary} />
                        <View>
                          <Text style={[styles.settingsLabel, { color: c.text }]}>Admin Login</Text>
                          <Text style={[styles.settingsValue, { color: c.textMuted }]}>
                            Access admin features
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: c.textMuted }]}>ABOUT</Text>
                <View style={[styles.settingsCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                  <View style={styles.settingsRow}>
                    <View style={styles.settingsRowLeft}>
                      <Ionicons name="information-circle-outline" size={20} color={c.textSecondary} />
                      <View>
                        <Text style={[styles.settingsLabel, { color: c.text }]}>MJ Liquidity</Text>
                        <Text style={[styles.settingsValue, { color: c.textMuted }]}>
                          Trading Community v1.0
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.3,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSection: {
    marginBottom: 28,
  },
  greetingText: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 26,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    width: '47.5%' as any,
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  actionCardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
  recentSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  recentCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  recentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
  },
  recentTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    lineHeight: 21,
  },
  emptyRecent: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyRecentText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
  },
  disclaimerSection: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  disclaimerDivider: {
    height: 1,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  settingsValue: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  saveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginSection: {
    padding: 16,
    gap: 12,
  },
  loginTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  passwordInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  loginBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  loginBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 12,
  },
  loginBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
});
