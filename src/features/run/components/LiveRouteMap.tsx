/**
 * STRIDE — Live Route Map Component
 */

import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { palette } from '../../../theme/tokens';
import type { LocationPoint } from '../../../types/run';
import { Navigation } from 'lucide-react-native';

interface LiveRouteMapProps {
  routePoints: LocationPoint[];
  currentLocation?: LocationPoint | null;
  height?: number;
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#171717' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#171717' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2b2b2b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212121' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
];

export const LiveRouteMap: React.FC<LiveRouteMapProps> = ({
  routePoints,
  currentLocation,
  height = 280,
}) => {
  const mapRef = useRef<MapView>(null);

  const coordinates = routePoints.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  const activePoint =
    currentLocation || (routePoints.length > 0 ? routePoints[routePoints.length - 1] : null);

  const initialRegion = {
    latitude: activePoint?.latitude || 37.7749,
    longitude: activePoint?.longitude || -122.4194,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
  };

  useEffect(() => {
    if (activePoint && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: activePoint.latitude,
          longitude: activePoint.longitude,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        },
        500
      );
    }
  }, [activePoint?.latitude, activePoint?.longitude]);

  const recenter = () => {
    if (activePoint && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: activePoint.latitude,
          longitude: activePoint.longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        },
        400
      );
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {coordinates.length > 1 && (
          <Polyline
            coordinates={coordinates}
            strokeColor={palette.lime}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {activePoint && (
          <Marker
            coordinate={{
              latitude: activePoint.latitude,
              longitude: activePoint.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.runnerMarker}>
              <View style={styles.runnerDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Recenter Button */}
      <TouchableOpacity style={styles.recenterButton} activeOpacity={0.7} onPress={recenter}>
        <Navigation size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  runnerMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(191, 255, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.lime,
  },
  runnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.lime,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
