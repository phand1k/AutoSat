import React, { useState, useContext, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
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
import { Button, Dialog, Portal, Provider, Card } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';


const validatePhoneNumber = (phoneNumber) => {
  const unmaskedPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
  const regex = /^(7(700|701|702|705|707|708|747|771|775|776|777|778))\d{7}$/;
  return regex.test(unmaskedPhoneNumber);
};

const RegisterWithOutOrganizationScreen = ({ navigation }) => {

  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizationTypes, setOrganizationTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTypeName, setSelectedTypeName] = useState('Выберите тип организации');

  useEffect(() => {
    const fetchOrganizationTypes = async () => {
      try {
        const SatApiURL = await AsyncStorage.getItem('SatApiURL');
        const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
    
        console.log("URL: " + cleanedSatApiURL);
    
        const response = await fetch(`${cleanedSatApiURL}/api/Organization/TypeOfOrganizationsList`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        const data = await response.json();
        setOrganizationTypes(data.$values);
      } catch (error) {
        console.error('Error fetching organization types:', error);
      }
    };

    fetchOrganizationTypes();
  }, []);

  const fetchAndSaveOrganizationType = async (token) => {
    try {
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
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
    try {
      const jwtToken = await AsyncStorage.getItem('access_token_avtosat');
      if (!jwtToken) {
        throw new Error('Authentication token is not available.');
      }
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
      const response = await fetch(`${cleanedSatApiURL}/Token/RegisterToken`, {
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
    }
    return token;
  };

  const handleRegister = async () => {
    const connectionState = await NetInfo.fetch();
    if (!connectionState.isConnected) {
      Alert.alert("Ошибка", "Нет интернет-соединения");
      return;
    }
  
    if (!phoneNumber || phoneNumber.includes('_') || !password || !confirmPassword || !selectedType) {
      Alert.alert("Ошибка", "Заполните все поля корректно");
      return;
    }
  
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
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
  
      // Регистрация пользователя
      const registerResponse = await fetch(`${cleanedSatApiURL}/api/Authenticate/RegisterWithoutOrganizationNumber?typeOfOrganizationId=${selectedType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: unmaskedPhoneNumber,
          password: password,
        }),
      });
  
      if (!registerResponse.ok) {
        Alert.alert("Ошибка", "Ошибка при регистрации");
        setLoading(false);
        return;
      }
  
      // Автоматический вход после успешной регистрации
      const loginResponse = await fetch(`${cleanedSatApiURL}/api/authenticate/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: unmaskedPhoneNumber,
          password: password,
        }),
      });
  
      if (!loginResponse.ok) {
        Alert.alert("Ошибка", "Ошибка при автоматическом входе после регистрации");
        setLoading(false);
        return;
      }
  
      const loginData = await loginResponse.json();
      const token = loginData.token;
      await AsyncStorage.setItem('access_token_avtosat', token);
  
      // Получение роли пользователя
      const roleResponse = await fetch(`${cleanedSatApiURL}/api/authenticate/GetRole`, {
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
  
      // Получение и сохранение типа организации
      await fetchAndSaveOrganizationType(token);
  
      // Регистрация для push-уведомлений
      await registerForPushNotificationsAsync();
  
      // Навигация на главный экран
      navigation.navigate('Footer');
  
    } catch (error) {
      console.error('Ошибка:', error);
      Alert.alert("Ошибка", "Произошла ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (type) => {
    setSelectedType(type.id);
    setSelectedTypeName(type.name);
    setModalVisible(false);
  };

  return (
    <Provider>
      <KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
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
            <LottieView
              source={require('../assets/register.json')}
              autoPlay
              loop
              style={{ width: 300, height: 300 }}
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

          <Button
            mode="contained"
            onPress={() => setModalVisible(true)}
            style={{ marginBottom: 20, backgroundColor: activeColors.accent }}
          >
            {selectedTypeName}
          </Button>

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
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: activeColors.accent, fontWeight: "700" }}> Вход </Text>
            </TouchableOpacity>

            <Text style={{ color: activeColors.tint }}> | </Text>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={{ color: activeColors.accent, fontWeight: "700" }}> Регистрация </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Portal>
          <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
            <Dialog.Title>Выберите тип организации</Dialog.Title>
            <Dialog.Content>
              {organizationTypes.map((type) => (
                <TouchableOpacity key={type.id} onPress={() => handleSelectType(type)}>
                  <Card style={{
                    marginBottom: 10,
                    backgroundColor: selectedType === type.id ? activeColors.accent : activeColors.primary,
                    borderWidth: 1,
                    borderColor: selectedType === type.id ? activeColors.secondary : activeColors.primary,
                  }}>
                    <Card.Content>
                      <Text style={{ color: activeColors.tint }}>{type.name}</Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setModalVisible(false)}>Отмена</Button>
              <Button onPress={() => setModalVisible(false)}>ОК</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </Provider>
  );
};

export default RegisterWithOutOrganizationScreen;