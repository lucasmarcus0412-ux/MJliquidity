import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
  Linking,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import {
  EducationPost,
  getEducationPosts,
  addEducationPost,
  deleteEducationPost,
} from '@/lib/storage';
import { useFocusEffect } from 'expo-router';

type ActiveSection = 'main' | 'education';

const MEMBERSHIP_TIERS = [
  {
    name: 'Gold VIP',
    price: '75',
    description: 'Full Gold market analysis',
    features: ['XAUUSD liquidity zones & reaction areas', 'Daily scenario mapping', 'Members-only Gold chat'],
  },
  {
    name: 'Pro (4 Markets)',
    price: '75',
    description: 'Multi-asset coverage',
    features: ['NQ, ES, BTC, XAU analysis', 'Consolidated market analysis', 'Members-only Pro chat'],
  },
  {
    name: 'All Access',
    price: '99',
    description: 'Everything unlocked',
    features: ['Gold VIP + 4 Markets', 'All premium content', 'All members-only chats'],
    isBestValue: true,
  },
];

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
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function ProfileScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { isAdmin, isModerator, userName, subscriptionUrl, loginAdmin, logoutAdmin, setUserNameValue, moderators, addModeratorByName, removeModeratorById } = useApp();

  const [activeSection, setActiveSection] = useState<ActiveSection>('main');
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [educationPosts, setEducationPosts] = useState<EducationPost[]>([]);
  const [refreshingEdu, setRefreshingEdu] = useState(false);
  const [showComposeEdu, setShowComposeEdu] = useState(false);
  const [eduTitle, setEduTitle] = useState('');
  const [eduContent, setEduContent] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showModManager, setShowModManager] = useState(false);
  const [modNameInput, setModNameInput] = useState('');

  const loadEducation = useCallback(async () => {
    const data = await getEducationPosts();
    setEducationPosts(data);
  }, []);

  useFocusEffect(
    useCallback(() => { loadEducation(); }, [loadEducation])
  );

  const handleLogin = () => {
    if (loginAdmin(password)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPassword(''); setShowLogin(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Incorrect', 'The admin password is incorrect.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of admin?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { logoutAdmin(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }},
    ]);
  };

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await setUserNameValue(nameInput.trim());
      setEditingName(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSubscribe = () => {
    if (subscriptionUrl) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Linking.openURL(subscriptionUrl).catch(() => Alert.alert('Error', 'Could not open link.'));
    } else {
      Alert.alert('Coming Soon', 'Subscription links will be available soon.');
    }
  };

  const handlePostEdu = async () => {
    if (!eduTitle.trim() || !eduContent.trim()) {
      Alert.alert('Missing Info', 'Please add a title and content.');
      return;
    }
    await addEducationPost({ title: eduTitle.trim(), content: eduContent.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEduTitle(''); setEduContent(''); setShowComposeEdu(false);
    await loadEducation();
  };

  const handleDeleteEdu = (id: string) => {
    Alert.alert('Delete Post', 'Remove this education post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteEducationPost(id);
        await loadEducation();
      }},
    ]);
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const displayName = userName || 'Trader';

  if (activeSection === 'education') {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
          <View style={styles.headerLeftRow}>
            <Pressable onPress={() => setActiveSection('main')} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={c.textSecondary} />
            </Pressable>
            <View>
              <Text style={[styles.headerTitle, { color: c.gold }]}>Education</Text>
              <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>Trading Knowledge</Text>
            </View>
          </View>
          {isAdmin && (
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowComposeEdu(true); }}
              style={[styles.composeBtn, { backgroundColor: c.gold }]}
            >
              <Ionicons name="add" size={22} color="#0A0A0A" />
            </Pressable>
          )}
        </View>

        <FlatList
          data={educationPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.eduCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={styles.eduCardHeader}>
                <View style={[styles.eduBadge, { backgroundColor: c.goldMuted }]}>
                  <Ionicons name="school-outline" size={14} color={c.gold} />
                  <Text style={[styles.eduBadgeText, { color: c.gold }]}>EDUCATION</Text>
                </View>
                <View style={styles.eduCardHeaderRight}>
                  <Text style={[styles.timeText, { color: c.textMuted }]}>{formatTime(item.timestamp)}</Text>
                  {isAdmin && (
                    <Pressable onPress={() => handleDeleteEdu(item.id)} hitSlop={12}>
                      <Ionicons name="trash-outline" size={16} color={c.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>
              <Text style={[styles.eduCardTitle, { color: c.text }]}>{item.title}</Text>
              <Text style={[styles.eduCardContent, { color: c.textSecondary }]}>{item.content}</Text>
              <View style={styles.eduCardFooter}>
                <View style={[styles.adminDot, { backgroundColor: c.gold }]} />
                <Text style={[styles.adminLabel, { color: c.goldLight }]}>MJliquidity</Text>
              </View>
            </View>
          )}
          contentContainerStyle={[styles.eduListContent, { paddingBottom: Platform.OS === 'web' ? 84 : 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshingEdu} onRefresh={async () => { setRefreshingEdu(true); await loadEducation(); setRefreshingEdu(false); }} tintColor={c.gold} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color={c.textMuted} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>No Education Posts Yet</Text>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>Trading strategies and educational content will appear here</Text>
            </View>
          }
        />

        <Modal visible={showComposeEdu} animationType="slide" transparent>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalOverlay}>
              <View style={[styles.composeModal, { backgroundColor: c.surface }]}>
                <View style={styles.composeHeader}>
                  <Pressable onPress={() => setShowComposeEdu(false)} hitSlop={12}>
                    <Ionicons name="close" size={24} color={c.textSecondary} />
                  </Pressable>
                  <Text style={[styles.composeTitle, { color: c.text }]}>New Education Post</Text>
                  <Pressable onPress={handlePostEdu} style={[styles.postBtn, { backgroundColor: c.gold }]}>
                    <Text style={[styles.postBtnText, { color: '#0A0A0A' }]}>Post</Text>
                  </Pressable>
                </View>
                <TextInput
                  placeholder="Title"
                  placeholderTextColor={c.textMuted}
                  style={[styles.titleInput, { color: c.text, borderBottomColor: c.border }]}
                  value={eduTitle}
                  onChangeText={setEduTitle}
                />
                <TextInput
                  placeholder="Write your educational content..."
                  placeholderTextColor={c.textMuted}
                  style={[styles.contentInput, { color: c.text }]}
                  value={eduContent}
                  onChangeText={setEduContent}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: insets.top + 12 + webTopInset,
          paddingBottom: Platform.OS === 'web' ? 84 : 120,
        }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: c.goldMuted, borderColor: c.gold }]}>
            <Text style={[styles.avatarText, { color: c.gold }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: c.text }]}>{displayName}</Text>
          {isAdmin && (
            <View style={[styles.adminIndicator, { backgroundColor: c.goldMuted }]}>
              <Ionicons name="shield-checkmark" size={12} color={c.gold} />
              <Text style={[styles.adminIndicatorText, { color: c.gold }]}>Admin</Text>
            </View>
          )}
          {!isAdmin && isModerator && (
            <View style={[styles.adminIndicator, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
              <Ionicons name="shield-half-outline" size={12} color="#4CAF50" />
              <Text style={[styles.adminIndicatorText, { color: '#4CAF50' }]}>Moderator</Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>SUBSCRIPTIONS</Text>
        <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          {MEMBERSHIP_TIERS.map((tier, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
              <Pressable onPress={handleSubscribe} style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <Ionicons name={tier.isBestValue ? 'star' : 'diamond-outline'} size={20} color={tier.isBestValue ? c.gold : c.textSecondary} />
                  <View>
                    <Text style={[styles.settingsLabel, { color: c.text }]}>{tier.name}</Text>
                    <Text style={[styles.settingsValue, { color: c.textMuted }]}>{tier.price}/month</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
              </Pressable>
            </React.Fragment>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>LEARN</Text>
        <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveSection('education'); }} style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="book-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Education</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>Trading knowledge & strategies</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>SETTINGS</Text>
        <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
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
            <Pressable onPress={() => { setNameInput(userName); setEditingName(true); }} style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <Ionicons name="person-outline" size={20} color={c.textSecondary} />
                <View>
                  <Text style={[styles.settingsLabel, { color: c.text }]}>Display Name</Text>
                  <Text style={[styles.settingsValue, { color: c.textMuted }]}>{userName || 'Not set'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            </Pressable>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>ADMIN</Text>
        <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
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
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowModManager(true); }} style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <Ionicons name="people-outline" size={20} color={c.textSecondary} />
                  <View>
                    <Text style={[styles.settingsLabel, { color: c.text }]}>Manage Moderators</Text>
                    <Text style={[styles.settingsValue, { color: c.textMuted }]}>{moderators.length} active</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
              </Pressable>
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
                  <Text style={[styles.settingsValue, { color: c.textMuted }]}>Access admin features</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            </Pressable>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>CONTACT</Text>
        <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL('mailto:support@mjliquidity.com'); }} style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="mail-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Contact Us</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>support@mjliquidity.com</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>LEGAL</Text>
        <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Pressable onPress={() => setShowDisclaimer(true)} style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="document-text-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Disclaimer</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>Not financial advice</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Pressable onPress={() => setShowGuidelines(true)} style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="chatbubbles-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Community Guidelines</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>Chat rules & conduct</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="information-circle-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>MJliquidity</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>Trading Community v1.0</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showModManager} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalOverlay}>
            <View style={[styles.composeModal, { backgroundColor: c.surface }]}>
              <View style={styles.composeHeader}>
                <Pressable onPress={() => { setShowModManager(false); setModNameInput(''); }} hitSlop={12}>
                  <Ionicons name="close" size={24} color={c.textSecondary} />
                </Pressable>
                <Text style={[styles.composeTitle, { color: c.text }]}>Manage Moderators</Text>
                <View style={{ width: 44 }} />
              </View>

              <Text style={[styles.modSectionTitle, { color: c.textMuted }]}>ADD MODERATOR</Text>
              <View style={styles.modAddRow}>
                <TextInput
                  placeholder="Enter display name"
                  placeholderTextColor={c.textMuted}
                  style={[styles.nameInput, { color: c.text, backgroundColor: c.inputBackground, borderColor: c.inputBorder, flex: 1 }]}
                  value={modNameInput}
                  onChangeText={setModNameInput}
                />
                <Pressable
                  onPress={async () => {
                    if (!modNameInput.trim()) { Alert.alert('Missing Name', 'Please enter a display name.'); return; }
                    await addModeratorByName(modNameInput.trim());
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setModNameInput('');
                  }}
                  style={[styles.saveBtn, { backgroundColor: c.gold }]}
                >
                  <Ionicons name="add" size={20} color="#0A0A0A" />
                </Pressable>
              </View>

              <Text style={[styles.modSectionTitle, { color: c.textMuted, marginTop: 20 }]}>ACTIVE MODERATORS</Text>
              <ScrollView style={styles.modList} showsVerticalScrollIndicator={false}>
                {moderators.length === 0 ? (
                  <Text style={[styles.modEmptyText, { color: c.textMuted }]}>No moderators assigned yet</Text>
                ) : (
                  moderators.map((mod) => (
                    <View key={mod.id} style={[styles.modRow, { borderBottomColor: c.border }]}>
                      <View style={styles.modRowLeft}>
                        <View style={[styles.modAvatar, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                          <Ionicons name="shield-half-outline" size={14} color="#4CAF50" />
                        </View>
                        <View>
                          <Text style={[styles.settingsLabel, { color: c.text }]}>{mod.username}</Text>
                          <Text style={[styles.settingsValue, { color: c.textMuted }]}>
                            Added {new Date(mod.addedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => {
                          Alert.alert('Remove Moderator', `Remove ${mod.username} as moderator?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', style: 'destructive', onPress: async () => {
                              await removeModeratorById(mod.id);
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }},
                          ]);
                        }}
                        hitSlop={12}
                      >
                        <Ionicons name="trash-outline" size={18} color={c.error} />
                      </Pressable>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={[styles.modInfoBox, { backgroundColor: c.goldMuted }]}>
                <Ionicons name="information-circle-outline" size={16} color={c.gold} />
                <Text style={[styles.modInfoText, { color: c.goldLight }]}>
                  Moderators can delete chat messages but cannot post analysis.
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showDisclaimer} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.legalModal, { backgroundColor: c.surface }]}>
            <View style={styles.legalModalHeader}>
              <Text style={[styles.legalModalTitle, { color: c.gold }]}>MJliquidity Disclaimer</Text>
              <Pressable onPress={() => setShowDisclaimer(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.legalScroll}>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                MJliquidity provides market analysis, educational content, and informational tools only.
              </Text>
              <Text style={[styles.legalText, { color: c.textSecondary, marginTop: 12 }]}>
                We do not provide financial advice, investment advice, portfolio management, or trading recommendations.
              </Text>
              <Text style={[styles.legalText, { color: c.textSecondary, marginTop: 12 }]}>
                All content shared inside the app, including charts, levels, scenarios, commentary, or educational material, is for educational and informational purposes only and should not be considered financial advice or a solicitation to buy or sell any financial instrument.
              </Text>
              <Text style={[styles.legalText, { marginTop: 16, fontFamily: 'DMSans_600SemiBold', color: c.text }]}>
                Trading financial markets involves significant risk.{'\n'}Past performance does not guarantee future results.{'\n'}You may lose part or all of your capital.
              </Text>
              <Text style={[styles.legalText, { color: c.textSecondary, marginTop: 12 }]}>
                You are solely responsible for your own trading decisions and risk management.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showGuidelines} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.legalModal, { backgroundColor: c.surface }]}>
            <View style={styles.legalModalHeader}>
              <Text style={[styles.legalModalTitle, { color: c.gold }]}>Community Guidelines</Text>
              <Pressable onPress={() => setShowGuidelines(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.legalScroll}>
              {[
                'Respectful discussion only',
                'No signals or "calls"',
                'No promoting other groups',
                'No spam',
                'No financial advice',
                'Analysis & education focused',
              ].map((rule, i) => (
                <View key={i} style={styles.guidelineRow}>
                  <View style={[styles.guidelineDot, { backgroundColor: c.gold }]} />
                  <Text style={[styles.guidelineText, { color: c.textSecondary }]}>{rule}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  headerLeftRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 28, fontFamily: 'DMSans_700Bold', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  composeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontFamily: 'DMSans_700Bold' },
  profileName: { fontSize: 22, fontFamily: 'DMSans_700Bold', marginBottom: 6 },
  adminIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  adminIndicatorText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  sectionLabel: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4, marginTop: 8 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsLabel: { fontSize: 15, fontFamily: 'DMSans_500Medium' },
  settingsValue: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  divider: { height: 1, marginHorizontal: 14 },
  editNameRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  nameInput: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, fontFamily: 'DMSans_400Regular' },
  saveBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  loginSection: { padding: 14 },
  loginTitle: { fontSize: 16, fontFamily: 'DMSans_600SemiBold', marginBottom: 12 },
  passwordInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, fontFamily: 'DMSans_400Regular', marginBottom: 12 },
  loginBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  loginBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  loginBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  cancelText: { fontSize: 14, fontFamily: 'DMSans_500Medium' },
  eduCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  eduCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eduCardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eduBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  eduBadgeText: { fontSize: 10, fontFamily: 'DMSans_700Bold', letterSpacing: 1 },
  eduCardTitle: { fontSize: 17, fontFamily: 'DMSans_700Bold', marginBottom: 6, lineHeight: 22 },
  eduCardContent: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 21, marginBottom: 12 },
  eduCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminDot: { width: 6, height: 6, borderRadius: 3 },
  adminLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  timeText: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  eduListContent: { paddingHorizontal: 16, gap: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: 'DMSans_600SemiBold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  composeModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: '70%' },
  composeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  composeTitle: { fontSize: 17, fontFamily: 'DMSans_600SemiBold' },
  postBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  titleInput: { fontSize: 20, fontFamily: 'DMSans_700Bold', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 12 },
  contentInput: { fontSize: 15, fontFamily: 'DMSans_400Regular', flex: 1, lineHeight: 22 },
  legalModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  legalModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  legalModalTitle: { fontSize: 20, fontFamily: 'DMSans_700Bold' },
  legalScroll: { paddingBottom: 20 },
  legalText: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 22 },
  guidelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  guidelineDot: { width: 6, height: 6, borderRadius: 3 },
  guidelineText: { fontSize: 15, fontFamily: 'DMSans_400Regular', flex: 1 },
  modSectionTitle: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', letterSpacing: 1, marginBottom: 10 },
  modAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modList: { flex: 1, marginBottom: 12 },
  modEmptyText: { fontSize: 14, fontFamily: 'DMSans_400Regular', paddingVertical: 20, textAlign: 'center' },
  modRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  modRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
  modInfoText: { fontSize: 13, fontFamily: 'DMSans_400Regular', flex: 1 },
});
