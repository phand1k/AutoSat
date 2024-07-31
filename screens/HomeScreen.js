import React, { useContext, useState, useEffect } from "react";
import { View, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Text, Appearance, Switch, Alert, Linking } from "react-native";
import { colors } from "../config/theme";
import { ThemeContext } from "../context/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreens = () => {
  const { theme, updateTheme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(theme.mode === "dark");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await AsyncStorage.getItem('role_user_avtosat');
      setUserRole(role);
    };

    fetchUserRole();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkTheme(colorScheme === "dark");
    });

    return () => subscription.remove();
  }, []);

  const toggleTheme = () => {
    updateTheme();
    setIsDarkTheme(prev => !prev);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Fetch new data here and update your state
    // After fetching the data, set refreshing to false
    setRefreshing(false);
  };

  const allMenuItems = [
    { title: "Задачи", icon: "checkbox-outline", roles: ["Мастер"] },
    { title: "Заказы", icon: "file-tray-stacked-outline", roles: ["Менеджер", "Директор", "Мастер"] },
    { title: "Платежи", icon: "cash-outline", roles: ["Директор"] },
    { title: "Продажи", icon: "cart-outline", roles: ["Менеджер", "Директор"], soon: true },
    { title: "Сотрудники", icon: "people-outline", roles: ["Менеджер", "Директор"] },
    { title: "Остатки", icon: "layers-outline", roles: ["Директор"], soon: true},
    { title: "Услуги", icon: "briefcase-outline", roles: ["Менеджер", "Директор", "Мастер"] },
    { title: "Веб-версия", icon: "logo-chrome", roles: ["Менеджер", "Директор", "Мастер"], soon: true },
    { title: "Пригласить", icon: "pulse-outline", roles: ["Мастер", "Директор"] }
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  const animation = {
    0: { scale: 1 },
    0.5: { scale: 1.2 },
    1: { scale: 1 },
  };

  const handleMenuItemPress = (title) => {
    if (title === "Пригласить") {
      navigation.navigate("InviteUser", { userRole });
    } else if (title === "Заказы") {
      navigation.navigate("Мойка", { userRole });
    } else if (title === "Задачи") {
      navigation.navigate("Мои заказ-наряды", { userRole });
    } else if (title === "Сотрудники") {
      navigation.navigate("SalarySettings", { userRole });
    } else if (title === "Веб-версия") {
      Linking.openURL('https://autosat.kz');
    } else if (title === "Платежи") {
      navigation.navigate("Transactions");
    }
    else if (title === "Услуги") {
      navigation.navigate("Список");
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[{ backgroundColor: activeColors.primary }, styles.container]}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ flexGrow: 1 }}>
        <View style={[styles.header, { backgroundColor: activeColors.header }]}>
          <Text style={[styles.headerTitle, { color: activeColors.accent }]}>Привет👋</Text>
          <View style={styles.iconsContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Notification')} style={styles.notificationIcon}>
              <Ionicons name="notifications-outline" size={28} color={activeColors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Профиль')} style={styles.profileIcon}>
              <Ionicons name="person-outline" size={28} color={activeColors.accent} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.themeSwitchContainer}>
          <Text style={{ color: activeColors.text }}>Темная тема</Text>
          <Switch
            value={isDarkTheme}
            onValueChange={toggleTheme}
            thumbColor={isDarkTheme ? "#fff" : activeColors.tertiary}
            ios_backgroundColor={activeColors.primary}
            trackColor={{
              false: activeColors.primary,
              true: activeColors.accent,
            }}
          />
        </View>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.menuItem, { backgroundColor: activeColors.menuItem }]} onPress={() => handleMenuItemPress(item.title)}>
              <Animatable.View
                animation={animation}
                iterationCount="infinite"
                duration={2000}
                useNativeDriver
              >
                <Ionicons name={item.icon} size={28} color={activeColors.accent} />
              </Animatable.View>
              <Text style={[styles.menuItemText, { color: activeColors.text }]}>{item.title}</Text>
              {item.soon && <Text style={styles.soonLabel}>Soon</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <Text style={[styles.versionText, { color: activeColors.accent }]}>Версия 2.30.2</Text>
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
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  versionText: {
    padding: 'auto',
    left: 20,
    fontSize: 12,
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
  themeSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
    marginTop: -20,
  },
  menuItem: {
    width: '40%',
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  menuItemText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  soonLabel: {
    marginTop: 5,
    fontSize: 12,
    color: 'green',
    fontWeight: 'bold',
  },
});

export default HomeScreens;
