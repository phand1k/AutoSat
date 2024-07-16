import React, { useContext, useState } from "react";
import { colors } from "../config/theme";
import { ThemeContext } from "../context/ThemeContext";
import { View, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { StyleSheet, Text } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CategoryTabSection from "../components/sections/CategoryTabSection";
import FeaturedItemsSection from "../components/sections/FeaturedItemsSection";
import HorizontalDealsSection from "../components/sections/HorizontalDealsSection";

const HomeScreens = () => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Fetch new data here and update your state
    // After fetching the data, set refreshing to false
    setRefreshing(false);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[
        {
          backgroundColor: activeColors.primary,
        },
        styles.container,
      ]}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Действия</Text>
          <View style={styles.iconsContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Notification')} style={styles.notificationIcon}>
              <Ionicons name="notifications-outline" size={28} color={activeColors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Профиль')} style={styles.profileIcon}>
              <Ionicons name="person-outline" size={28} color={activeColors.accent} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView>
          <View
            style={{
              flexDirection: "row",
              marginTop: 10,
              paddingHorizontal: 10,
            }}
          ></View>
          <CategoryTabSection />
        </ScrollView>
        <FeaturedItemsSection />
        <ScrollView>
          <View
            style={{
              flexDirection: "row",
              marginTop: 10,
              paddingHorizontal: 10,
            }}
          ></View>
          <HorizontalDealsSection />
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  iconsContainer: {
    flexDirection: 'row',
  },
  notificationIcon: {
    padding: 5,
  },
  profileIcon: {
    padding: 5,
    marginLeft: 15,
  },
  sectionTitle: {
    marginTop: 25,
    marginLeft: 25,
    marginBottom: 25,
  },
});

export default HomeScreens;
