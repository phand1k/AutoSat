import React from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import StyledText from '../../components/texts/StyledText';

const ServiceDetailsModal = ({ visible, onClose, serviceDetails, theme }) => {
  const { serviceName, salary, aspNetUser, price } = serviceDetails || {};
  const userFullName = aspNetUser ? `${aspNetUser.firstName} ${aspNetUser.lastName} ${aspNetUser.surName}` : '';

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={[styles.modalView, { backgroundColor: theme.primary }]}>
        <StyledText style={styles.modalTitle}>Подробности об услуге</StyledText>
        <StyledText style={styles.modalSubtitle}>Название услуги: {serviceName || 'Неизвестно'}</StyledText>
        <StyledText style={styles.modalSubtitle}>Зарплата: {salary} ₸</StyledText>
        <StyledText style={styles.modalSubtitle}>Назначено на: {userFullName}</StyledText>
        <StyledText style={styles.modalSubtitle}>Цена: {price} ₸</StyledText>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.accent }]} onPress={onClose}>
          <Text style={[styles.closeButtonText, { color: theme.primary }]}>Закрыть</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 10,
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
});

export default ServiceDetailsModal;
