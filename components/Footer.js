import React, { useContext, useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../config/theme";
import { ThemeContext } from "../context/ThemeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from "../screens/HomeScreen";
import CreateOrderScreen from '../screens/CarWash/CreateOrderScreen';
import ListOfWashOrdersScreen from "../screens/CarWash/ListOfWashOrdersScreen";
import CartScreen from "../screens/CartScreen";
import SettingsScreen from "../screens/Settings";
import { useNavigation } from '@react-navigation/native';
import MyWashServicesScreen from "../screens/CarWash/MyWashServicesScreen";

const Tab = createBottomTabNavigator();

export default function Footer() {
  const { theme } = useContext(ThemeContext);
  let activeColors = colors[theme.mode];
  const [userRole, setUserRole] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await AsyncStorage.getItem('role_user_avtosat');
      setUserRole(role);
    };

    fetchUserRole();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserRole();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: activeColors.secondary,
        },
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "AutoSat") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Профиль") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Список") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "Мои заказ-наряды") {
            iconName = focused ? "cart" : "cart-outline";
          }
            else if (route.name === "Создать") {
            iconName = focused ? "add" : "add-outline";
          } else if (route.name === "Мойка") {
            iconName = focused ? "search" : "search-outline";
          }
          return <Ionicons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: activeColors.accent,
        tabBarInactiveTintColor: activeColors.tertiary,
        headerTitleAlign: "left",
        headerTitleStyle: {
          paddingLeft: 10,
          fontSize: 24,
        },
        headerStyle: {
          backgroundColor: activeColors.secondary,
        },
        headerTintColor: activeColors.tint,
      })}
    >
      <Tab.Screen name="AutoSat" component={HomeScreen} />
      {(userRole === 'Менеджер' || userRole === 'Директор') && (
        <Tab.Screen name="Мойка" component={ListOfWashOrdersScreen} />
      )}
      {(userRole === 'Менеджер' || userRole === 'Директор') && (
        <Tab.Screen name="Создать" component={CreateOrderScreen} />
      )}
      {(userRole === 'Мастер' || userRole === 'Менеджер') && (
        <Tab.Screen name="Мои заказ-наряды" component={MyWashServicesScreen} />
      )}
       {(userRole === 'Менеджер' || userRole === 'Директор') && (
        <Tab.Screen name="Список" component={CartScreen} />
      )}
      <Tab.Screen name="Профиль" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
