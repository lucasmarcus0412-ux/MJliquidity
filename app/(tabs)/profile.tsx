import React, { useState, useCallback, useRef } from 'react';
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
  Switch,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import {
  EducationPost,
  BannedUser,
  getEducationPosts,
  addEducationPost,
  deleteEducationPost,
  getBannedUsers,
  unbanUser,
} from '@/lib/storage';
import { useFocusEffect } from 'expo-router';
import { getApiUrl } from '@/lib/query-client';
import { getOfferings, purchasePackage, findPackageByProductId, PRODUCT_IDS, getPackagePriceString } from '@/lib/revenuecat';
import type { PurchasesPackage } from 'react-native-purchases';

type ActiveSection = 'main' | 'education';

function resolveImageUrl(uri: string | null | undefined): string | undefined {
  if (!uri) return undefined;
  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:')) return uri;
  if (uri.startsWith('/uploads/')) {
    const base = getApiUrl().replace(/\/$/, '');
    return `${base}${uri}`;
  }
  return uri;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const MEMBERSHIP_TIERS = [
  {
    name: 'Gold Intraday VIP',
    productId: 'mjliquidity.vip.monthly',
    description: 'Full Gold market analysis',
    features: ['XAUUSD liquidity zones & reaction areas', 'Daily scenario mapping', 'Members-only Gold chat'],
  },
  {
    name: '4 Markets Session Analysis',
    productId: 'mjliquidity.analysis.monthly',
    description: 'Multi-asset coverage',
    features: ['NQ, ES, BTC, XAU analysis', 'Consolidated market analysis', 'Members-only Pro chat'],
  },
  {
    name: 'Full Access – Gold + 4 Markets',
    productId: 'mjliquidity.bundle.monthly',
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
  const { isAdmin, isModerator, userName, subscriptionUrl, loginAdmin, logoutAdmin, setUserNameValue, moderators, addModeratorByName, removeModeratorById, isSubscribed, refreshSubscriptionStatus, restorePurchases, notificationPrefs, setNotificationPref } = useApp();

  const scrollRef = useRef<ScrollView>(null);
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
  const [eduContentType, setEduContentType] = useState<'article' | 'video' | 'pdf'>('article');
  const [eduImageUri, setEduImageUri] = useState<string | null>(null);
  const [eduImageBase64, setEduImageBase64] = useState<string | null>(null);
  const [eduLinkUrl, setEduLinkUrl] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  const [showModManager, setShowModManager] = useState(false);
  const [modNameInput, setModNameInput] = useState('');
  const [showBanManager, setShowBanManager] = useState(false);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [availablePackages, setAvailablePackages] = useState<PurchasesPackage[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loadEducation = useCallback(async () => {
    const data = await getEducationPosts();
    setEducationPosts(data);
  }, []);

  const loadOfferings = useCallback(async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const packages = await getOfferings();
      setAvailablePackages(packages);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEducation();
      loadOfferings();
      refreshSubscriptionStatus();
    }, [loadEducation, loadOfferings, refreshSubscriptionStatus])
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

  const handleSubscribe = async (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS === 'web') {
      if (subscriptionUrl) {
        Linking.openURL(subscriptionUrl).catch(() => Alert.alert('Error', 'Could not open link.'));
      } else {
        Alert.alert('Download the App', 'In-app subscriptions are available through the iOS or Android app. Download MJliquidity to subscribe.');
      }
      return;
    }

    let pkg = findPackageByProductId(availablePackages, productId);

    if (!pkg) {
      const freshPackages = await getOfferings();
      setAvailablePackages(freshPackages);
      pkg = findPackageByProductId(freshPackages, productId);
    }

    if (!pkg) {
      if (Platform.OS === 'android') {
        Alert.alert('Subscription Unavailable', 'Unable to load subscriptions from Google Play. Please ensure:\n\n1. You have the latest version of the app\n2. Google Play Store is updated\n3. You are signed in to Google Play\n\nThen restart the app and try again.');
      } else {
        Alert.alert('Not Available', 'This subscription is not available yet. Please make sure you have the latest version of the app installed and try again.');
      }
      return;
    }

    setPurchasing(true);
    try {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        await refreshSubscriptionStatus();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Your subscription is now active. Enjoy your premium content!');
      }
    } catch (error: any) {
      Alert.alert('Purchase Failed', error?.message || 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Restored', 'Your subscriptions have been restored successfully.');
      } else {
        Alert.alert('No Purchases Found', 'No previous subscriptions were found for this account.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const pickEduImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      setEduImageUri(result.assets[0].uri);
      setEduImageBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
    }
  };

  const handlePostEdu = async () => {
    if (!eduTitle.trim()) {
      Alert.alert('Missing Info', 'Please add a title.');
      return;
    }
    if (eduContentType === 'article' && !eduContent.trim()) {
      Alert.alert('Missing Info', 'Please add content for the article.');
      return;
    }
    if ((eduContentType === 'video' || eduContentType === 'pdf') && !eduLinkUrl.trim()) {
      Alert.alert('Missing Link', `Please add a ${eduContentType === 'video' ? 'video' : 'PDF'} link.`);
      return;
    }
    await addEducationPost({
      title: eduTitle.trim(),
      content: eduContent.trim() || eduTitle.trim(),
      contentType: eduContentType,
      imageData: eduImageBase64,
      linkUrl: eduLinkUrl.trim() || null,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEduTitle(''); setEduContent(''); setEduContentType('article'); setEduImageUri(null); setEduImageBase64(null); setEduLinkUrl(''); setShowComposeEdu(false);
    await loadEducation();
  };

  const handleDeleteEdu = async (id: string) => {
    let confirmed = false;
    if (Platform.OS === 'web') {
      confirmed = window.confirm('Remove this education post?');
    } else {
      confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert('Delete Post', 'Remove this education post?', [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
        ]);
      });
    }
    if (confirmed) {
      try {
        await deleteEducationPost(id);
        await loadEducation();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
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
              testID="edu-compose-btn"
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
          renderItem={({ item }) => {
            const resolvedImg = resolveImageUrl(item.imageUri);
            const typeLabel = item.contentType === 'video' ? 'VIDEO' : item.contentType === 'pdf' ? 'PDF' : 'ARTICLE';
            const typeIcon = item.contentType === 'video' ? 'videocam-outline' as const : item.contentType === 'pdf' ? 'document-text-outline' as const : 'school-outline' as const;
            const ytId = item.contentType === 'video' && item.linkUrl ? getYouTubeId(item.linkUrl) : null;
            const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : resolvedImg;

            return (
              <Pressable
                onPress={() => {
                  if (item.linkUrl) {
                    Linking.openURL(item.linkUrl);
                  }
                }}
                style={[styles.eduCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
              >
                {thumbUrl && (
                  <View style={styles.eduThumbnailWrap}>
                    <Image source={{ uri: thumbUrl }} style={styles.eduThumbnail} resizeMode="cover" />
                    {item.contentType === 'video' && (
                      <View style={styles.eduPlayOverlay}>
                        <View style={styles.eduPlayBtn}>
                          <Ionicons name="play" size={28} color="#FFFFFF" />
                        </View>
                      </View>
                    )}
                    {item.contentType === 'pdf' && (
                      <View style={styles.eduPdfOverlay}>
                        <View style={styles.eduPdfBadge}>
                          <Ionicons name="document-text" size={16} color="#FFFFFF" />
                          <Text style={styles.eduPdfBadgeText}>PDF</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
                <View style={{ padding: 14 }}>
                  <View style={styles.eduCardHeader}>
                    <View style={[styles.eduBadge, { backgroundColor: c.goldMuted }]}>
                      <Ionicons name={typeIcon} size={14} color={c.gold} />
                      <Text style={[styles.eduBadgeText, { color: c.gold }]}>{typeLabel}</Text>
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
                  {item.contentType === 'article' && (
                    <Text style={[styles.eduCardContent, { color: c.textSecondary }]}>{item.content}</Text>
                  )}
                  {item.contentType !== 'article' && item.content !== item.title && (
                    <Text style={[styles.eduCardContent, { color: c.textSecondary }]} numberOfLines={2}>{item.content}</Text>
                  )}
                  <View style={styles.eduCardFooter}>
                    <View style={[styles.adminDot, { backgroundColor: c.gold }]} />
                    <Text style={[styles.adminLabel, { color: c.goldLight }]}>MJliquidity</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
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
                  <Pressable onPress={() => { setShowComposeEdu(false); setEduContentType('article'); setEduImageUri(null); setEduImageBase64(null); setEduLinkUrl(''); }} hitSlop={12}>
                    <Ionicons name="close" size={24} color={c.textSecondary} />
                  </Pressable>
                  <Text style={[styles.composeTitle, { color: c.text }]}>New Education Post</Text>
                  <Pressable onPress={handlePostEdu} style={[styles.postBtn, { backgroundColor: c.gold }]}>
                    <Text style={[styles.postBtnText, { color: '#0A0A0A' }]}>Post</Text>
                  </Pressable>
                </View>

                <View style={styles.eduTypeRow}>
                  {(['article', 'video', 'pdf'] as const).map((type) => {
                    const selected = eduContentType === type;
                    const icon = type === 'article' ? 'document-text-outline' as const : type === 'video' ? 'videocam-outline' as const : 'reader-outline' as const;
                    const label = type === 'article' ? 'Article' : type === 'video' ? 'Video' : 'PDF';
                    return (
                      <Pressable
                        key={type}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEduContentType(type); }}
                        style={[styles.eduTypeBtn, { backgroundColor: selected ? c.gold : c.inputBackground, borderColor: selected ? c.gold : c.inputBorder }]}
                      >
                        <Ionicons name={icon} size={16} color={selected ? '#0A0A0A' : c.textMuted} />
                        <Text style={[styles.eduTypeBtnText, { color: selected ? '#0A0A0A' : c.textMuted }]}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  <TextInput
                    placeholder="Title"
                    placeholderTextColor={c.textMuted}
                    style={[styles.titleInput, { color: c.text, borderBottomColor: c.border }]}
                    value={eduTitle}
                    onChangeText={setEduTitle}
                  />

                  {(eduContentType === 'video' || eduContentType === 'pdf') && (
                    <TextInput
                      placeholder={eduContentType === 'video' ? 'Paste YouTube or video link...' : 'Paste PDF link (Google Drive, Dropbox, etc.)...'}
                      placeholderTextColor={c.textMuted}
                      style={[styles.titleInput, { color: c.text, borderBottomColor: c.border }]}
                      value={eduLinkUrl}
                      onChangeText={setEduLinkUrl}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  )}

                  <Pressable onPress={pickEduImage} style={[styles.eduImagePicker, { borderColor: c.inputBorder, backgroundColor: c.inputBackground }]}>
                    {eduImageUri ? (
                      <View style={{ width: '100%' }}>
                        <Image source={{ uri: eduImageUri }} style={styles.eduImagePreview} resizeMode="cover" />
                        <Pressable onPress={() => { setEduImageUri(null); setEduImageBase64(null); }} style={styles.eduImageRemove}>
                          <Ionicons name="close-circle" size={24} color="#FF5252" />
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.eduImagePlaceholder}>
                        <Ionicons name="image-outline" size={32} color={c.textMuted} />
                        <Text style={[styles.eduImagePlaceholderText, { color: c.textMuted }]}>
                          {eduContentType === 'video' ? 'Add custom thumbnail (optional)' : eduContentType === 'pdf' ? 'Add cover image (optional)' : 'Add image (optional)'}
                        </Text>
                      </View>
                    )}
                  </Pressable>

                  <TextInput
                    placeholder={eduContentType === 'article' ? 'Write your educational content...' : 'Add a description (optional)...'}
                    placeholderTextColor={c.textMuted}
                    style={[styles.contentInput, { color: c.text, minHeight: eduContentType === 'article' ? 150 : 80 }]}
                    value={eduContent}
                    onChangeText={setEduContent}
                    multiline
                    textAlignVertical="top"
                  />
                </ScrollView>
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
        ref={scrollRef}
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
          {isSubscribed && (
            <>
              <View style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <Ionicons name="checkmark-circle" size={20} color={c.success} />
                  <View>
                    <Text style={[styles.settingsLabel, { color: c.success }]}>Active Subscription</Text>
                    <Text style={[styles.settingsValue, { color: c.textMuted }]}>You have premium access</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
            </>
          )}
          {MEMBERSHIP_TIERS.map((tier, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
              <Pressable onPress={() => handleSubscribe(tier.productId)} disabled={purchasing} style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <Ionicons name={tier.isBestValue ? 'star' : 'diamond-outline'} size={20} color={tier.isBestValue ? c.gold : c.textSecondary} />
                  <View>
                    <Text style={[styles.settingsLabel, { color: c.text }]}>{tier.name}</Text>
                    <Text style={[styles.settingsValue, { color: c.textMuted }]}>{getPackagePriceString(availablePackages, tier.productId) ? `${getPackagePriceString(availablePackages, tier.productId)}/month` : 'Subscribe'}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
              </Pressable>
            </React.Fragment>
          ))}
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Pressable onPress={handleRestore} disabled={restoring} style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="refresh-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Restore Purchases</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>{restoring ? 'Restoring...' : 'Already subscribed? Restore here'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </Pressable>
        </View>

        <View style={styles.subscriptionTerms}>
          <Text style={[styles.subscriptionTermsText, { color: c.textMuted }]}>
            Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your account settings after purchase.
          </Text>
          <Text style={[styles.subscriptionTermsText, { color: c.textMuted, marginTop: 8 }]}>
            Payment will be charged to your account at confirmation of purchase. Any unused portion of a free trial period will be forfeited when purchasing a subscription.
          </Text>
          <View style={styles.subscriptionTermsLinks}>
            <Pressable onPress={() => setShowTermsOfUse(true)}>
              <Text style={[styles.subscriptionTermsLink, { color: c.gold }]}>Terms of Use</Text>
            </Pressable>
            <Text style={[styles.subscriptionTermsDot, { color: c.textMuted }]}>{'\u00B7'}</Text>
            <Pressable onPress={() => setShowPrivacyPolicy(true)}>
              <Text style={[styles.subscriptionTermsLink, { color: c.gold }]}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>LEARN</Text>
        <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (isSubscribed) {
                setActiveSection('education');
              } else {
                scrollRef.current?.scrollTo({ y: 0, animated: true });
                Alert.alert('Subscription Required', 'Choose a subscription plan above to unlock Education content.');
              }
            }}
            style={styles.settingsRow}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name={isSubscribed ? 'book-outline' : 'lock-closed-outline'} size={20} color={isSubscribed ? c.textSecondary : c.gold} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Education</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>
                  {isSubscribed ? 'Trading knowledge & strategies' : 'Subscribe to unlock'}
                </Text>
              </View>
            </View>
            {isSubscribed ? (
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            ) : (
              <View style={[styles.lockBadge, { backgroundColor: c.goldMuted }]}>
                <Text style={[styles.lockBadgeText, { color: c.gold }]}>VIP</Text>
              </View>
            )}
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

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>NOTIFICATIONS</Text>
        <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="document-text-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Analysis Posts</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>New analysis notifications</Text>
              </View>
            </View>
            <Switch
              value={notificationPrefs.analysis}
              onValueChange={async (val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (val) {
                  const { status } = await Notifications.requestPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission Needed', 'Please enable notifications in your device settings to receive alerts.');
                    return;
                  }
                }
                setNotificationPref('analysis', val);
              }}
              trackColor={{ false: c.border, true: c.gold }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <View style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="chatbubble-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Chat Messages</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>New chat notifications</Text>
              </View>
            </View>
            <Switch
              value={notificationPrefs.chat}
              onValueChange={async (val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (val) {
                  const { status } = await Notifications.requestPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission Needed', 'Please enable notifications in your device settings to receive alerts.');
                    return;
                  }
                }
                setNotificationPref('chat', val);
              }}
              trackColor={{ false: c.border, true: c.gold }}
              thumbColor="#fff"
            />
          </View>
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
              <Pressable onPress={async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const bans = await getBannedUsers(); setBannedUsers(bans); setShowBanManager(true); }} style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <Ionicons name="ban-outline" size={20} color="#FF5252" />
                  <View>
                    <Text style={[styles.settingsLabel, { color: c.text }]}>Manage Banned Users</Text>
                    <Text style={[styles.settingsValue, { color: c.textMuted }]}>View and unban users</Text>
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
                <Text style={[styles.settingsLabel, { color: c.text }]}>Email Us</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>support@mjliquidity.com</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL('https://mjliquidity.com'); }} style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="globe-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Website</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>mjliquidity.com</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL('https://www.tiktok.com/@mjliquidity?_r=1&_t=ZN-93m0iMJvgaE'); }} style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="logo-tiktok" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>TikTok</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>@mjliquidity</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>LEGAL</Text>
        <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Pressable onPress={() => setShowTermsOfUse(true)} style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Terms of Use (EULA)</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>Subscription & usage terms</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
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
          <Pressable onPress={() => setShowPrivacyPolicy(true)} style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={c.textSecondary} />
              <View>
                <Text style={[styles.settingsLabel, { color: c.text }]}>Privacy Policy</Text>
                <Text style={[styles.settingsValue, { color: c.textMuted }]}>How we handle your data</Text>
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

      <Modal visible={showBanManager} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.composeModal, { backgroundColor: c.surface }]}>
            <View style={styles.composeHeader}>
              <Pressable onPress={() => setShowBanManager(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </Pressable>
              <Text style={[styles.composeTitle, { color: c.text }]}>Banned Users</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.modList} showsVerticalScrollIndicator={false}>
              {bannedUsers.length === 0 ? (
                <Text style={[styles.modEmptyText, { color: c.textMuted }]}>No banned users</Text>
              ) : (
                bannedUsers.map((ban) => (
                  <View key={ban.id} style={[styles.modRow, { borderBottomColor: c.border }]}>
                    <View style={styles.modRowLeft}>
                      <View style={[styles.modAvatar, { backgroundColor: 'rgba(255, 82, 82, 0.15)' }]}>
                        <Ionicons name="ban-outline" size={14} color="#FF5252" />
                      </View>
                      <View>
                        <Text style={[styles.settingsLabel, { color: c.text }]}>{ban.username}</Text>
                        <Text style={[styles.settingsValue, { color: c.textMuted }]}>
                          Banned {new Date(ban.bannedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {ban.reason ? ` - ${ban.reason}` : ''}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        Alert.alert('Unban User', `Unban ${ban.username} from chat?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Unban', onPress: async () => {
                            await unbanUser(ban.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            const updated = await getBannedUsers();
                            setBannedUsers(updated);
                          }},
                        ]);
                      }}
                      hitSlop={12}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
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

      <Modal visible={showTermsOfUse} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.legalModal, { backgroundColor: c.surface }]}>
            <View style={styles.legalModalHeader}>
              <Text style={[styles.legalModalTitle, { color: c.gold }]}>Terms of Use</Text>
              <Pressable onPress={() => setShowTermsOfUse(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.legalScroll}>
              <Text style={[styles.legalText, { color: c.textMuted, marginBottom: 16 }]}>
                Last updated: March 2026
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>1. Acceptance of Terms</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                By downloading, installing, or using MJliquidity ("the App"), you agree to be bound by these Terms of Use. If you do not agree to these terms, do not use the App.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>2. Subscription Terms</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                MJliquidity offers the following auto-renewable subscription plans:
              </Text>
              {[
                `Gold Intraday VIP — ${getPackagePriceString(availablePackages, 'mjliquidity.vip.monthly') || 'monthly subscription'}`,
                `4 Markets Session Analysis — ${getPackagePriceString(availablePackages, 'mjliquidity.analysis.monthly') || 'monthly subscription'}`,
                `Full Access (Gold + 4 Markets) — ${getPackagePriceString(availablePackages, 'mjliquidity.bundle.monthly') || 'monthly subscription'}`,
              ].map((item, i) => (
                <View key={i} style={styles.guidelineRow}>
                  <View style={[styles.guidelineDot, { backgroundColor: c.gold }]} />
                  <Text style={[styles.guidelineText, { color: c.textSecondary }]}>{item}</Text>
                </View>
              ))}

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>3. Billing & Renewal</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                Payment will be charged to your account at confirmation of purchase. Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period at the rate of the selected plan.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>4. Cancellation</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                You can manage and cancel your subscriptions by going to your account settings after purchase. Cancellation will take effect at the end of the current billing period. No refunds will be provided for partial billing periods.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>5. Free Trials</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                If a free trial is offered, any unused portion of the free trial period will be forfeited when you purchase a subscription. Free trials may only be used once per account.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>6. Content & Disclaimer</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                All content provided in MJliquidity, including market analysis, trading ideas, educational material, and chat messages, is for informational and educational purposes only. Nothing in this App constitutes financial advice, investment advice, or a recommendation to buy or sell any financial instrument. You are solely responsible for your own trading decisions.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>7. User Conduct</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                Users must not share signals, financial advice, spam, or abusive content in community chats. MJliquidity reserves the right to ban or restrict users who violate community guidelines without notice or refund.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>8. Intellectual Property</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                All content, branding, and materials within the App are the property of MJliquidity. You may not reproduce, distribute, or create derivative works without prior written consent.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>9. Limitation of Liability</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                MJliquidity shall not be liable for any financial losses, damages, or claims arising from the use of information provided in the App. Trading involves substantial risk and is not suitable for every investor.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>10. Modifications</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                MJliquidity reserves the right to modify these terms at any time. Continued use of the App after changes constitutes acceptance of the updated terms.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>11. Contact</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                For questions about these terms, contact:
              </Text>
              <Text style={[styles.legalText, { color: c.gold, marginTop: 4 }]}>
                support@mjliquidity.com
              </Text>

              <View style={styles.privacyFooter}>
                <Text style={[styles.legalText, { color: c.textMuted, textAlign: 'center' }]}>
                  MJliquidity{'\u2122'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showPrivacyPolicy} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.legalModal, { backgroundColor: c.surface }]}>
            <View style={styles.legalModalHeader}>
              <Text style={[styles.legalModalTitle, { color: c.gold }]}>Privacy Policy</Text>
              <Pressable onPress={() => setShowPrivacyPolicy(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.legalScroll}>
              <Text style={[styles.legalText, { color: c.textMuted, marginBottom: 16 }]}>
                Last updated: February 2026
              </Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                MJliquidity respects your privacy and is committed to protecting your personal information.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>Information We Collect</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>We may collect:</Text>
              {[
                'Account information (email or login details)',
                'Subscription status',
                'App usage data (analytics)',
                'Device information for app performance and security',
              ].map((item, i) => (
                <View key={i} style={styles.guidelineRow}>
                  <View style={[styles.guidelineDot, { backgroundColor: c.gold }]} />
                  <Text style={[styles.guidelineText, { color: c.textSecondary }]}>{item}</Text>
                </View>
              ))}
              <Text style={[styles.legalText, { color: c.textSecondary, marginTop: 8 }]}>
                We do not collect or store payment information directly. All payments are processed securely through the respective app store.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>How We Use Information</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>We use information to:</Text>
              {[
                'Provide access to app features',
                'Manage subscriptions',
                'Improve performance and reliability',
                'Communicate important updates',
              ].map((item, i) => (
                <View key={i} style={styles.guidelineRow}>
                  <View style={[styles.guidelineDot, { backgroundColor: c.gold }]} />
                  <Text style={[styles.guidelineText, { color: c.textSecondary }]}>{item}</Text>
                </View>
              ))}

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>Third-Party Services</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                The app may contain links to third-party services such as brokers, prop firms, or copy trading platforms. These services operate independently and have their own privacy policies.
              </Text>
              <Text style={[styles.legalText, { color: c.textSecondary, marginTop: 8 }]}>
                MJliquidity is not responsible for third-party practices.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>Data Security</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                We take reasonable technical and organisational measures to protect your information.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>Your Rights</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                You may request account deletion or data removal at any time by contacting support.
              </Text>

              <Text style={[styles.privacySectionTitle, { color: c.text }]}>Contact</Text>
              <Text style={[styles.legalText, { color: c.textSecondary }]}>
                For privacy questions, contact:
              </Text>
              <Text style={[styles.legalText, { color: c.gold, marginTop: 4 }]}>
                support@mjliquidity.com
              </Text>

              <View style={styles.privacyFooter}>
                <Text style={[styles.legalText, { color: c.textMuted, textAlign: 'center' }]}>
                  MJliquidity{'\u2122'}
                </Text>
              </View>
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
  eduCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' as const },
  eduThumbnailWrap: { width: '100%' as const, height: 180, position: 'relative' as const },
  eduThumbnail: { width: '100%' as const, height: '100%' as const },
  eduPlayOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: 'rgba(0,0,0,0.35)' },
  eduPlayBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' as const, alignItems: 'center' as const, paddingLeft: 4 },
  eduPdfOverlay: { position: 'absolute' as const, bottom: 8, right: 8 },
  eduPdfBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.7)' },
  eduPdfBadgeText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#FFFFFF' },
  eduTypeRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 16 },
  eduTypeBtn: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  eduTypeBtnText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  eduImagePicker: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' as const, overflow: 'hidden' as const, marginBottom: 12 },
  eduImagePreview: { width: '100%' as const, height: 180, borderRadius: 12 },
  eduImageRemove: { position: 'absolute' as const, top: 8, right: 8 },
  eduImagePlaceholder: { alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 28, gap: 6 },
  eduImagePlaceholderText: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
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
  privacySectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', marginTop: 20, marginBottom: 8 },
  privacyFooter: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  lockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  lockBadgeText: { fontSize: 11, fontFamily: 'DMSans_700Bold', letterSpacing: 1 },
  subscriptionTerms: { paddingHorizontal: 4, marginBottom: 16, marginTop: -8 },
  subscriptionTermsText: { fontSize: 11, fontFamily: 'DMSans_400Regular', lineHeight: 16 },
  subscriptionTermsLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  subscriptionTermsLink: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  subscriptionTermsDot: { fontSize: 16 },
});
