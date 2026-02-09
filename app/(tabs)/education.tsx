import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

export default function EducationScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { isAdmin } = useApp();
  const [posts, setPosts] = useState<EducationPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const loadPosts = useCallback(async () => {
    const data = await getEducationPosts();
    setPosts(data);
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
    await addEducationPost({ title: title.trim(), content: content.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTitle(''); setContent(''); setShowCompose(false);
    await loadPosts();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Post', 'Remove this education post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteEducationPost(id);
        await loadPosts();
      }},
    ]);
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <View>
          <View style={styles.titleRow}>
            <Ionicons name="book" size={20} color={c.gold} />
            <Text style={[styles.headerTitle, { color: c.gold }]}>Education</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>Trading Knowledge</Text>
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
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: c.goldMuted }]}>
                <Ionicons name="school-outline" size={14} color={c.gold} />
                <Text style={[styles.categoryText, { color: c.gold }]}>EDUCATION</Text>
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
            <Ionicons name="book-outline" size={48} color={c.textMuted} />
            <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>No Education Posts Yet</Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              Trading strategies and educational content will appear here
            </Text>
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
                <Text style={[styles.composeTitle, { color: c.text }]}>New Education Post</Text>
                <Pressable onPress={handlePost} style={[styles.postBtn, { backgroundColor: c.gold }]}>
                  <Text style={[styles.postBtnText, { color: '#0A0A0A' }]}>Post</Text>
                </Pressable>
              </View>
              <TextInput
                placeholder="Title"
                placeholderTextColor={c.textMuted}
                style={[styles.titleInput, { color: c.text, borderBottomColor: c.border }]}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                placeholder="Write your educational content..."
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 28, fontFamily: 'DMSans_700Bold', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', marginTop: 2 },
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
  titleInput: { fontSize: 20, fontFamily: 'DMSans_700Bold', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 12 },
  contentInput: { fontSize: 15, fontFamily: 'DMSans_400Regular', flex: 1, lineHeight: 22 },
});
