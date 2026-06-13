import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, QrCode } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { BUILDINGS } from '@/constants/campus';
import { calculateRouteOptions, getRouteFromOptions } from '@/services/routing';
import { useMapStore, useUserStore } from '@/store';

function resolveBuilding(raw: string): string | null {
  const value = raw.trim();
  const deepLink = value.match(/building\/([\w-]+)/i);
  if (deepLink) {
    const id = deepLink[1];
    if (BUILDINGS.some((b) => b.building_id === id)) return id;
  }
  const lower = value.toLowerCase();
  const match = BUILDINGS.find(
    (b) =>
      b.building_id === lower ||
      b.short_name.toLowerCase() === lower ||
      b.name.toLowerCase() === lower
  );
  return match?.building_id ?? null;
}

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [handled, setHandled] = useState(false);
  const profile = useUserStore((s) => s.accessibilityProfile);
  const { setCurrentLocation, setRouteOptions, setActiveRoute, highlightBuilding } = useMapStore();

  const handleScanned = (data: string) => {
    if (handled) return;
    const buildingId = resolveBuilding(data);
    if (!buildingId) return;

    const building = BUILDINGS.find((b) => b.building_id === buildingId);
    if (!building) return;

    setHandled(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // QR = instant indoor location fix
    setCurrentLocation(buildingId);
    highlightBuilding(buildingId);

    Toast.show({
      type: 'success',
      text1: `Location: ${building.short_name}`,
      text2: 'Starting navigation from here',
    });

    // Smart nav: route to a popular destination for demo (library)
    const destId = 'library';
    const options = calculateRouteOptions(buildingId, destId, profile);
    const route = getRouteFromOptions(options, profile);

    if (route) {
      setRouteOptions(options);
      setActiveRoute(route);
      router.replace('/(tabs)/map');
    } else {
      router.replace(`/building/${buildingId}`);
    }
  };

  const renderBody = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.center}>
          <QrCode size={48} color={COLORS.textSecondary} />
          <Text style={styles.message}>
            QR scanning is available on the mobile app. Campus QR codes fix your location instantly
            — useful indoors where GPS fails.
          </Text>
        </View>
      );
    }

    if (!permission) return <View style={styles.center} />;

    if (!permission.granted) {
      return (
        <View style={styles.center}>
          <QrCode size={48} color={COLORS.textSecondary} />
          <Text style={styles.message}>{t('scan.permission')}</Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantText}>{t('scan.grant')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => handleScanned(data)}
        />
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.reticle} />
          <Text style={styles.prompt}>{t('scan.prompt')}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('scan.title')}</Text>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel={t('common.close')}>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.lg },
  message: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center' },
  grantButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  grantText: { color: '#FFFFFF', fontWeight: '600', fontSize: FONT_SIZE.base },
  cameraWrap: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: SPACING.xl },
  reticle: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
  },
  prompt: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
