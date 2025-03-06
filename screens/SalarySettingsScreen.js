import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, TextInput,
  Alert, Animated, Keyboard, TouchableWithoutFeedback, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import StyledText from '../components/texts/StyledText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const predefinedMessages = [
  { id: 1, description: "Внимание! Скидка 20%", text: "🔥 Внимание! Скидка 20% на все услуги! 🔥 Запишитесь прямо сейчас! 📞 Ваш_номер_телефона  📍 г. Шымкент, ...", icon: 'cash-outline' },
  { id: 2, description: "Полная подготовка авто с 15% скидкой", text: "🚗 Полная подготовка авто с 15% скидкой! Только до конца недели! Запись: 📞 Ваш_номер_телефона 📍 г. Шымкент, ...", icon: 'cart-outline' },
  { id: 3, description: "Химчистка салона с бонусом!", text: "✨ Химчистка салона с бонусом! Получите бесплатную ароматизацию! 📍 Наш адрес: г. Шымкент, ... 📞 Запись: Ваш_номер_телефона ", icon: 'card-outline' },
  { id: 4, description: "Подарок за ваш визит! Любая услуга – и бесплатное покрытие воском!", text: "🌟 Подарок за ваш визит! Любая услуга – и бесплатное покрытие воском! 📞 Запись: Ваш_номер_телефона  📍 г. Шымкент, ...", icon: 'gift' }
];

const SalarySettingsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [modalVisible, setModalVisible] = useState(false);

  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('+77024574566');
  const [address, setAddress] = useState('г. Шымкент, Дулати 183');
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const sendNewsletter = async () => {
    if (!message.trim()) {
      Alert.alert('Ошибка', 'Введите сообщение для рассылки');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        Alert.alert('Ошибка', 'Отсутствует токен авторизации');
        return;
      }
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim();
      const response = await fetch(`${cleanedSatApiURL}/api/Loyalty/NewsLetter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.replace('{phone}', phone).replace('{address}', address) }),
      });

      if (response.ok) {
        Alert.alert('Успех', 'Сообщения успешно отправлены');
        setMessage('');
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить сообщения');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Ошибка соединения с сервером');
      console.error('Ошибка:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={activeColors.tint} />
            </TouchableOpacity>
            <StyledText style={[styles.headerTitle, { color: activeColors.tint }]}>Рассылка сообщений</StyledText>
          </View>

          {/* Памятка перед шаблонами */}
          <LinearGradient colors={["#99999e", "#c1c1c9"]} style={styles.noteContainer}>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Ionicons name="information-circle-outline" size={34} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.noteText, { color: "#fff" }]}>
              Это шаблоны сообщений. Выберите подходящий шаблон, при необходимости измените номер телефона или адрес, и отправьте сообщение.
            </Text>
          </LinearGradient>

          <ScrollView style={styles.templatesContainer}>
            {predefinedMessages.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setMessage(item.text)}
              >
                <LinearGradient colors={["#99999e", "#c1c1c9"]} style={styles.templateCard}>
                  <Ionicons name={item.icon} size={24} color="#fff" />
                  <Text style={[styles.templateText, { color: "#fff" }]}>{item.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Поле для ввода сообщения */}

          <TextInput
            style={[styles.messageInput, { borderColor: activeColors.secondary, color: activeColors.tint }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Введите сообщение для рассылки"
            placeholderTextColor={activeColors.tint}
            multiline
          />

          {/* Модальное окно */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: activeColors.primary }]}>
                  <Text style={[styles.modalText, { color: activeColors.tint }]}>
                    Сообщение будет отправлено всем клиентам, которые посещали ваш центр.
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: activeColors.primary }]}>Закрыть</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Кнопка отправки */}
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: activeColors.accent }]} onPress={sendNewsletter}>
            <Text style={[styles.sendButtonText, { color: activeColors.primary }]}>📨 Отправить</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    paddingTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  messageInput: {
    height: 120,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 15,
    flex: 1,
  },
  templatesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginVertical: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  templateText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
  sendButton: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 26,
  },
  modalButton: {
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SalarySettingsScreen;