import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';
import { ChatMessage, getChatMessages, addChatMessage } from '@/lib/storage';
import { useFocusEffect } from 'expo-router';

function formatChatTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeader(ts: number): string {
  const now = new Date();
  const date = new Date(ts);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function MessageBubble({ message, showDateHeader }: { message: ChatMessage; showDateHeader: boolean }) {
  const c = Colors.dark;

  return (
    <View>
      {showDateHeader && (
        <View style={styles.dateHeader}>
          <Text style={[styles.dateHeaderText, { color: c.textMuted }]}>
            {formatDateHeader(message.timestamp)}
          </Text>
        </View>
      )}
      <View style={[styles.messageBubble, message.isAdmin && styles.adminMessage]}>
        <View style={styles.messageHeader}>
          <View style={styles.nameRow}>
            {message.isAdmin && (
              <View style={[styles.adminTag, { backgroundColor: c.goldMuted }]}>
                <Ionicons name="shield-checkmark" size={10} color={c.gold} />
              </View>
            )}
            <Text
              style={[
                styles.messageName,
                { color: message.isAdmin ? c.gold : c.textSecondary },
              ]}
            >
              {message.username}
            </Text>
          </View>
          <Text style={[styles.messageTime, { color: c.textMuted }]}>
            {formatChatTime(message.timestamp)}
          </Text>
        </View>
        <Text style={[styles.messageText, { color: c.text }]}>{message.text}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { isAdmin, userName, setUserNameValue } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    const data = await getChatMessages();
    setMessages(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
      pollRef.current = setInterval(loadMessages, 3000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [loadMessages])
  );

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const displayName = isAdmin ? 'MJ Liquidity' : userName;
    if (!displayName) {
      setShowNamePrompt(true);
      return;
    }

    await addChatMessage({
      username: displayName,
      text: inputText.trim(),
      isAdmin,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    await loadMessages();
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSetName = () => {
    Alert.prompt?.(
      'Your Display Name',
      'Enter a name to use in the chat',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (name?: string) => {
            if (name?.trim()) {
              await setUserNameValue(name.trim());
              setShowNamePrompt(false);
            }
          },
        },
      ],
      'plain-text',
      userName || ''
    );

    if (!Alert.prompt) {
      setShowNamePrompt(true);
    }
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const needsName = !isAdmin && !userName;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <View>
          <Text style={[styles.headerTitle, { color: c.gold }]}>Community</Text>
          <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>
            {messages.length} messages
          </Text>
        </View>
        {!isAdmin && (
          <Pressable
            onPress={handleSetName}
            style={[styles.nameBtn, { borderColor: c.cardBorder }]}
          >
            <Ionicons name="person-outline" size={16} color={c.textSecondary} />
            <Text style={[styles.nameBtnText, { color: c.textSecondary }]} numberOfLines={1}>
              {userName || 'Set Name'}
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDate = !prevMsg ||
            new Date(item.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
          return <MessageBubble message={item} showDateHeader={showDate} />;
        }}
        contentContainerStyle={[styles.messagesList, { paddingBottom: 8 }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={c.textMuted} />
            <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>
              Welcome to the Community
            </Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              Share trading ideas and support each other
            </Text>
          </View>
        }
      />

      {needsName && showNamePrompt ? (
        <NamePromptInline onSave={async (name) => {
          await setUserNameValue(name);
          setShowNamePrompt(false);
        }} onCancel={() => setShowNamePrompt(false)} />
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: c.surface,
            borderTopColor: c.border,
            paddingBottom: Platform.OS === 'web' ? webBottomInset + 8 : Math.max(insets.bottom, 8),
          },
        ]}
      >
        <View style={[styles.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.inputBorder }]}>
          <TextInput
            placeholder={needsName ? 'Set your name to chat...' : 'Type a message...'}
            placeholderTextColor={c.textMuted}
            style={[styles.textInput, { color: c.text }]}
            value={inputText}
            onChangeText={setInputText}
            editable={!needsName || isAdmin}
            onFocus={() => {
              if (needsName && !isAdmin) setShowNamePrompt(true);
            }}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() ? c.gold : c.cardBorder,
              },
            ]}
          >
            <Ionicons name="send" size={16} color={inputText.trim() ? '#0A0A0A' : c.textMuted} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function NamePromptInline({ onSave, onCancel }: { onSave: (name: string) => void; onCancel: () => void }) {
  const c = Colors.dark;
  const [name, setName] = useState('');

  return (
    <View style={[styles.namePrompt, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      <Text style={[styles.namePromptTitle, { color: c.text }]}>Enter your display name</Text>
      <View style={styles.namePromptRow}>
        <TextInput
          placeholder="Your name"
          placeholderTextColor={c.textMuted}
          style={[styles.namePromptInput, { color: c.text, backgroundColor: c.inputBackground, borderColor: c.inputBorder }]}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Pressable
          onPress={() => {
            if (name.trim()) onSave(name.trim());
          }}
          style={[styles.namePromptBtn, { backgroundColor: c.gold }]}
        >
          <Ionicons name="checkmark" size={20} color="#0A0A0A" />
        </Pressable>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Ionicons name="close" size={20} color={c.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  nameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 140,
  },
  nameBtnText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    flexShrink: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  dateHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dateHeaderText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  messageBubble: {
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
  },
  adminMessage: {
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.15)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminTag: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageName: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 21,
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    paddingVertical: 6,
    maxHeight: 100,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_600SemiBold',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  namePrompt: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  namePromptTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    marginBottom: 8,
  },
  namePromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  namePromptInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  namePromptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
