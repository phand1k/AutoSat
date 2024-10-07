import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, SafeAreaView, Modal, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledText from '../../components/texts/StyledText';
import { ThemeContext } from '../../context/ThemeContext';
import { colors } from '../../config/theme';
import { Ionicons } from '@expo/vector-icons';
function resolveReferences(json) {
    const idMap = new Map();
  
    function processObject(obj) {
      if (obj && typeof obj === 'object') {
        if (obj.$id) {
          idMap.set(obj.$id, obj);
        }
        for (const key in obj) {
          if (obj[key] && typeof obj[key] === 'object') {
            if (obj[key].$ref) {
              obj[key] = idMap.get(obj[key].$ref);
            } else {
              processObject(obj[key]);
            }
          }
        }
      }
    }
  
    processObject(json);
    return json;
  }
  
const ServiceDetailsScreen = ({ route, navigation }) => {
  const { washServiceId } = route.params;
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [serviceDetails, setServiceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token_avtosat');
        const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashService/DetailsWashService?id=${washServiceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch service details');
        }

        let data = await response.json();
        data = resolveReferences(data);  // Применяем функцию для развертывания ссылок
        console.log('Resolved Service Details:', data);
        setServiceDetails(data);
      } catch (error) {
        console.error('Error fetching service details:', error);
        Alert.alert('Ошибка', 'Не удалось получить подробности об услуге');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [washServiceId]);

  const handleCloseModal = () => {
    setDetailsModalVisible(false);
    setTimeout(() => navigation.goBack(), 300); // Задержка перед закрытием экрана для плавности
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: activeColors.primary }]}>
        <ActivityIndicator size="large" color={activeColors.tint} />
      </View>
    );
  }

  if (!serviceDetails) {
    return (
      <View style={[styles.container, { backgroundColor: activeColors.primary }]}>
        <StyledText style={{ color: activeColors.tint }}>Данные не найдены</StyledText>
      </View>
    );
  }

  const { service, price, dateOfCreated, whomAspNetUser } = serviceDetails;

  const createdBy = service?.aspNetUser
    ? `${service.aspNetUser.firstName} ${service.aspNetUser.lastName} ${service.aspNetUser.surName}`
    : 'Неизвестно';

  const assignedTo = whomAspNetUser && whomAspNetUser.firstName && whomAspNetUser.lastName && whomAspNetUser.surName
    ? `${whomAspNetUser.firstName} ${whomAspNetUser.lastName} ${whomAspNetUser.surName}`
    : 'Неизвестно';

  return (
    <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color={activeColors.tint} onPress={() => setDetailsModalVisible(true)} style={styles.backButton} />
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Подробности об услуге</Text>
      </View>
      <View style={styles.detailsContainer}>
        <StyledText style={[styles.title, { color: activeColors.tint }]}>Название услуги: {service?.name || 'Неизвестно'}</StyledText>
        <StyledText style={[styles.detailText, { color: activeColors.tint }]}>Цена: {price} тенге</StyledText>
        <StyledText style={[styles.detailText, { color: activeColors.tint }]}>Дата создания: {new Date(dateOfCreated).toLocaleString()}</StyledText>
        <StyledText style={[styles.detailText, { color: activeColors.tint }]}>Создано пользователем: {createdBy}</StyledText>
        <StyledText style={[styles.detailText, { color: activeColors.tint }]}>Назначено на: {assignedTo}</StyledText>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
            <StyledText style={styles.modalTitle}>Вы уверены, что хотите выйти?</StyledText>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
              onPress={handleCloseModal}
            >
              <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailText: {
    fontSize: 18,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
  },
});

export default ServiceDetailsScreen;
