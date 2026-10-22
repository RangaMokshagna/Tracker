/**
 * STRIDE — Auto Pause Status Banner
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../components/ui';
import { PauseCircle } from 'lucide-react-native';

interface AutoPauseBannerProps {
  visible: boolean;
}

export const AutoPauseBanner: React.FC<AutoPauseBannerProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <PauseCircle size={18} color="#FFB800" />
      <Text variant="label" style={styles.bannerText}>
        AUTO-PAUSED — Movement Stopped
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginHorizontal: 20,
    marginVertical: 6,
  },
  bannerText: {
    color: '#FFB800',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
});
