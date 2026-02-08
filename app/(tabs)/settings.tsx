import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/lib/AppContext';

export default function SettingsScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { isAdmin, userName, loginAdmin, logoutAdmin, setUserNameValue } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

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

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20 + webTopInset,
            paddingBottom: Platform.OS === 'web' ? 84 : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: c.gold }]}>Settings</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>PROFILE</Text>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>ADMIN</Text>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>ABOUT</Text>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
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
