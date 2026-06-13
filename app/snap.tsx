import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { api } from '@/services/api';
import { calculateRouteOptions, getRouteFromOptions } from '@/services/routing';
import { useMapStore, useUserStore } from '@/store';
import { BUILDINGS } from '@/constants/campus';

export default function SnapScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const profile = useUserStore((s) => s.accessibilityProfile);
  const { setCurrentLocation, setRouteOptions, setActiveRoute, highlightBuilding, selectBuilding } =
    useMapStore();

  const handleSnap = async () => {
    if (Platform.OS === 'web') {
      Toast.show({ type: 'info', text1: 'Use the mobile app to snap landmarks' });
      return;
    }

    setLoading(true);
    try {
      const photo = await (cameraRef.current as { takePictureAsync?: (opts: object) => Promise<{ base64?: string }> })?.takePictureAsync?.({
        base64: true,
        quality: 0.5,
      });

      if (!photo?.base64) {
        throw new Error('Could not capture photo');
      }

      const result = await api.snapLocate(photo.base64);
      if (!result.building_id) {
        Toast.show({
          type: 'error',
          text1: 'Location not recognized',
          text2: result.reason ?? 'Try a clearer photo of a sign or entrance',
        });
        return;
      }

      const building = BUILDINGS.find((b) => b.building_id === result.building_id);
      if (!building) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentLocation(building.building_id);
      highlightBuilding(building.building_id);
      selectBuilding(building);

      Toast.show({
        type: 'success',
        text1: `You're at ${building.short_name}`,
        text2: result.reason ?? 'Location identified from photo',
      });

      // Demo: offer route to cafeteria from here
      const options = calculateRouteOptions(building.building_id, 'cafeteria', profile);
      const route = getRouteFromOptions(options, profile);
      if (route) {
        setRouteOptions(options);
        setActiveRoute(route);
        router.replace('/(tabs)/map');
      } else {
        router.replace('/(tabs)/map');
      }
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Snap failed', text2: 'Check backend and GROQ vision key' });
    } finally {
      setLoading(false);
    }
  };

  const renderBody = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.center}>
          <Camera size={48} color={COLORS.textSecondary} />
          <Text style={styles.message}>
            {t('snap.subtitle')}
          </Text>
        </View>
      );
    }

    if (!permission?.granted) {
      return (
        <View style={styles.center}>
          <Text style={styles.message}>{t('snap.permission')}</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={requestPermission}>
            <Text style={styles.actionBtnText}>{t('snap.grant')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <View style={styles.overlay}>
          <Text style={styles.prompt}>{t('snap.subtitle')}</Text>
          <TouchableOpacity
            style={[styles.captureBtn, loading && styles.captureBtnDisabled]}
            onPress={handleSnap}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Camera size={28} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <MapPin size={20} color={COLORS.primary} />
          <Text style={styles.headerText}>{t('snap.title')}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerText: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.lg },
  message: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center' },
  cameraWrap: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
    gap: SPACING.lg,
  },
  prompt: {
    color: '#FFF',
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  captureBtnDisabled: { opacity: 0.7 },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  actionBtnText: { color: '#FFF', fontWeight: '600' },
});
