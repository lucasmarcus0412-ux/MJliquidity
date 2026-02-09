import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ADMIN_LOGGED_IN: 'mjl_admin_logged_in',
  ANALYSIS_POSTS: 'mjl_analysis_posts',
  CHAT_MESSAGES: 'mjl_chat_messages',
  USER_NAME: 'mjl_user_name',
  SUBSCRIPTION_URL: 'mjl_subscription_url',
  HAS_SEEN_WELCOME: 'mjl_has_seen_welcome',
};

export interface AnalysisPost {
  id: string;
  title: string;
  content: string;
  category: 'forex' | 'indices' | 'crypto' | 'commodities' | 'general';
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isAdmin: boolean;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function getAdminStatus(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ADMIN_LOGGED_IN);
  return val === 'true';
}

export async function setAdminStatus(loggedIn: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ADMIN_LOGGED_IN, loggedIn ? 'true' : 'false');
}

export async function getAnalysisPosts(): Promise<AnalysisPost[]> {
  const val = await AsyncStorage.getItem(KEYS.ANALYSIS_POSTS);
  if (!val) return [];
  return JSON.parse(val);
}

export async function addAnalysisPost(post: Omit<AnalysisPost, 'id' | 'timestamp'>): Promise<AnalysisPost> {
  const posts = await getAnalysisPosts();
  const newPost: AnalysisPost = {
    ...post,
    id: generateId(),
    timestamp: Date.now(),
  };
  posts.unshift(newPost);
  await AsyncStorage.setItem(KEYS.ANALYSIS_POSTS, JSON.stringify(posts));
  return newPost;
}

export async function deleteAnalysisPost(id: string): Promise<void> {
  const posts = await getAnalysisPosts();
  const filtered = posts.filter(p => p.id !== id);
  await AsyncStorage.setItem(KEYS.ANALYSIS_POSTS, JSON.stringify(filtered));
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  const val = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
  if (!val) return [];
  return JSON.parse(val);
}

export async function addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
  const messages = await getChatMessages();
  const newMsg: ChatMessage = {
    ...msg,
    id: generateId(),
    timestamp: Date.now(),
  };
  messages.push(newMsg);
  await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  return newMsg;
}

export async function getUserName(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USER_NAME);
}

export async function setUserName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_NAME, name);
}

const DEFAULT_SUBSCRIPTION_URL = 'https://monzo.com/pay/r/mj-liquidity_hrgayGDJaBTL5a';

export async function getSubscriptionUrl(): Promise<string> {
  const url = await AsyncStorage.getItem(KEYS.SUBSCRIPTION_URL);
  return url || DEFAULT_SUBSCRIPTION_URL;
}

export async function setSubscriptionUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.SUBSCRIPTION_URL, url);
}

export async function getHasSeenWelcome(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.HAS_SEEN_WELCOME);
  return val === 'true';
}

export async function setHasSeenWelcome(): Promise<void> {
  await AsyncStorage.setItem(KEYS.HAS_SEEN_WELCOME, 'true');
}
