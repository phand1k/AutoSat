import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledText from '../components/texts/StyledText';

const PaymentConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { washOrderId, orderTotal } = route.params;
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      const response = await fetch(`${cleanedSatApiURL}/api/Director/GetAllPaymentMethods`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setPaymentMethods(data.$values);
    } catch (error) {
      console.error(error);
    }
  };

  const completeWashOrder = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      const response = await fetch(`${cleanedSatApiURL}/api/director/CompleteWashOrder/?id=${washOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: washOrderId, paymentMethod: selectedPaymentMethod.name })
      });

      if (response.ok) {
        Alert.alert('Успех', 'Заказ-наряд успешно завершен');
        navigation.goBack(); // Вернуться к предыдущему экрану после завершения
      } else {
        Alert.alert('Ошибка', 'Не удалось завершить заказ-наряд');
      }
    } catch (error) {
      console.error('Error completing wash order:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при завершении заказа-наряда');
    }
  };

  return (
    <View style={styles.container}>
      <StyledText style={styles.title}>Подтверждение оплаты</StyledText>
      <StyledText style={styles.subtitle}>Сумма к оплате: {orderTotal} тг</StyledText>
      <StyledText style={styles.subtitle}>Выберите способ оплаты:</StyledText>
      <FlatList
        data={paymentMethods}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.paymentMethodItem, item.id === selectedPaymentMethod?.id && styles.selectedPaymentMethod]}
            onPress={() => setSelectedPaymentMethod(item)}
          >
            <StyledText style={styles.paymentMethodText}>{item.name}</StyledText>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={completeWashOrder}
        disabled={!selectedPaymentMethod}
      >
        <StyledText style={styles.confirmButtonText}>Подтвердить</StyledText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  paymentMethodItem: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 10,
    width: '80%',
    alignItems: 'center',
  },
  selectedPaymentMethod: {
    borderWidth: 2,
    borderColor: '#007bff',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
  },
  confirmButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#007bff',
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default PaymentConfirmationScreen;
