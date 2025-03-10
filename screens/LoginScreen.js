import React, { useContext, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import { TextInputMask } from 'react-native-masked-text';
import { colors } from '../config/theme';
import { ThemeContext } from '../context/ThemeContext';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native'; // Для анимации пустого списка
import { KeyboardAvoidingView, Platform } from 'react-native';

const LoginScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  useEffect(() => {
    console.log('Login screen rendered');
  }, []);
  const registerForPushNotificationsAsync = async () => {
    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getDevicePushTokenAsync()).data;
    console.log("Push token " + token);
    try {
      const jwtToken = await AsyncStorage.getItem('access_token_avtosat');
      if (!jwtToken) {
        throw new Error('Authentication token is not available.');
      }
      console.log(jwtToken);
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
      
      const response = await fetch(`${cleanedSatApiURL}/api/Token/RegisterToken`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create token notification. HTTP status ${response.status}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Произошла ошибка при регистрации токена');
    }
    return token;
  };

  const fetchAndSaveOrganizationType = async (token) => {
    const SatApiURL = await AsyncStorage.getItem('SatApiURL');
    const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

    try {
      const response = await fetch(`${cleanedSatApiURL}/api/organization/GetTypeOfOrganization`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organization type');
      }

      const organizationType = await response.text();
      console.log('Organization type:', organizationType);

      await AsyncStorage.setItem('typeOfOrganization_avtosat', organizationType);
    } catch (error) {
      console.error('Error fetching organization type:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при получении типа организации');
    }
  };

  const handleLogin = async (demoPhoneNumber, demoPassword) => {
    console.log('Attempting to log in with phone:', phoneNumber, 'and password:', password);
  try {
    const response = await fetch(/* ваш запрос */);
    console.log('Login response status:', response.status);
    const data = await response.json();
    console.log('Login data:', data);
  } catch (error) {
    console.error('Login error:', error);
  }
    const connectionState = await NetInfo.fetch();
    if (!connectionState.isConnected) {
      Alert.alert('Ошибка', 'Нет интернет-соединения');
      return;
    }

    const currentPhoneNumber = demoPhoneNumber || phoneNumber;
    const currentPassword = demoPassword || password;

    if (!currentPhoneNumber || currentPhoneNumber.includes('_') || !currentPassword) {
      Alert.alert('Ошибка', 'Заполните все поля корректно');
      return;
    }

    setLoading(true);
    const unmaskedPhoneNumber = currentPhoneNumber.replace(/[^\d]/g, '');
    const SatApiURL = await AsyncStorage.getItem('SatApiURL');
     const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
    try {
      
      const response = await fetch(`${cleanedSatApiURL}/api/authenticate/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: unmaskedPhoneNumber,
          password: currentPassword,
        }),
      });

      if (!response.ok) {
        const errorMessage = response.status === 400 ? 'Неудачная авторизация' : 'Неверный номер телефона или пароль';
        Alert.alert('Ошибка', errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const token = data.token;
      await AsyncStorage.setItem('access_token_avtosat', token);

      // Получение роли пользователя
      console.log('Fetching user role...');
      

      const roleResponse = await fetch(`${cleanedSatApiURL}/api/authenticate/GetRole`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!roleResponse.ok) {
        const responseText = await roleResponse.text();
        console.error('Role fetch error:', responseText);
        throw new Error('Failed to fetch user role');
      }

      const roleData = await roleResponse.json();
      console.log('Role data:', roleData);
      const userRole = roleData.$values[0];

      // Записываем роль в AsyncStorage и проверяем запись
      await AsyncStorage.setItem('role_user_avtosat', userRole);
      const storedRole = await AsyncStorage.getItem('role_user_avtosat');
      console.log('Stored role:', storedRole); // Логирование для проверки

      // Получаем и сохраняем тип организации
      await fetchAndSaveOrganizationType(token);

      // Register for push notifications
      await registerForPushNotificationsAsync();

      navigation.navigate('Footer'); // Убедитесь, что 'Footer' правильно зарегистрирован
    } catch (error) {
      console.error('Error:', error);

      Alert.alert('Ошибка', 'Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoPhoneNumber = '+77024574566';
    const demoPassword = 'ohaviz11';
    handleLogin(demoPhoneNumber, demoPassword);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
      <SafeAreaView style={{ backgroundColor: activeColors.primary, flex: 1, justifyContent: 'center' }}>
        <View style={{ paddingHorizontal: 25 }}>
          <View style={{ alignItems: 'center' }}>
             <LottieView
                                                source={require('../assets/login-carwash.json')}
                                                autoPlay
                                                loop
                                                style={{ width: 300, height: 300 }}
                                            />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '500', color: activeColors.tint, marginBottom: 30 }}>AutoSat</Text>
          <TextInputMask
            type={'custom'}
            options={{ mask: '+7 (999) 999-99-99' }}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={{ borderBottomWidth: 1, borderBottomColor: activeColors.secondary, marginBottom: 20, fontSize: 16, color: activeColors.tint, paddingBottom: 10 }}
            keyboardType="numeric"
            placeholder="Введите ваш номер"
            maxLength={18}
            placeholderTextColor="#aaaaaa"
          />
          <TextInput
            style={{ borderBottomWidth: 1, borderBottomColor: activeColors.secondary, marginBottom: 20, fontSize: 16, color: activeColors.tint, paddingBottom: 10 }}
            placeholder="Пароль"
            placeholderTextColor="#aaaaaa"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />
          {loading ? (
            <ActivityIndicator size="large" color={activeColors.tint} />
          ) : (
            <>
              <CustomButton label="Войти" onPress={() => handleLogin()} disabled={loading} />
              <CustomButton label="Demo" onPress={handleDemoLogin} />
            </>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
            <Text style={{ color: activeColors.tint }}>Нет аккаунта? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RegisterWithOutOrganization')}>
              <Text style={{ color: activeColors.accent, fontWeight: '700' }}> Зарегистрироваться </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={{ color: activeColors.accent, marginTop: 20, textAlign: 'center' }}>Забыли пароль?</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;
