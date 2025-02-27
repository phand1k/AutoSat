import React, { useContext, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { ThemeContext } from "../context/ThemeContext";
import { colors } from "../config/theme";
import StyledText from "../components/texts/StyledText";
import getEnvVars from './config';

const PaymentScreen = ({ route, navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const { totalAmount, orderId } = route.params;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const { apiUrl } = getEnvVars();
  const paymentMethods = ['Cash', 'Credit Card', 'Mobile Payment'];

  const handlePaymentMethodSelection = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleConfirmCompletion = () => {
    setConfirmationModalVisible(true);
  };

  const confirmOrderCompletion = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`${apiUrl}/api/director/CompleteWashOrder/?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: orderId })
      });

      if (response.ok) {
        Alert.alert('Успех', 'Заказ-наряд успешно завершен');
        navigation.goBack(); // Navigate back after successful completion
      } else {
        Alert.alert('Ошибка', 'Не удалось завершить заказ-наряд');
      }
    } catch (error) {
      console.error('Error completing wash order:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при завершении заказа-наряда');
    } finally {
      setConfirmationModalVisible(false);
    }
  };

  return (
    <View style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <StyledText style={[styles.title, { color: activeColors.tint }]}>Сумма услуг: {totalAmount} тг</StyledText>
      <StyledText style={[styles.title, { color: activeColors.tint }]}>Выберите способ оплаты:</StyledText>
      {paymentMethods.map((method, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.paymentMethodButton,
            selectedPaymentMethod === method && { backgroundColor: activeColors.accent }
          ]}
          onPress={() => handlePaymentMethodSelection(method)}
        >
          <Text style={{ color: activeColors.tint }}>{method}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: activeColors.accent }]}
        onPress={handleConfirmCompletion}
      >
        <Text style={styles.confirmButtonText}>Подтвердить завершение заказ-наряда</Text>
      </TouchableOpacity>

      {confirmationModalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={confirmationModalVisible}
          onRequestClose={() => setConfirmationModalVisible(false)}
        >
          <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
            <StyledText style={styles.modalTitle}>Подтверждение завершения</StyledText>
            <StyledText style={styles.modalSubtitle}>Вы уверены, что хотите завершить заказ-наряд?</StyledText>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
              onPress={confirmOrderCompletion}
            >
              <Text style={styles.modalButtonText}>Да</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
              onPress={() => setConfirmationModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Нет</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  paymentMethodButton: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  confirmButton: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalView: {
    flex: 1,
    marginTop: 50,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PaymentScreen;
