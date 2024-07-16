import React, { useState, useEffect } from "react";
import { Appearance, StatusBar, SafeAreaView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from 'expo-notifications';

import AuthLoadingScreen from './components/AuthLoadingScreen';
import LoginScreen from "./screens/LoginScreen";
import Footer from "./components/Footer";
import HomeScreens from "./screens/HomeScreen";
import RegisterScreen from "./screens/RegisterScreen";
import CreateServiceScreen from "./screens/CreateServiceScreen";
import RegisterOrganizationScreen from "./screens/RegisterOrganizationScreen";
import WashOrdersScreen from "./screens/WashOrdersScreen";
import ListOfWashOrdersScreen from "./screens/CarWash/ListOfWashOrdersScreen";
import AddServiceScreen from "./screens/AddServiceScreen";
import MyWashServicesScreen from './screens/CarWash/MyWashServicesScreen';
import CompletedWashOrdersScreen from "./screens/CarWash/CompletedWashOrdersScreen";
import PaymentConfirmationScreen from "./screens/PaymentConfirmationScreen";
import NotificationScreen from "./screens/NotificationScreen";
import AddWashServiceScreen from "./screens/CarWash/AddWashServiceScreen";
import { ThemeContext } from "./context/ThemeContext";
import ActivityScreen from '../AvtoMig/screens/CarWash/ActivityScreen';
import OrdersScreen from "./screens/CarWash/OrdersScreen";
import OrderDetailsScreen from "./screens/CarWash/OrderDetailsScreen";
import UserSelectionScreen from "./screens/CarWash/UserSelectionScreen";
import TransactionsScreen from "./screens/TransactionsScreen";
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

const App = () => {
  const [hidden, setHidden] = useState(false);
  const STYLES = ['default', 'dark-content', 'light-content'];
  const TRANSITIONS = ['fade', 'slide', 'none'];
  const [theme, setTheme] = useState({ mode: Appearance.getColorScheme() });
  const [isReady, setIsReady] = useState(false);
  const [statusBarStyle, setStatusBarStyle] = useState(STYLES[0]);
  const [statusBarTransition, setStatusBarTransition] = useState(
    TRANSITIONS[0],
  );

  const changeStatusBarVisibility = () => setHidden(!hidden);
  const updateTheme = async (newTheme) => {
    let mode;
    if (!newTheme) {
      mode = theme.mode === "dark" ? "light" : "dark";
      newTheme = { mode };
    }
    setTheme(newTheme);
    await AsyncStorage.setItem("homeTheme", JSON.stringify(newTheme));
  };

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("homeTheme");
      if (savedTheme) {
        setTheme(JSON.parse(savedTheme));
      } else {
        setTheme({ mode: Appearance.getColorScheme() });
      }
    };

    const prepare = async () => {
      try {
        await loadTheme();
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    };

    prepare();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log(notification);
    });
    return () => subscription.remove();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    
    <ThemeContext.Provider value={{ theme, setTheme, updateTheme }}>
      <StatusBar
        animated={true}
        backgroundColor="#61dafb"
        barStyle={statusBarStyle}
        showHideTransition={statusBarTransition}
        hidden={hidden}
      />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="AuthLoading">
          <Stack.Screen
            name="AuthLoading"
            component={AuthLoadingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Transactions"
            component={TransactionsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserSelection"
            component={UserSelectionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddWashService"
            component={AddWashServiceScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Activity"
            component={ActivityScreen}
            options={{ headerShown: false }}
          />
           <Stack.Screen
            name="Notification"
            component={NotificationScreen}
            options={{ headerShown: false }}
          />
           <Stack.Screen
            name="PaymentConfirmation"
            component={PaymentConfirmationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyWashServices"
            component={MyWashServicesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="WashOrders"
            component={WashOrdersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddService"
            component={AddServiceScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Footer"
            component={Footer}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreens}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateServiceScreen"
            component={CreateServiceScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterOrganization"
            component={RegisterOrganizationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CompletedWashOrders"
            component={CompletedWashOrdersScreen}
            options={{ headerShown: false }}
          />
          
          <Stack.Screen
            name="ListOfWashOrders"
            component={ListOfWashOrdersScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeContext.Provider>
  );
};

export default App;
