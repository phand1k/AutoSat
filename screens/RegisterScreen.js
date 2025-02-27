import React, { useState, useContext } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { TextInputMask } from 'react-native-masked-text';
import { colors } from "../config/theme";
import { ThemeContext } from "../context/ThemeContext";
import CustomButton from "../components/CustomButton";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import getEnvVars from './config';

// Функция для проверки правильности номера
const validatePhoneNumber = (phoneNumber) => {
  const unmaskedPhoneNumber = phoneNumber.replace(/[^\d]/g, ''); // Убираем все символы, кроме цифр
  const regex = /^(7(700|701|702|705|707|708|747|771|775|776|777|778))\d{7}$/;
  return regex.test(unmaskedPhoneNumber); // Проверяем, соответствует ли номер формату
};

const RegisterScreen = ({ navigation }) => {
  const { apiUrl } = getEnvVars();
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [phoneNumber, setPhoneNumber] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);


  const fetchAndSaveOrganizationType = async (token) => {
    try {
      const response = await fetch(`${apiUrl}/api/organization/GetTypeOfOrganization`, {
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
      const response = await fetch(`${apiUrl}/api/Token/RegisterToken`, {
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
    }
    catch (error) {
      console.error('Error:', error);
      setError('Произошла ошибка при регистрации токена');
    }
    return token;
  };

  const handleRegister = async () => {
    const connectionState = await NetInfo.fetch();
    if (!connectionState.isConnected) {
      Alert.alert("Ошибка", "Нет интернет-соединения");
      return;
    }

    if (!phoneNumber || phoneNumber.includes('_') || !organizationId || !password || !confirmPassword) {
      Alert.alert("Ошибка", "Заполните все поля корректно");
      return;
    }

    // Проверка корректности номера
    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert("Ошибка", "Введите корректный номер телефона.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Ошибка", "Пароли не совпадают");
      return;
    }

    setLoading(true);
    const unmaskedPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
    try {
      const response = await fetch(`${apiUrl}/api/Authenticate/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          organizationId,
          phoneNumber: unmaskedPhoneNumber
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert("Ошибка", "БИН/ИИН организации некорректный или организация не зарегистрирована");
        } else if (response.status === 401) {
          Alert.alert("Ошибка", "Этот номер телефона уже существует");
        } else {
          Alert.alert("Ошибка", "Ошибка при регистрации");
        }
        setLoading(false);
        return;
      }

      Alert.alert("Успех", "Регистрация прошла успешно");

      // Автоматический вход после регистрации
      const loginResponse = await fetch(`${apiUrl}/api/authenticate/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: unmaskedPhoneNumber,
          password,
        }),
      });

      if (!loginResponse.ok) {
        Alert.alert("Ошибка", "Ошибка при автоматическом входе после регистрации");
        setLoading(false);
        return;
      }

      const data = await loginResponse.json();
      const token = data.token;
      await AsyncStorage.setItem('access_token_avtosat', token);

      // Получение роли пользователя
      const roleResponse = await fetch(`${apiUrl}/api/authenticate/GetRole`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!roleResponse.ok) {
        throw new Error('Failed to fetch user role');
      }

      const roleData = await roleResponse.json();
      const userRole = roleData.$values[0];
      await AsyncStorage.setItem('role_user_avtosat', userRole);

      await fetchAndSaveOrganizationType(token);
      
      // Регистрация для push-уведомлений
      await registerForPushNotificationsAsync();

      navigation.navigate('Footer');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert("Ошибка", "Произошла ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        backgroundColor: activeColors.primary,
        flex: 1,
        justifyContent: "center",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingHorizontal: 25, marginTop: 50 }}
      >
        <View style={{ alignItems: "center" }}>
          <Image
            source={{ uri: 'https://autosat.kz/login.png' }}
            style={{
              height: 200,
              width: 200,
              transform: [{ rotate: "-5deg" }],
            }}
          />
        </View>
        
        <Text
          style={{
            fontSize: 28,
            fontWeight: "500",
            color: activeColors.tint,
            marginBottom: 30,
          }}
        >
          Регистрация
        </Text>

        <TextInputMask
          type={'custom'}
          options={{ mask: '+7 (999) 999-99-99' }}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: activeColors.secondary,
            marginBottom: 20,
            fontSize: 16,
            color: activeColors.tint,
            paddingBottom: 10,
          }}
          keyboardType="numeric"
          placeholder="Введите ваш номер"
          placeholderTextColor="#aaaaaa"
          maxLength={18}
        />

        <TextInput
          style={{
            borderBottomWidth: 1,
            borderBottomColor: activeColors.secondary,
            marginBottom: 20,
            fontSize: 16,
            color: activeColors.tint,
            paddingBottom: 10,
          }}
          placeholder="БИН/ИИН организации"
          placeholderTextColor="#aaaaaa"
          maxLength={12}
          keyboardType="numeric"
          onChangeText={setOrganizationId}
          value={organizationId}
        />

        <TextInput
          style={{
            borderBottomWidth: 1,
            borderBottomColor: activeColors.secondary,
            marginBottom: 20,
            fontSize: 16,
            color: activeColors.tint,
            paddingBottom: 10,
          }}
          placeholder="Пароль"
          placeholderTextColor="#aaaaaa"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />

        <TextInput
          style={{
            borderBottomWidth: 1,
            borderBottomColor: activeColors.secondary,
            marginBottom: 20,
            fontSize: 16,
            color: activeColors.tint,
            paddingBottom: 10,
          }}
          placeholder="Подтверждение пароля"
          placeholderTextColor="#aaaaaa"
          secureTextEntry
          onChangeText={setConfirmPassword}
          value={confirmPassword}
        />

        {loading ? (
          <ActivityIndicator size="large" color={activeColors.tint} />
        ) : (
          <CustomButton label={"Регистрация"} onPress={handleRegister} />
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 30,
          }}
        >
          <Text style={{ color: activeColors.tint }}>Уже зарегистрированы? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: activeColors.accent, fontWeight: "700" }}>
              {" "}
              Войти
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 30 }}>
          <Text style={{ color: activeColors.tint }}>Нет номера организации? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("RegisterOrganization")}>
            <Text style={{ color: activeColors.accent, fontWeight: "700" }}> Регистрация организации </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
