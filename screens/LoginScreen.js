import React, { useContext, useState } from 'react';
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
const LoginScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
    try {
      const jwtToken = await AsyncStorage.getItem('access_token_avtosat');
      if (!jwtToken) {
        throw new Error('Authentication token is not available.');
      }
      console.log(jwtToken);
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Token/RegisterToken', {
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
  }

  const handleLogin = async () => {
    const connectionState = await NetInfo.fetch();
    if (!connectionState.isConnected) {
      Alert.alert('Ошибка', 'Нет интернет-соединения');
      return;
    }

    if (!phoneNumber || phoneNumber.includes('_') || !password) {
      Alert.alert('Ошибка', 'Заполните все поля корректно');
      return;
    }

    setLoading(true);
    const unmaskedPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
    try {
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/authenticate/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: unmaskedPhoneNumber,
          password,
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
      const roleResponse = await fetch('https://avtosat-001-site1.ftempurl.com/api/authenticate/GetRole', {
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ backgroundColor: activeColors.primary, flex: 1, justifyContent: 'center' }}>
        <View style={{ paddingHorizontal: 25 }}>
          <View style={{ alignItems: 'center' }}>
            <Image source={require('../images/login.png')} style={{ height: 200, width: 300, transform: [{ rotate: '-5deg' }] }} />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '500', color: activeColors.tint, marginBottom: 30 }}>Avto Sat</Text>
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
            <CustomButton label="Войти" onPress={handleLogin} disabled={loading} />
          )}
          <Text style={{ textAlign: 'center', color: activeColors.tint, marginBottom: 30 }}>Или войдите с помощью...</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
            <TouchableOpacity onPress={() => {}} style={{ backgroundColor: activeColors.secondary, borderRadius: 10, paddingHorizontal: 30, paddingVertical: 10 }}>
              <Image source={require('../images/google.png')} style={{ height: 24, width: 24 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}} style={{ backgroundColor: activeColors.secondary, borderRadius: 10, paddingHorizontal: 30, paddingVertical: 10 }}>
              <Image source={require('../images/facebook.png')} style={{ height: 24, width: 24 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}} style={{ backgroundColor: activeColors.secondary, borderRadius: 10, paddingHorizontal: 30, paddingVertical: 10 }}>
              <Image source={require('../images/apple.png')} style={{ height: 24, width: 24 }} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
            <Text style={{ color: activeColors.tint }}>Нет аккаунта? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={{ color: activeColors.accent, fontWeight: '700' }}> Зарегистрироваться </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;
