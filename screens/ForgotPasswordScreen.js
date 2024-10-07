import React, { useState, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { TextInputMask } from 'react-native-masked-text';
import * as Animatable from 'react-native-animatable';
import { MaterialIcons } from '@expo/vector-icons'; // Иконки
import { colors } from '../config/theme'; // Тема
import { ThemeContext } from '../context/ThemeContext'; // Контекст темы

const ForgotPasswordScreen = () => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigation = useNavigation();

  const handleSendCode = async () => {
    if (phoneNumber.trim() === '') {
      Alert.alert('Ошибка', 'Введите номер телефона');
      return;
    }
    
    if (phoneNumber.replace(/[^\d]/g, '').length !== 11) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://avtosat-001-site1.ftempurl.com/api/Authenticate/ResetPassword?phoneNumber=${phoneNumber.replace(/[^\d]/g, '')}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (response.status === 400) {
        Alert.alert('Ошибка⛔', 'Неверный номер телефона');
      } else if (response.status === 500) {
        setStep(2); 
      } else if (response.status >= 200 && response.status < 300) {
        setStep(2); 
        Alert.alert('Отправлено✅', 'Код подтверждения был отправлен на ваш номер');
      } else {
        Alert.alert('Ошибка⛔', `Ошибка при отправке кода подтверждения. Статус: ${response.status}`);
        setStep(2);
      }
    } catch (error) {
      console.error('Error during sending code:', error.message);
      Alert.alert('Ошибка⛔', 'Не удалось отправить код подтверждения.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (confirmationCode.trim() === '') {
      Alert.alert('Ошибка⛔', 'Введите код подтверждения');
      return;
    }

    if (confirmationCode.length !== 4) {
      Alert.alert('Ошибка', 'Код подтверждения должен содержать 4 цифры');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://avtosat-001-site1.ftempurl.com/api/Authenticate/ConfirmResetPasswordCode?code=${confirmationCode}&phoneNumber=${phoneNumber.replace(/[^\d]/g, '')}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Неверный код подтверждения');
      }

      const data = await response.json();
      const token = data.token;

      await AsyncStorage.setItem('access_token_avtosat', token);

      const roleResponse = await fetch('https://avtosat-001-site1.ftempurl.com/api/authenticate/GetRole', {
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

      setLoading(false);

      navigation.navigate('Footer');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Неверный код⚠️', 'Введенный код неверный или истек срок действия');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.primary }]}>
          <View style={styles.logoContainer}>
            <Image source={require('../images/forgot-password.png')} style={styles.logo} />
          </View>
          <Animatable.View animation="fadeInUp" duration={800} style={styles.header}>
            <Text style={[styles.headerText, { color: activeColors.tint }]}>
              {step === 1 ? 'Восстановление пароля' : 'Введите код'}
            </Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200} duration={800} style={styles.form}>
            {step === 1 ? (
              <>
                <TextInputMask
                  type={'custom'}
                  options={{ mask: '+7 (999) 999-99-99' }}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  style={[styles.input, { borderBottomColor: activeColors.secondary, color: activeColors.tint }]}
                  keyboardType="numeric"
                  placeholder="Введите ваш номер телефона"
                  placeholderTextColor={activeColors.placeholder}
                  maxLength={18}
                />
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: activeColors.accent }]}
                  onPress={handleSendCode}
                  disabled={loading} // Отключение кнопки при загрузке
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Отправить код</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  value={confirmationCode}
                  onChangeText={setConfirmationCode}
                  style={[styles.input, { borderBottomColor: activeColors.secondary, color: activeColors.tint }]}
                  keyboardType="numeric"
                  placeholder="Введите код подтверждения"
                  placeholderTextColor={activeColors.placeholder}
                  maxLength={4}
                />
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: activeColors.accent }]}
                  onPress={handleVerifyCode}
                  disabled={loading} // Отключение кнопки при загрузке
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Подтвердить код</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Animatable.View>

          <Animatable.View animation="fadeIn" delay={400} duration={1000} style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.footerText, { color: activeColors.accent }]}>Вернуться на экран входа</Text>
            </TouchableOpacity>
          </Animatable.View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    height: 200,
    width: 300,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
  },
  form: {
    marginBottom: 50,
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 20,
    fontSize: 16,
    paddingBottom: 10,
    left: 20
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
