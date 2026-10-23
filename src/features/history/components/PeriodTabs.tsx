/**
 * STRIDE — History Period Selector Tabs
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "../../../components/ui";
import { useTheme } from "../../../theme/tokens";
import { useHaptics } from "../../../hooks/useHaptics";

export type HistoryPeriod = "week" | "month" | "all";

interface PeriodTabsProps {
  selected: HistoryPeriod;
  onSelect: (period: HistoryPeriod) => void;
}

export const PeriodTabs: React.FC<PeriodTabsProps> = ({
  selected,
  onSelect,
}) => {
  const { styles } = useStyles();
  const haptics = useHaptics();

  const options: { id: HistoryPeriod; label: string }[] = [
    { id: "week", label: "WEEK" },
    { id: "month", label: "MONTH" },
    { id: "all", label: "ALL TIME" },
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = selected === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.tab, isActive && styles.activeTab]}
            activeOpacity={0.8}
            onPress={() => {
              haptics.selection();
              onSelect(opt.id);
            }}
          >
            <Text
              variant="caption"
              color={isActive ? "dark900" : "dark300"}
              style={[styles.tabText, isActive && styles.activeTabText]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const useStyles = () => {
  const { colors, isDark } = useTheme();
  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: colors.glassSubtle,
      borderRadius: 16,
      padding: 4,
      marginHorizontal: 20,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontWeight: "700",
      letterSpacing: 1,
      fontSize: 11,
    },
    activeTabText: {
      fontWeight: "800",
      color: colors.textOnPrimary,
    },
  });
  return { styles, colors, isDark };
};
