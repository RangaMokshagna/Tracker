/** Browser route preview: keep native-only map modules out of the web bundle. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { palette } from '../../../theme/tokens';
import type { LocationPoint } from '../../../types/run';

interface LiveRouteMapProps {
  routePoints: LocationPoint[];
  currentLocation?: LocationPoint | null;
  height?: number;
}

export const LiveRouteMap: React.FC<LiveRouteMapProps> = ({
  routePoints,
  currentLocation,
  height = 280,
}) => {
  const activePoint = currentLocation ?? routePoints[routePoints.length - 1];
  const points = activePoint ? [...routePoints, activePoint] : routePoints;
  // Project nearby GPS coordinates to a route preview, preserving its aspect ratio.
  const origin = points[0];
  const projected = points.map((point) => ({
    x: (point.longitude - origin.longitude) * Math.cos(origin.latitude * Math.PI / 180),
    y: origin.latitude - point.latitude,
  }));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of projected) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  const span = Math.max(maxX - minX, maxY - minY, 0.0001);
  const preview = projected.map((point) => ({
    x: 50 + (point.x - (minX + maxX) / 2) / span * 76,
    y: 50 + (point.y - (minY + maxY) / 2) / span * 76,
  }));
  const marker = preview[preview.length - 1];

  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.label}>Route preview</Text>
      {marker ? (
        <Svg style={styles.preview} viewBox="0 0 100 100" accessibilityLabel="Recorded route and current position">
          {preview.length > 1 && (
            <Polyline
              points={preview.map((point) => `${point.x},${point.y}`).join(' ')}
              fill="none"
              stroke={palette.lime}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <Circle cx={marker.x} cy={marker.y} r={3} fill={palette.lime} />
        </Svg>
      ) : (
        <Text style={styles.message}>Waiting for location...</Text>
      )}
      <Text style={styles.caption}>Street maps are available in the mobile app.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#19272F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { flex: 1, width: '100%' },
  label: { color: '#FFFFFF', paddingTop: 14 },
  message: { color: '#888888', flex: 1, paddingTop: 40 },
  caption: { color: '#888888', fontSize: 12, padding: 14 },
});
