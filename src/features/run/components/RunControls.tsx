/**
 * STRIDE — One-Thumb Live Run Controls
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "../../../components/ui";
import { useTheme } from "../../../theme/tokens";
import { RunStatus } from "../../../types/run";
import { useHaptics } from "../../../hooks/useHaptics";
import { Play, Pause, Square } from "lucide-react-native";

interface RunControlsProps {
  status: RunStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const RunControls: React.FC<RunControlsProps> = ({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  const { styles, colors } = useStyles();
  const haptics = useHaptics();

  if (status === RunStatus.Idle) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.giantStartButton}
          activeOpacity={0.8}
          onPress={() => {
            haptics.heavy();
            onStart();
          }}
        >
          <Play
            size={36}
            color={colors.textOnPrimary}
            fill={colors.textOnPrimary}
          />
          <Text style={styles.startBtnText}>START</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === RunStatus.Active) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.pauseButton}
          activeOpacity={0.8}
          onPress={() => {
            haptics.medium();
            onPause();
          }}
        >
          <Pause size={32} color={colors.text} fill={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  if (status === RunStatus.Paused) {
    return (
      <View style={styles.pausedRow}>
        <TouchableOpacity
          style={styles.stopButton}
          activeOpacity={0.8}
          onPress={() => {
            haptics.heavy();
            onStop();
          }}
        >
          <Square size={24} color="#FF4D4D" fill="#FF4D4D" />
          <Text style={styles.stopText}>FINISH</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resumeButton}
          activeOpacity={0.8}
          onPress={() => {
            haptics.medium();
            onResume();
          }}
        >
          <Play
            size={28}
            color={colors.textOnPrimary}
            fill={colors.textOnPrimary}
          />
          <Text style={styles.resumeText}>RESUME</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const useStyles = () => {
  const { colors, isDark } = useTheme();
  const styles = StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
    },
    giantStartButton: {
      width: 250,
      height: 64,
      borderRadius: 36,
      flexDirection: "row",
      gap: 10,
      borderWidth: 1,
      borderTopColor: "#E5F5E9",
      borderColor: "#93C2B5",
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 12,
    },
    startBtnText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textOnPrimary,
      letterSpacing: 2,
      marginTop: 4,
    },
    pauseButton: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.glassSubtle,
      borderWidth: 2,
      borderColor: colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    pausedRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 24,
      paddingVertical: 18,
    },
    stopButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255, 77, 77, 0.15)",
      borderWidth: 2,
      borderColor: "#FF4D4D",
      alignItems: "center",
      justifyContent: "center",
    },
    stopText: {
      fontSize: 11,
      fontWeight: "500",
      color: "#FF4D4D",
      marginTop: 2,
      letterSpacing: 1,
    },
    resumeButton: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 18,
      elevation: 10,
    },
    resumeText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textOnPrimary,
      marginTop: 2,
      letterSpacing: 1,
    },
  });
  return { styles, colors, isDark };
};
