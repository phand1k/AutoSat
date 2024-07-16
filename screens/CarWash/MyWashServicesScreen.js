import React, { useContext, useState, useEffect } from "react";
import { View, TextInput, RefreshControl, FlatList, TouchableOpacity, StyleSheet, Text, Modal, Alert, Switch, Image } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import IphoneSlider from '../../components/IphoneSlider';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

const MyWashServicesScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [services, setServices] = useState([]);
  const [originalServices, setOriginalServices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [showCompleted]);

  const fetchServices = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const url = showCompleted 
        ? 'https://avtosat-001-site1.ftempurl.com/api/Master/GetAllMyCompletedServices' 
        : 'https://avtosat-001-site1.ftempurl.com/api/Master/GetAllMyServices';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const servicesData = data.$values.map(item => ({
        id: item.washServiceId, // Присваиваем правильное поле id
        serviceName: item.serviceName,
        price: item.price,
        order: item.order,
        carNumber: item.carNumber,
        dateOfCreated: item.dateOfCreated,
        salary: item.salary,
        timeAgo: formatDistanceToNow(parseISO(item.dateOfCreated), { locale: ru })
      }));

      setServices(servicesData);
      setOriginalServices(servicesData);
      setRefreshing(false);
    } catch (error) {
      console.error(error);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchServices();
  };

  const handleSearch = (text) => {
    setFilter(text);
    if (text === '') {
      setServices(originalServices);
    } else {
      const filteredData = originalServices.filter(service =>
        service.serviceName.toLowerCase().includes(text.toLowerCase()) ||
        service.order.toLowerCase().includes(text.toLowerCase()) ||
        service.carNumber.toLowerCase().includes(text.toLowerCase())
      );
      setServices(filteredData);
    }
  };

  const openModal = (service) => {
    console.log('Opening modal with service:', service); // Проверка правильности передаваемых данных
    setSelectedService(service);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedService(null);
  };

  const completeService = async () => {
    if (!selectedService) {
      Alert.alert('Ошибка', 'Услуга не выбрана');
      return;
    }

    console.log('Completing service with ID:', selectedService.id); // Проверка правильности id

    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Master/CompleteWashService?id=${selectedService.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      Alert.alert('Успех', 'Услуга завершена');
      fetchServices();
      closeModal();
    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка', 'Не удалось завершить услугу');
    }
  };

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)} style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
      <Image source={{ uri: 'https://icones.pro/wp-content/uploads/2022/02/icone-de-service-bleu.png' }} style={styles.itemImage} />
      <View style={styles.serviceDetails}>
        <StyledText style={styles.itemName}>{item.serviceName}</StyledText>
        <StyledText style={styles.itemDescription}>Цена: {item.price} тг</StyledText>
        <StyledText style={styles.itemInfo}>{item.order} ({item.carNumber})</StyledText>
        <StyledText style={styles.itemTimeAgo}>Создано: {item.timeAgo} назад</StyledText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color={activeColors.tint} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text style={styles.headerTitle}>Мои Услуги</Text>
      </View>
      <View style={styles.searchSwitchContainer}>
        <TextInput
          style={[styles.searchBox, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
          value={filter}
          onChangeText={handleSearch}
          placeholder="Поиск"
          placeholderTextColor={activeColors.tint}
          clearButtonMode="while-editing"
        />
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: activeColors.tint }]}>Показать завершенные</Text>
          <Switch
            value={showCompleted}
            onValueChange={setShowCompleted}
            trackColor={{ false: activeColors.secondary, true: activeColors.secondary }}
            thumbColor={showCompleted ? activeColors.tint : activeColors.primary}
          />
        </View>
      </View>
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {selectedService && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackground}>
            <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
              <View style={styles.modalHeader}>
                <StyledText style={styles.modalTitle}>{selectedService.serviceName}</StyledText>
                <StyledText style={styles.modalSubtitle}>Цена: {selectedService.price} тг</StyledText>
                <StyledText style={styles.modalSubtitle}>{selectedService.order} ({selectedService.carNumber})</StyledText>
                <StyledText style={styles.modalSubtitle}>Моя зарплата с услуги: {selectedService.salary} тг</StyledText>
              </View>
              {!showCompleted && (
                <>
                  <StyledText style={styles.swipeInstruction}>Свайпни вправо, чтобы отметить о завершении услуги</StyledText>
                  <View style={styles.sliderContainer}>
                    <IphoneSlider onComplete={completeService} onSwipeLeft={closeModal} />
                  </View>
                </>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  searchSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  searchBox: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    flex: 1,
    marginRight: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 8,
    color: '#007bff',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 3,
  },
  serviceDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  itemDescription: {
    fontSize: 16,
    color: '#555',
  },
  itemInfo: {
    fontSize: 14,
    color: '#888',
  },
  itemTimeAgo: {
    fontSize: 14,
    color: '#888',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    borderRadius: 15,
    padding: 25,
    elevation: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#007bff',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
  },
  swipeInstruction: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
    marginVertical: 20,
  },
  closeButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 25,
    alignItems: 'center',
    width: '80%',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
  },
});

export default MyWashServicesScreen;
