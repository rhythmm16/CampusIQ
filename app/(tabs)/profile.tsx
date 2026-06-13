import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useUserStore, useChatStore } from '@/store';
import type { LanguageCode } from '@/store/userStore';
import { AccessibilityProfile } from '@/types';
import { AccessibilityProfileModal } from '@/components/ui';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import {
  Accessibility,
  Eye,
  Ear,
  ArrowUpCircle,
  Footprints,
  Trash2,
  Info,
  CheckCircle,
  Wifi,
  CircleDot,
  Languages,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { api } from '@/services/api';

interface ToggleItem {
  key: keyof AccessibilityProfile;
  labelKey: string;
  descriptionKey: string;
  icon: typeof Accessibility;
}

const TOGGLE_ITEMS: ToggleItem[] = [
  {
    key: 'wheelchair',
    labelKey: 'profile.wheelchair',
    descriptionKey: 'profile.wheelchairDesc',
    icon: Accessibility,
  },
  {
    key: 'visual_impairment',
    labelKey: 'profile.visualImpairment',
    descriptionKey: 'profile.visualImpairmentDesc',
    icon: Eye,
  },
  {
    key: 'hearing_impairment',
    labelKey: 'profile.hearingImpairment',
    descriptionKey: 'profile.hearingImpairmentDesc',
    icon: Ear,
  },
  {
    key: 'elevator_required',
    labelKey: 'profile.elevatorRequired',
    descriptionKey: 'profile.elevatorRequiredDesc',
    icon: ArrowUpCircle,
  },
  {
    key: 'avoid_stairs',
    labelKey: 'profile.avoidStairs',
    descriptionKey: 'profile.avoidStairsDesc',
    icon: Footprints,
  },
  {
    key: 'sensory_friendly',
    labelKey: 'profile.sensoryFriendly',
    descriptionKey: 'profile.sensoryFriendlyDesc',
    icon: Ear,
  },
  {
    key: 'slow_walker',
    labelKey: 'profile.slowWalker',
    descriptionKey: 'profile.slowWalkerDesc',
    icon: Footprints,
  },
];

const LANGUAGE_OPTIONS: { code: LanguageCode; labelKey: string; native: string }[] = [
  { code: 'en', labelKey: 'profile.languageEnglish', native: 'English' },
  { code: 'hi', labelKey: 'profile.languageHindi', native: 'हिंदी' },
  { code: 'pa', labelKey: 'profile.languagePunjabi', native: 'ਪੰਜਾਬੀ' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const {
    accessibilityProfile,
    updateProfile,
    deviceId,
    hasCompletedOnboarding,
    language,
    setLanguage,
  } = useUserStore();
  const { sessionId, messages, clearHistory } = useChatStore();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [backendInfo, setBackendInfo] = useState<{ provider?: string; model?: string; llm?: boolean }>({});

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const health = await api.checkHealth();
      setBackendInfo({ provider: health.provider, model: health.model, llm: health.llm });
      setBackendStatus('ok');
    } catch (error) {
      setBackendInfo({});
      setBackendStatus('error');
    }
  };

  const handleToggle = (key: keyof AccessibilityProfile, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProfile({ [key]: value });
  };

  const handleLanguageChange = (code: LanguageCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguage(code);
  };

  const handleClearHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('profile.clearConversation'),
      t('profile.clearConversationMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Toast.show({
              type: 'success',
              text1: t('profile.conversationCleared'),
              visibilityTime: 2000,
            });
          },
        },
      ]
    );
  };

  const renderToggleItem = (item: ToggleItem, index: number) => {
    const Icon = item.icon;
    const isEnabled = accessibilityProfile[item.key];

    return (
      <Animated.View
        key={item.key}
        entering={FadeIn.delay(index * 50)}
        style={styles.toggleItem}
      >
        <View style={styles.toggleLeft}>
          <View style={[styles.iconWrap, isEnabled && styles.iconWrapActive]}>
            <Icon size={18} color={isEnabled ? COLORS.primary : COLORS.textMuted} />
          </View>
          <View>
            <Text style={styles.toggleLabel}>{t(item.labelKey)}</Text>
            <Text style={styles.toggleDescription}>{t(item.descriptionKey)}</Text>
          </View>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={(value) => handleToggle(item.key, value)}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={isEnabled ? COLORS.primary : '#F4F4F5'}
        />
      </Animated.View>
    );
  };

  const hasActiveProfile =
    accessibilityProfile.wheelchair ||
    accessibilityProfile.elevator_required ||
    accessibilityProfile.avoid_stairs ||
    accessibilityProfile.sensory_friendly;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.myProfile')}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Accessibility size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('profile.accessibilityNeeds')}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {t('profile.accessibilitySubtitle')}
          </Text>

          <View style={styles.togglesList}>
            {TOGGLE_ITEMS.map(renderToggleItem)}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Languages size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {t('profile.languageSubtitle')}
          </Text>
          <View style={styles.languageList}>
            {LANGUAGE_OPTIONS.map((opt) => {
              const isActive = language === opt.code;
              return (
                <TouchableOpacity
                  key={opt.code}
                  style={[styles.languageItem, isActive && styles.languageItemActive]}
                  onPress={() => handleLanguageChange(opt.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={opt.label}
                >
                  <View>
                    <Text style={styles.languageNative}>{opt.native}</Text>
                    <Text style={styles.languageLabel}>{opt.label}</Text>
                  </View>
                  {isActive && <CheckCircle size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('profile.sessionInfo')}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile.deviceId')}</Text>
              <Text style={styles.infoValue}>{deviceId.slice(0, 8)}...</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile.messagesSent')}</Text>
              <Text style={styles.infoValue}>{messages.filter((m) => m.role === 'user').length}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile.backendStatus')}</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    backendStatus === 'ok' && styles.statusDotOk,
                    backendStatus === 'error' && styles.statusDotError,
                  ]}
                />
                <Text style={styles.statusText}>
                  {backendStatus === 'checking'
                    ? t('profile.checking')
                    : backendStatus === 'ok'
                    ? t('profile.connected')
                    : t('profile.offlineStatus')}
                </Text>
              </View>
            </View>
            {backendStatus === 'ok' && backendInfo.provider && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('profile.aiProvider')}</Text>
                  <Text style={styles.infoValue}>
                    {backendInfo.llm
                      ? `${backendInfo.provider}${backendInfo.model ? ` · ${backendInfo.model}` : ''}`
                      : backendInfo.provider === 'local'
                      ? t('profile.local')
                      : t('profile.fallback')}
                  </Text>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
            <Trash2 size={18} color={COLORS.danger} />
            <Text style={styles.clearButtonText}>{t('profile.clearConversationHistory')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
          <Text style={styles.aboutText}>
            {t('profile.aboutText')}
          </Text>
          <Text style={styles.versionText}>{t('profile.version')} 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  togglesList: {
    gap: SPACING.sm,
  },
  languageList: {
    gap: SPACING.sm,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryPale,
  },
  languageNative: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  languageLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: COLORS.primaryPale,
  },
  toggleLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },
  statusDotOk: {
    backgroundColor: COLORS.accent,
  },
  statusDotError: {
    backgroundColor: COLORS.danger,
  },
  statusText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#FEE2E2',
  },
  clearButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.danger,
  },
  aboutText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  versionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});
