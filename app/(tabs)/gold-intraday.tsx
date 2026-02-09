import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
  Image,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import {
  AnalysisPost,
  ChatMessage,
  getAnalysisPosts,
  addAnalysisPost,
  deleteAnalysisPost,
  getChatMessages,
  addChatMessage,
  deleteChatMessage,
} from '@/lib/storage';
import { useFocusEffect } from 'expo-router';

type ActiveTab = 'analysis' | 'chat';

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

function formatChatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function GoldIntradayScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { isAdmin, isModerator, userName, setUserNameValue, canAccessGold, subscriptionUrl } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('analysis');
  const [posts, setPosts] = useState<AnalysisPost[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [inputText, setInputText] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const memberCount = useMemo(() => new Set(messages.map(m => m.username)).size, [messages]);

  const loadPosts = useCallback(async () => {
    const data = await getAnalysisPosts('gold_vip');
    setPosts(data);
  }, []);

  const loadMessages = useCallback(async () => {
    const data = await getChatMessages('gold_vip');
    setMessages(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
      loadMessages();
      pollRef.current = setInterval(loadMessages, 3000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [loadPosts, loadMessages])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Info', 'Please add a title and content.');
      return;
    }
    await addAnalysisPost({ title: title.trim(), content: content.trim(), category: 'xauusd', channel: 'gold_vip', imageUri: imageUri || undefined }, 'gold_vip');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTitle(''); setContent(''); setImageUri(null); setShowCompose(false);
    await loadPosts();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Post', 'Remove this analysis?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteAnalysisPost(id, 'gold_vip');
        await loadPosts();
      }},
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const displayName = isAdmin ? 'MJliquidity' : userName;
    if (!displayName) { setShowNamePrompt(true); return; }
    await addChatMessage({ username: displayName, text: inputText.trim(), isAdmin, isModerator: !isAdmin && isModerator }, 'gold_vip');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    await loadMessages();
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleDeleteMessage = (id: string) => {
    Alert.alert('Delete Message', 'Remove this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteChatMessage(id, 'gold_vip');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadMessages();
      }},
    ]);
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const handleSubscribe = () => {
    if (subscriptionUrl) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Linking.openURL(subscriptionUrl).catch(() => Alert.alert('Error', 'Could not open link.'));
    } else {
      Alert.alert('Coming Soon', 'Subscription links will be available soon.');
    }
  };

  if (!canAccessGold) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
          <View>
            <View style={styles.titleRow}>
              <Ionicons name="diamond" size={20} color={c.gold} />
              <Text style={[styles.headerTitle, { color: c.gold }]}>Gold Intraday</Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>XAUUSD Market Analysis</Text>
          </View>
        </View>
        <View style={styles.paywallContainer}>
          <LinearGradient colors={['rgba(201, 168, 76, 0.12)', 'rgba(201, 168, 76, 0.03)', 'transparent']} style={styles.paywallGlow} />
          <View style={[styles.paywallIconCircle, { backgroundColor: c.goldMuted }]}>
            <Ionicons name="lock-closed" size={32} color={c.gold} />
          </View>
          <Text style={[styles.paywallTitle, { color: c.text }]}>Gold VIP Access</Text>
          <Text style={[styles.paywallSubtitle, { color: c.textSecondary }]}>
            Unlock exclusive XAUUSD analysis and members-only chat
          </Text>
          <View style={styles.paywallFeatures}>
            {['XAUUSD liquidity zones & reaction areas', 'Daily scenario mapping', 'Members-only Gold chat'].map((f, i) => (
              <View key={i} style={styles.paywallFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color={c.gold} />
                <Text style={[styles.paywallFeatureText, { color: c.textSecondary }]}>{f}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={handleSubscribe} style={[styles.paywallBtn, { backgroundColor: c.gold }]}>
            <Text style={styles.paywallBtnText}>Subscribe Now</Text>
          </Pressable>
          <Text style={[styles.paywallPrice, { color: c.textMuted }]}>From £75/month</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <View>
          <View style={styles.titleRow}>
            <Ionicons name="diamond" size={20} color={c.gold} />
            <Text style={[styles.headerTitle, { color: c.gold }]}>Gold Intraday</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>XAUUSD Market Analysis</Text>
        </View>
        {isAdmin && activeTab === 'analysis' && (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCompose(true); }}
            style={[styles.composeBtn, { backgroundColor: c.gold }]}
          >
            <Ionicons name="add" size={22} color="#0A0A0A" />
          </Pressable>
        )}
      </View>

      <View style={styles.tabRow}>
        {(['analysis', 'chat'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && { borderBottomColor: c.gold, borderBottomWidth: 2 }]}
          >
            <Ionicons
              name={tab === 'analysis' ? 'analytics-outline' : 'chatbubble-outline'}
              size={16}
              color={activeTab === tab ? c.gold : c.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, { color: activeTab === tab ? c.gold : c.textMuted }]}>
              {tab === 'analysis' ? 'Analysis' : 'Chat'}
            </Text>
            {tab === 'chat' && activeTab === 'chat' && memberCount > 0 && (
              <View style={{ backgroundColor: c.goldMuted, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 }}>
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: c.gold }}>{memberCount}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {activeTab === 'analysis' ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: c.goldMuted }]}>
                  <Ionicons name="diamond-outline" size={14} color={c.gold} />
                  <Text style={[styles.categoryText, { color: c.gold }]}>XAUUSD</Text>
                </View>
                <View style={styles.cardHeaderRight}>
                  <Text style={[styles.timeText, { color: c.textMuted }]}>{formatTime(item.timestamp)}</Text>
                  {isAdmin && (
                    <Pressable onPress={() => handleDelete(item.id)} hitSlop={12}>
                      <Ionicons name="trash-outline" size={16} color={c.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>
              <Text style={[styles.cardTitle, { color: c.text }]}>{item.title}</Text>
              <Text style={[styles.cardContent, { color: c.textSecondary }]}>{item.content}</Text>
              {item.imageUri && (
                <Image source={{ uri: item.imageUri }} style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 12 }} resizeMode="cover" />
              )}
              <View style={styles.cardFooter}>
                <View style={styles.adminBadge}>
                  <View style={[styles.adminDot, { backgroundColor: c.gold }]} />
                  <Text style={[styles.adminLabel, { color: c.goldLight }]}>MJliquidity</Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 84 : 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.gold} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="lock-closed-outline" size={48} color={c.textMuted} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>Gold VIP Content</Text>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                Subscribe to unlock XAUUSD market analysis
              </Text>
            </View>
          }
        />
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.messageBubble, item.isAdmin && styles.adminMessageStyle, item.isModerator && styles.modMessageStyle]}>
                <View style={styles.messageHeader}>
                  <View style={styles.nameRow}>
                    {item.isAdmin && (
                      <View style={[styles.adminTag, { backgroundColor: c.goldMuted }]}>
                        <Ionicons name="shield-checkmark" size={10} color={c.gold} />
                      </View>
                    )}
                    {item.isModerator && !item.isAdmin && (
                      <View style={[styles.adminTag, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                        <Ionicons name="shield-half-outline" size={10} color="#4CAF50" />
                      </View>
                    )}
                    <Text style={[styles.messageName, { color: item.isAdmin ? c.gold : item.isModerator ? '#4CAF50' : c.textSecondary }]}>
                      {item.username}
                    </Text>
                    {item.isModerator && !item.isAdmin && (
                      <Text style={styles.modLabel}>MOD</Text>
                    )}
                  </View>
                  <View style={styles.messageHeaderRight}>
                    <Text style={[styles.messageTime, { color: c.textMuted }]}>{formatChatTime(item.timestamp)}</Text>
                    {(isAdmin || isModerator) && (
                      <Pressable onPress={() => handleDeleteMessage(item.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={14} color={c.textMuted} />
                      </Pressable>
                    )}
                  </View>
                </View>
                <Text style={[styles.messageText, { color: c.text }]}>{item.text}</Text>
              </View>
            )}
            contentContainerStyle={[styles.messagesList, { paddingBottom: 8 }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={[styles.guidelinesBanner, { backgroundColor: c.goldMuted, borderColor: 'rgba(201, 168, 76, 0.15)' }]}>
                <Ionicons name="information-circle-outline" size={14} color={c.gold} />
                <Text style={[styles.guidelinesText, { color: c.goldLight }]}>
                  Respectful discussion only. No signals, spam, or financial advice.
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={c.textMuted} />
                <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>Gold Members Chat</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>VIP members-only discussion</Text>
              </View>
            }
          />

          {showNamePrompt && (
            <View style={[styles.namePrompt, { backgroundColor: c.surface, borderTopColor: c.border }]}>
              <Text style={[styles.namePromptTitle, { color: c.text }]}>Enter your display name</Text>
              <View style={styles.namePromptRow}>
                <TextInput
                  placeholder="Your name"
                  placeholderTextColor={c.textMuted}
                  style={[styles.namePromptInput, { color: c.text, backgroundColor: c.inputBackground, borderColor: c.inputBorder }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                />
                <Pressable
                  onPress={async () => { if (nameInput.trim()) { await setUserNameValue(nameInput.trim()); setShowNamePrompt(false); } }}
                  style={[styles.namePromptBtn, { backgroundColor: c.gold }]}
                >
                  <Ionicons name="checkmark" size={20} color="#0A0A0A" />
                </Pressable>
                <Pressable onPress={() => setShowNamePrompt(false)} hitSlop={8}>
                  <Ionicons name="close" size={20} color={c.textMuted} />
                </Pressable>
              </View>
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: Platform.OS === 'web' ? 42 : Math.max(insets.bottom, 8) }]}>
            <View style={[styles.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.inputBorder }]}>
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor={c.textMuted}
                style={[styles.textInput, { color: c.text }]}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
              <Pressable
                onPress={handleSendMessage}
                disabled={!inputText.trim()}
                style={[styles.sendBtn, { backgroundColor: inputText.trim() ? c.gold : c.cardBorder }]}
              >
                <Ionicons name="send" size={16} color={inputText.trim() ? '#0A0A0A' : c.textMuted} />
              </Pressable>
            </View>
          </View>
        </>
      )}

      <Modal visible={showCompose} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalOverlay}>
            <View style={[styles.composeModal, { backgroundColor: c.surface }]}>
              <View style={styles.composeHeader}>
                <Pressable onPress={() => setShowCompose(false)} hitSlop={12}>
                  <Ionicons name="close" size={24} color={c.textSecondary} />
                </Pressable>
                <Text style={[styles.composeTitle, { color: c.text }]}>Gold Analysis</Text>
                <Pressable onPress={handlePost} style={[styles.postBtn, { backgroundColor: c.gold }]}>
                  <Text style={[styles.postBtnText, { color: '#0A0A0A' }]}>Post</Text>
                </Pressable>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: c.goldMuted, alignSelf: 'flex-start', marginBottom: 16 }]}>
                <Ionicons name="diamond-outline" size={14} color={c.gold} />
                <Text style={[styles.categoryText, { color: c.gold }]}>XAUUSD</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Pressable onPress={pickImage} style={{ padding: 8, borderRadius: 12, backgroundColor: c.card }}>
                  <Ionicons name="image-outline" size={22} color={c.gold} />
                </Pressable>
              </View>
              {imageUri && (
                <View style={{ marginBottom: 12 }}>
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="cover" />
                  <Pressable onPress={() => setImageUri(null)} style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              )}
              <TextInput
                placeholder="Title"
                placeholderTextColor={c.textMuted}
                style={[styles.titleInput, { color: c.text, borderBottomColor: c.border }]}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                placeholder="Write your Gold analysis..."
                placeholderTextColor={c.textMuted}
                style={[styles.contentInput, { color: c.text }]}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 28, fontFamily: 'DMSans_700Bold', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  composeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  listContent: { paddingHorizontal: 16, gap: 12, paddingTop: 12 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 10, fontFamily: 'DMSans_700Bold', letterSpacing: 1 },
  timeText: { fontSize: 12, fontFamily: 'DMSans_400Regular' },
  cardTitle: { fontSize: 17, fontFamily: 'DMSans_700Bold', marginBottom: 6, lineHeight: 22 },
  cardContent: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 21, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminDot: { width: 6, height: 6, borderRadius: 3 },
  adminLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: 'DMSans_600SemiBold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  messageBubble: { marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: '#1A1A1A', marginHorizontal: 16 },
  adminMessageStyle: { backgroundColor: 'rgba(201, 168, 76, 0.08)', borderWidth: 1, borderColor: 'rgba(201, 168, 76, 0.15)' },
  modMessageStyle: { backgroundColor: 'rgba(76, 175, 80, 0.06)', borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.12)' },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  messageHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modLabel: { fontSize: 9, fontFamily: 'DMSans_700Bold', color: '#4CAF50', letterSpacing: 1, marginLeft: 4 },
  adminTag: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  messageName: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  messageTime: { fontSize: 11, fontFamily: 'DMSans_400Regular' },
  messageText: { fontSize: 15, fontFamily: 'DMSans_400Regular', lineHeight: 21 },
  messagesList: { paddingTop: 12, flexGrow: 1 },
  inputContainer: { paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, gap: 8 },
  textInput: { flex: 1, fontSize: 15, fontFamily: 'DMSans_400Regular', paddingVertical: 6, maxHeight: 100 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  namePrompt: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  namePromptTitle: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', marginBottom: 8 },
  namePromptRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  namePromptInput: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, fontFamily: 'DMSans_400Regular' },
  namePromptBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  composeModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: '70%' },
  composeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  composeTitle: { fontSize: 17, fontFamily: 'DMSans_600SemiBold' },
  postBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  titleInput: { fontSize: 20, fontFamily: 'DMSans_700Bold', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 12 },
  contentInput: { fontSize: 15, fontFamily: 'DMSans_400Regular', flex: 1, lineHeight: 22 },
  guidelinesBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  guidelinesText: { fontSize: 12, fontFamily: 'DMSans_400Regular', flex: 1 },
  paywallContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: -40 },
  paywallGlow: { position: 'absolute' as const, top: 0, left: 0, right: 0, height: 200, borderRadius: 0 },
  paywallIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 20 },
  paywallTitle: { fontSize: 24, fontFamily: 'DMSans_700Bold', marginBottom: 8 },
  paywallSubtitle: { fontSize: 15, fontFamily: 'DMSans_400Regular', textAlign: 'center' as const, lineHeight: 22, marginBottom: 24, paddingHorizontal: 16 },
  paywallFeatures: { alignSelf: 'stretch' as const, gap: 12, marginBottom: 28 },
  paywallFeatureRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
  paywallFeatureText: { fontSize: 14, fontFamily: 'DMSans_400Regular', flex: 1 },
  paywallBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 24, marginBottom: 8 },
  paywallBtnText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#0A0A0A' },
  paywallPrice: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
});
