import React, { useState, useEffect } from "react";
import { Appearance, StatusBar, Modal, View, Button, Text, Linking, Alert } from "react-native";
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
import { CarProvider } from "./components/CarContext";  // Добавили CarProvider
import { ThemeContext } from "./context/ThemeContext";
import OrdersScreen from "./screens/CarWash/OrdersScreen";
import OrderDetailsScreen from "./screens/CarWash/OrderDetailsScreen";
import UserSelectionScreen from "./screens/CarWash/UserSelectionScreen";
import TransactionsScreen from "./screens/TransactionsScreen";
import UserDetailScreen from "./screens/UserDetailScreen";
import SalarySettingsScreen from "./screens/SalarySettingsScreen";
import CreateDetailingOrderScreen from "./screens/Detailing/CreateDetailingOrderScreen";
import ServiceDetailsScreen from "./screens/CarWash/ServiceDetailsScreen";
import DashboardScreen from "./screens/CarWash/DashboardScreen";
import AssignServiceScreen from "./screens/Detailing/AssignServiceScreen";
import ListOfDetailingOrdersScreen from "./screens/Detailing/ListOfDetailingOrdersScreen";
import CompletedDetailingOrdersScreen from "./screens/Detailing/CompletedDetailingOrdersScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import RegisterWithOutOrganizationScreen from "./screens/RegisterWithOutOrganization";
import BrandListScreen from "./screens/BrandListScreen";
import NewsScreen from "./screens/NewsScreen";
import StatisticsScreen from "./screens/StatisticsScreen";
import SalesScreen from "./screens/SalesScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
const Stack = createStackNavigator();
const App = () => {
  
  const [hidden, setHidden] = useState(false);
  const STYLES = ['default', 'dark-content', 'light-content'];
  const TRANSITIONS = ['fade', 'slide', 'none'];
  const [theme, setTheme] = useState({ mode: Appearance.getColorScheme() });
  const [isReady, setIsReady] = useState(false);
  const [statusBarStyle, setStatusBarStyle] = useState(STYLES[0]);
  const [statusBarTransition, setStatusBarTransition] = useState(TRANSITIONS[0]);
  const [modalVisible, setModalVisible] = useState(false);

  // Функция для получения версии с указанного URL
  const fetchAndSaveApiUrl = async () => {
    try {
      // Выполняем запрос к серверу для получения URL
      const response = await fetch('https://autosat.kz/devURL.json');
      if (!response.ok) {
        throw new Error('Failed to fetch API URL');
      }
  
      // Получаем URL как текст (если сервер возвращает не JSON, а просто текст)
      const apiUrl = await response.text();
  
      // Сохраняем URL в AsyncStorage
      await AsyncStorage.setItem('SatApiURL', apiUrl);
      console.log('API URL saved:', apiUrl);
    } catch (error) {
      console.error('Error fetching and saving API URL:', error);
    }
  };
  useEffect(() => {
    // При запуске приложения вызываем функцию для получения и сохранения URL
    fetchAndSaveApiUrl();
  }, []); // Пустой массив зависимостей гарантирует, что эффект выполнится только при монтировании

  // Функция для проверки версии и отображения модального окна при необходимости
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

  const handleUpdatePress = () => {
    // Редирект на страницу App Store
    const url = 'https://apps.apple.com/kz/app/autosat/id6575389746';
    Linking.openURL(url).catch((err) =>
      Alert.alert('Ошибка', 'Не удалось открыть ссылку на App Store')
    );
  };

  const handleCloseModal = () => {
    setModalVisible(false); // Закрытие модального окна
  };

  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, updateTheme }}>
      <CarProvider>
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
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterWithOutOrganization"
            component={RegisterWithOutOrganizationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BrandList"
            component={BrandListScreen}
            options={{ headerShown: false }}
          />
           <Stack.Screen
            name="News"
            component={NewsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AssignService"
            component={AssignServiceScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Sales"
            component={SalesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CompletedDetailingOrders"
            component={CompletedDetailingOrdersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SalarySettings"
            component={SalarySettingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Statistics"
            component={StatisticsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserDetail"
            component={UserDetailScreen}
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
            name="CreateDetailingOrder"
            component={CreateDetailingOrderScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserSelection"
            component={UserSelectionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ServiceDetails"
            component={ServiceDetailsScreen}
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
          <Stack.Screen
            name="ListOfDetailingOrders"
            component={ListOfDetailingOrdersScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Модальное окно для обновления */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
            <Text style={{ marginBottom: 20 }}>
              Обновите приложение, чтобы пользоваться новыми функциями.
            </Text>
            <Button title="Обновить" onPress={handleUpdatePress} />
            <Button title="Закрыть" onPress={handleCloseModal} color="red" />
          </View>
        </View>
      </Modal>
      </CarProvider>
      
    </ThemeContext.Provider>
  );
};

export default App;
