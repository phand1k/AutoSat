import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import StyledText from "../components/texts/StyledText";

const OrderDetailsScreen = () => {
  const route = useRoute();
  const { order } = route.params;

  return (
    <View style={styles.container}>
      <StyledText style={styles.title}>Детали заказа-наряда</StyledText>
      <StyledText style={styles.label}>Гос. номер: {order.licensePlate}</StyledText>
      <StyledText style={styles.label}>Марка: {order.brand}</StyledText>
      <StyledText style={styles.label}>Модель: {order.model}</StyledText>
      <StyledText style={styles.label}>Сумма услуг: {order.totalServices}</StyledText>
      <StyledText style={styles.label}>Сумма к оплате: {/* Добавьте логику для расчета суммы к оплате */}</StyledText>
      <StyledText style={styles.label}>Способы оплаты:</StyledText>
      <StyledText style={styles.paymentMethod}>Наличный</StyledText>
      <StyledText style={styles.paymentMethod}>Безналичный</StyledText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  paymentMethod: {
    fontSize: 18,
    marginLeft: 10,
  },
});

export default OrderDetailsScreen;
