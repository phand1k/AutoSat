// components/DashboardReport.js
import React, { useState, useEffect } from "react";
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, Keyboard, TouchableWithoutFeedback, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { colors } from "../../config/theme";
import StyledText from "../texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import * as Linking from 'expo-linking';

const DashboardReport = ({ visible, onClose, theme }) => {
  const activeColors = colors[theme.mode];
  const [dashboardData, setDashboardData] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchDashboardData();
    }
  }, [visible]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/WashOrder/GetInfoForWashorderList', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (!dashboardData || !phoneNumber) {
      Alert.alert('Ошибка', 'Введите номер телефона и получите данные');
      return;
    }

    const message = `Отчет по заказам на ${moment().format('DD.MM.YYYY')}:
    - Общее количество заказов: ${dashboardData.countOfNotCompletedOrders}
    - Общее количество не завершенных услуг: ${dashboardData.countOfNotCompletedServices}
    - Общее количество завершенных услуг: ${dashboardData.countOfCompeltedServices}
    - Общая сумма услуг: ${dashboardData.summOfAllServices} тенге`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={[styles.dashboardModalView, { backgroundColor: activeColors.primary }]}>
            <View style={styles.dashboardContainer}>
              <View style={styles.dashboardHeader}>
                <StyledText style={styles.dashboardTitle}>Статистика машин на мойке</StyledText>
              </View>
              <StyledText style={styles.dashboardSubtitle}>Текущее время: {moment().format('HH:mm:ss')}</StyledText>
              {isLoading ? (
                <ActivityIndicator size="large" color={activeColors.tint} />
              ) : dashboardData ? (
                <>
                  <View style={styles.dashboardItem}>
                    <Ionicons name="car-sport-outline" size={40} color={activeColors.accent} />
                    <View style={styles.dashboardTextContainer}>
                      <StyledText style={styles.dashboardItemTitle}>Машин на мойке</StyledText>
                      <StyledText style={styles.dashboardItemValue}>{dashboardData.countOfNotCompletedOrders}</StyledText>
                    </View>
                  </View>
                  <View style={styles.dashboardItem}>
                    <Ionicons name="cash-outline" size={40} color={activeColors.accent} />
                    <View style={styles.dashboardTextContainer}>
                      <StyledText style={styles.dashboardItemTitle}>Сумма услуг</StyledText>
                      <StyledText style={styles.dashboardItemValue}>{dashboardData.summOfAllServices} тенге</StyledText>
                    </View>
                  </View>
                  <View style={styles.dashboardItem}>
                    <Ionicons name="construct-outline" size={40} color={activeColors.accent} />
                    <View style={styles.dashboardTextContainer}>
                      <StyledText style={styles.dashboardItemTitle}>Количество услуг</StyledText>
                      <StyledText style={styles.dashboardItemValue}>{dashboardData.countOfNotCompletedServices}</StyledText>
                    </View>
                  </View>
                  <View style={styles.dashboardItem}>
                    <Ionicons name="checkmark-done-outline" size={40} color={activeColors.accent} />
                    <View style={styles.dashboardTextContainer}>
                      <StyledText style={styles.dashboardItemTitle}>Завершено</StyledText>
                      <StyledText style={styles.dashboardItemValue}>{dashboardData.countOfCompeltedServices}</StyledText>
                    </View>
                  </View>
                  <TextInput
                    style={[styles.phoneNumberInput, { backgroundColor: activeColors.secondary, borderColor: activeColors.secondary, color: activeColors.tint }]}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Введите номер телефона"
                    placeholderTextColor={activeColors.tint}
                    keyboardType="phone-pad"
                  />
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.sendButton, { backgroundColor: activeColors.accent }]}
                      onPress={handleSendReport}
                    >
                      <Text style={[styles.buttonText, { color: activeColors.primary }]}>Отправить в WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text style={{ color: activeColors.tint }}>Не удалось загрузить данные</Text>
              )}
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
                onPress={onClose}
              >
                <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardModalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dashboardContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dashboardSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  dashboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dashboardTextContainer: {
    marginLeft: 10,
  },
  dashboardItemTitle: {
    fontSize: 16,
    color: '#666',
  },
  dashboardItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  phoneNumberInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  sendButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
  },
};

export default DashboardReport;
