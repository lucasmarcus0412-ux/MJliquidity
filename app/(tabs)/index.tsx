import React, { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import {
  AnalysisPost,
  getAnalysisPosts,
  addAnalysisPost,
  deleteAnalysisPost,
} from '@/lib/storage';
import { useFocusEffect } from 'expo-router';

const CATEGORIES = ['general', 'forex', 'indices', 'crypto', 'commodities'] as const;
type Category = typeof CATEGORIES[number];

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

function AnalysisCard({ post, isAdmin, onDelete }: {
  post: AnalysisPost;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const c = Colors.dark;
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: c.goldMuted }]}>
          <Text style={[styles.categoryText, { color: c.gold }]}>
            {post.category.toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={[styles.timeText, { color: c.textMuted }]}>{formatTime(post.timestamp)}</Text>
          {isAdmin && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDelete(post.id);
              }}
              hitSlop={20}
              style={{ padding: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={c.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: c.text }]}>{post.title}</Text>
      <Text style={[styles.cardContent, { color: c.textSecondary }]}>{post.content}</Text>
      {post.imageUri && (
        <Image source={{ uri: post.imageUri }} style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 12 }} resizeMode="cover" />
      )}
      <View style={styles.cardFooter}>
        <View style={styles.adminBadge}>
          <View style={[styles.adminDot, { backgroundColor: c.gold }]} />
          <Text style={[styles.adminLabel, { color: c.goldLight }]}>MJliquidity</Text>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { isAdmin, isSubscribed, subscriptionUrl } = useApp();
  const [posts, setPosts] = useState<AnalysisPost[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('general');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const loadPosts = useCallback(async () => {
    try {
      setLoadError(null);
      const data = await getAnalysisPosts('free');
      setPosts(data);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load posts');
      setPosts([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { loadPosts(); }, [loadPosts])
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
    await addAnalysisPost({ title: title.trim(), content: content.trim(), category: selectedCategory, channel: 'free', imageUri: imageUri || undefined }, 'free');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTitle(''); setContent(''); setSelectedCategory('general'); setImageUri(null); setShowCompose(false);
    await loadPosts();
  };

  const handleDelete = async (id: string) => {
    let confirmed = false;
    if (Platform.OS === 'web') {
      confirmed = window.confirm('Are you sure you want to remove this analysis?');
    } else {
      confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert('Delete Post', 'Are you sure you want to remove this analysis?', [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
        ]);
      });
    }
    if (confirmed) {
      try {
        await deleteAnalysisPost(id, 'free');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await loadPosts();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <View style={styles.headerLeft}>
          <Image source={require('@/assets/images/mj-logo.jpeg')} style={styles.logo} />
          <View>
            <Text style={[styles.headerTitle, { color: c.gold }]}>MJliquidity</Text>
            <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>Daily Analysis</Text>
          </View>
        </View>
        {isAdmin && (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCompose(true); }}
            style={[styles.composeBtn, { backgroundColor: c.gold }]}
          >
            <Ionicons name="add" size={22} color="#0A0A0A" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AnalysisCard post={item} isAdmin={isAdmin} onDelete={handleDelete} />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 84 : 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.gold} />}
        ListHeaderComponent={!isSubscribed ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (subscriptionUrl) {
                Linking.openURL(subscriptionUrl).catch(() => {});
              } else {
                Alert.alert('Subscribe', 'Visit the Profile tab to view subscription plans and get access.');
              }
            }}
            style={[styles.vipBanner, { borderColor: c.gold }]}
          >
            <LinearGradient
              colors={['rgba(201, 168, 76, 0.15)', 'rgba(201, 168, 76, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.vipBannerContent}>
              <View style={styles.vipBannerLeft}>
                <Ionicons name="diamond" size={20} color={c.gold} />
                <View>
                  <Text style={[styles.vipBannerTitle, { color: c.gold }]}>Unlock VIP Analysis</Text>
                  <Text style={[styles.vipBannerSub, { color: c.textSecondary }]}>Gold & Pro members get exclusive features</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.gold} />
            </View>
          </Pressable>
        ) : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loadError ? (
              <>
                <Ionicons name="cloud-offline-outline" size={48} color="#E74C3C" />
                <Text style={[styles.emptyTitle, { color: '#E74C3C' }]}>Connection Issue</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                  Could not load posts. Pull down to retry.
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="analytics-outline" size={48} color={c.textMuted} />
                <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>No Analysis Yet</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                  Free daily market analysis and key levels will appear here
                </Text>
              </>
            )}
          </View>
        }
      />

      <Modal visible={showCompose} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalOverlay}>
            <View style={[styles.composeModal, { backgroundColor: c.surface }]}>
              <View style={styles.composeHeader}>
                <Pressable onPress={() => setShowCompose(false)} hitSlop={12}>
                  <Ionicons name="close" size={24} color={c.textSecondary} />
                </Pressable>
                <Text style={[styles.composeTitle, { color: c.text }]}>New Free Analysis</Text>
                <Pressable onPress={handlePost} style={[styles.postBtn, { backgroundColor: c.gold }]}>
                  <Text style={[styles.postBtnText, { color: '#0A0A0A' }]}>Post</Text>
                </Pressable>
              </View>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => { Haptics.selectionAsync(); setSelectedCategory(cat); }}
                    style={[styles.categoryChip, {
                      backgroundColor: selectedCategory === cat ? c.goldMuted : c.card,
                      borderColor: selectedCategory === cat ? c.gold : c.cardBorder,
                    }]}
                  >
                    <Text style={[styles.chipText, { color: selectedCategory === cat ? c.gold : c.textMuted }]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </Pressable>
                ))}
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
                placeholder="Write your analysis..."
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 20 },
  headerTitle: { fontSize: 22, fontFamily: 'DMSans_700Bold', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  composeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, gap: 12 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  composeModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: '70%' },
  composeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  composeTitle: { fontSize: 17, fontFamily: 'DMSans_600SemiBold' },
  postBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: 'DMSans_500Medium' },
  titleInput: { fontSize: 20, fontFamily: 'DMSans_700Bold', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 12 },
  contentInput: { fontSize: 15, fontFamily: 'DMSans_400Regular', flex: 1, lineHeight: 22 },
  vipBanner: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' as const, marginBottom: 8 },
  vipBannerContent: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, padding: 14 },
  vipBannerLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, flex: 1 },
  vipBannerTitle: { fontSize: 15, fontFamily: 'DMSans_700Bold' },
  vipBannerSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
});
