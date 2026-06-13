import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  X,
  TriangleAlert,
  MapPin,
  DoorOpen,
  HeartPulse,
  Users,
  LogOut,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { calculateRoute, getRouteFromOptions, calculateRouteOptions } from '@/services/routing';
import {
  getNearestSafetyPoi,
  getSafetyPoisByType,
} from '@/services/pulse';
import { useMapStore, useUserStore } from '@/store';
import { BUILDINGS } from '@/constants/campus';

const SECURITY_NUMBER = '+911123456789';
const MEDICAL_BUILDING_ID = 'medical_center';

export default function EmergencyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useUserStore((s) => s.accessibilityProfile);
  const { currentLocationId, setActiveRoute, setRouteOptions } = useMapStore();

  const originId = currentLocationId ?? 'main_gate';
  const origin = BUILDINGS.find((b) => b.building_id === originId);

  const nearestExit = useMemo(
    () => getNearestSafetyPoi(originId, 'exit'),
    [originId]
  );
  const nearestAed = useMemo(
    () => getNearestSafetyPoi(originId, 'aed'),
    [originId]
  );
  const nearestAssembly = useMemo(
    () => getNearestSafetyPoi(originId, 'assembly'),
    [originId]
  );

  const medical = useMemo(
    () => BUILDINGS.find((b) => b.building_id === MEDICAL_BUILDING_ID),
    []
  );

  const medicalRoute = useMemo(
    () => calculateRoute(originId, MEDICAL_BUILDING_ID, 'accessible', profile),
    [originId, profile]
  );

  const exitRoute = useMemo(() => {
    if (!nearestExit) return null;
    return calculateRoute(originId, nearestExit.building_id, 'fastest', profile);
  }, [originId, nearestExit, profile]);

  const assemblyRoute = useMemo(() => {
    if (!nearestAssembly) return null;
    return calculateRoute(originId, nearestAssembly.building_id, 'fastest', profile);
  }, [originId, nearestAssembly, profile]);

  const getMeOutRoute = useMemo(() => {
    const dest = nearestExit?.building_id ?? 'main_gate';
    const options = calculateRouteOptions(originId, dest, profile);
    return getRouteFromOptions(options, profile) ?? exitRoute;
  }, [originId, nearestExit, profile, exitRoute]);

  const handleRoute = (route: ReturnType<typeof calculateRoute>) => {
    if (!route) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setActiveRoute(route);
    router.replace('/(tabs)/map');
  };

  const handleGetMeOut = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (getMeOutRoute) {
      setRouteOptions(calculateRouteOptions(originId, nearestExit?.building_id ?? 'main_gate', profile));
      setActiveRoute(getMeOutRoute);
      router.replace('/(tabs)/map');
    }
  };

  const handleCallSecurity = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Linking.openURL(`tel:${SECURITY_NUMBER}`).catch(() => {});
  };

  const exits = getSafetyPoisByType('exit');
  const aeds = getSafetyPoisByType('aed');
  const assemblyPoints = getSafetyPoisByType('assembly');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TriangleAlert size={24} color="#FFFFFF" />
          <Text style={styles.headerTitle}>{t('emergency.title')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>{t('emergency.subtitle')}</Text>

        {origin && (
          <View style={styles.locationChip}>
            <MapPin size={14} color={COLORS.primary} />
            <Text style={styles.locationText}>
              {t('emergency.youAreNear')} {origin.short_name}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionCard, styles.getMeOutCard]}
          onPress={handleGetMeOut}
          disabled={!getMeOutRoute}
          accessibilityRole="button"
          accessibilityLabel={t('emergency.getMeOut')}
        >
          <LogOut size={28} color="#FFFFFF" />
          <View style={styles.routeInfo}>
            <Text style={styles.getMeOutTitle}>{t('emergency.getMeOut')}</Text>
            <Text style={styles.getMeOutMeta}>
              {nearestExit
                ? `${t('emergency.nearestExit')}: ${nearestExit.name}`
                : t('emergency.routeToMainGate')}
              {getMeOutRoute
                ? ` • ${getMeOutRoute.total_walk_time_minutes} ${t('map.minutes')}`
                : ''}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.callCard]}
          onPress={handleCallSecurity}
          accessibilityRole="button"
          accessibilityLabel={t('emergency.callSecurity')}
        >
          <Phone size={28} color="#FFFFFF" />
          <Text style={styles.callText}>{t('emergency.callSecurity')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => medicalRoute && handleRoute(medicalRoute)}
          disabled={!medicalRoute}
          accessibilityRole="button"
          accessibilityLabel={t('emergency.nearestMedical')}
        >
          <HeartPulse size={28} color={COLORS.danger} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeTitle}>{t('emergency.nearestMedical')}</Text>
            {medical && medicalRoute && (
              <Text style={styles.routeMeta}>
                {medical.short_name} • {medicalRoute.total_walk_time_minutes} {t('map.minutes')}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {nearestAssembly && assemblyRoute && (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => handleRoute(assemblyRoute)}
            accessibilityRole="button"
            accessibilityLabel={t('emergency.assemblyPoint')}
          >
            <Users size={28} color={COLORS.primary} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeTitle}>{t('emergency.assemblyPoint')}</Text>
              <Text style={styles.routeMeta}>
                {nearestAssembly.name} • {assemblyRoute.total_walk_time_minutes} {t('map.minutes')}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>{t('emergency.emergencyExits')}</Text>
        {exits.map((poi) => (
          <View key={poi.id} style={styles.poiRow}>
            <DoorOpen size={18} color={COLORS.danger} />
            <Text style={styles.poiText}>{poi.name}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>{t('emergency.aedStations')}</Text>
        {aeds.map((poi) => (
          <View key={poi.id} style={styles.poiRow}>
            <HeartPulse size={18} color={COLORS.danger} />
            <Text style={styles.poiText}>
              {poi.name}
              {poi.floor ? ` (${poi.floor})` : ''}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>{t('emergency.assemblyPoints')}</Text>
        {assemblyPoints.map((poi) => (
          <View key={poi.id} style={styles.poiRow}>
            <Users size={18} color={COLORS.primary} />
            <Text style={styles.poiText}>{poi.name}</Text>
          </View>
        ))}

        {nearestAed && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{t('emergency.nearestAed')}</Text>
            <Text style={styles.infoText}>{nearestAed.name}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: '#FFFFFF' },
  content: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING['3xl'] },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryPale,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  locationText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '500' },
  getMeOutCard: { backgroundColor: '#B91C1C' },
  getMeOutTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#FFFFFF' },
  getMeOutMeta: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  callCard: { backgroundColor: COLORS.danger },
  callText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#FFFFFF' },
  routeInfo: { flex: 1 },
  routeTitle: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.textPrimary },
  routeMeta: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  poiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  poiText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, flex: 1 },
  infoBox: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  infoTitle: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.textPrimary },
  infoText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
});
