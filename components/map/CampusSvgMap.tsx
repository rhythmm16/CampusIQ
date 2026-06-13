import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { Building, Coordinates } from '@/types';
import { BUILDINGS, PATHS, CAMPUS_CENTER } from '@/constants/campus';
import { COLORS } from '@/constants/colors';

interface CampusSvgMapProps {
  activeWaypoints?: Coordinates[];
  highlightedBuildingId?: string | null;
  routeBuildingIds?: string[];
  onBuildingPress?: (building: Building) => void;
}

const VIEW = 1000;
const PADDING = 70;

/**
 * Projects lat/lng to local meters around the campus center (equirectangular),
 * which keeps the schematic geographically proportioned without a tile server.
 */
function toMeters(c: Coordinates): { x: number; y: number } {
  const latRad = (CAMPUS_CENTER.lat * Math.PI) / 180;
  const x = (c.lng - CAMPUS_CENTER.lng) * 111000 * Math.cos(latRad);
  const y = (c.lat - CAMPUS_CENTER.lat) * 111000;
  return { x, y };
}

export function CampusSvgMap({
  activeWaypoints,
  highlightedBuildingId,
  routeBuildingIds,
  onBuildingPress,
}: CampusSvgMapProps) {
  const { project, edges } = useMemo(() => {
    const points = BUILDINGS.map((b) => ({ id: b.building_id, ...toMeters(b.coordinates) }));
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Uniform scale so the map keeps real-world proportions.
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const scale = (VIEW - PADDING * 2) / Math.max(spanX, spanY);

    const offsetX = (VIEW - spanX * scale) / 2;
    const offsetY = (VIEW - spanY * scale) / 2;

    const project = (c: Coordinates) => {
      const m = toMeters(c);
      return {
        x: offsetX + (m.x - minX) * scale,
        // Flip Y: latitude increases northward, SVG y increases downward.
        y: offsetY + (maxY - m.y) * scale,
      };
    };

    const edges = PATHS.map((p) => {
      const from = BUILDINGS.find((b) => b.building_id === p.from);
      const to = BUILDINGS.find((b) => b.building_id === p.to);
      if (!from || !to) return null;
      return {
        a: project(from.coordinates),
        b: project(to.coordinates),
        accessible: p.is_accessible && !p.has_stairs,
      };
    }).filter(Boolean) as { a: { x: number; y: number }; b: { x: number; y: number }; accessible: boolean }[];

    return { project, edges };
  }, []);

  const routePoints = useMemo(() => {
    if (!activeWaypoints || activeWaypoints.length < 2) return null;
    return activeWaypoints.map((c) => project(c));
  }, [activeWaypoints, project]);

  const routeSet = useMemo(() => new Set(routeBuildingIds ?? []), [routeBuildingIds]);

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW} ${VIEW}`}>
        {/* Base path network */}
        {edges.map((e, i) => (
          <Line
            key={`edge-${i}`}
            x1={e.a.x}
            y1={e.a.y}
            x2={e.b.x}
            y2={e.b.y}
            stroke={COLORS.border}
            strokeWidth={4}
            strokeDasharray={e.accessible ? undefined : '8,6'}
          />
        ))}

        {/* Active route polyline */}
        {routePoints && (
          <Polyline
            points={routePoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={COLORS.primary}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Building markers */}
        {BUILDINGS.map((b) => {
          const p = project(b.coordinates);
          const isHighlighted = highlightedBuildingId === b.building_id;
          const onRoute = routeSet.has(b.building_id);
          const radius = isHighlighted || onRoute ? 18 : 13;
          return (
            <G key={b.building_id} onPress={() => onBuildingPress?.(b)}>
              {/* Larger transparent hit area for easier taps */}
              <Circle cx={p.x} cy={p.y} r={28} fill="transparent" />
              <Circle
                cx={p.x}
                cy={p.y}
                r={radius}
                fill={onRoute ? COLORS.primary : b.marker_color}
                stroke="#FFFFFF"
                strokeWidth={3}
              />
              <SvgText
                x={p.x}
                y={p.y - radius - 6}
                fill={COLORS.textPrimary}
                fontSize={20}
                fontWeight="600"
                textAnchor="middle"
              >
                {b.short_name}
              </SvgText>
            </G>
          );
        })}

        {/* Start / end emphasis */}
        {routePoints && (
          <>
            <Circle cx={routePoints[0].x} cy={routePoints[0].y} r={11} fill="#10B981" stroke="#FFFFFF" strokeWidth={3} />
            <Circle
              cx={routePoints[routePoints.length - 1].x}
              cy={routePoints[routePoints.length - 1].y}
              r={11}
              fill={COLORS.danger}
              stroke="#FFFFFF"
              strokeWidth={3}
            />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
