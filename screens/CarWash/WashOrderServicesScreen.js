import React, { useContext, useState, useEffect, useRef } from "react";
import { View, SafeAreaView, TextInput, RefreshControl, FlatList, TouchableOpacity, StyleSheet, Text, Image, Modal, ScrollView, Alert, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Dimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useFocusEffect, useRoute } from '@react-navigation/native';

const initialLayout = { width: Dimensions.get('window').width };

const WashOrderServicesScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const route = useRoute();
  const { orderId } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editedPrice, setEditedPrice] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignedServices, setAssignedServices] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [salary, setSalary] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [isFetchingSalary, setIsFetchingSalary] = useState(false);
  const fetchedSalaryRef = useRef(false);
  const isAddingServiceRef = useRef(false);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [recentlyClosedOrder, setRecentlyClosedOrder] = useState(null);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchUsers();
    fetchAssignedServices(orderId);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchAssignedServices(orderId);
    }, [orderId])
  );

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Director/GetAllUsers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data.$values);
      setFilteredUsers(data.$values);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchServices = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Service/GetAllServices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      const services = data.$values.map(service => ({
        id: service.id,
        name: service.name,
        price: `${service.price} ₸`
      }));

      setServices(services);
      setFilteredServices(services);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAssignedServices = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashService/AllWashServicesOnOrderAsync?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAssignedServices(data.$values.filter(service => service.washServiceId !== null));
    } catch (error) {
      console.error(error);
    }
  };

  const onModalRefresh = async () => {
    setRefreshing(true);
    await fetchAssignedServices(orderId);
    await fetchServices();
    await fetchUsers();
    setRefreshing(false);
  };

  const handleServiceSearch = (text) => {
    setServiceFilter(text);
    if (text === '') {
      setFilteredServices(services);
    } else {
      const filteredData = services.filter(service =>
        service.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredServices(filteredData);
    }
  };

  const handleUserSearch = (text) => {
    setUserFilter(text);
    if (text === '') {
      setFilteredUsers(users);
    } else {
      const filteredData = users.filter(user =>
        `${user.firstName} ${user.lastName} ${user.surName}`.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUsers(filteredData);
    }
  };

  const handleServicePress = (service) => {
    setSelectedService(service);
    setEditedPrice(service.price.replace(' ₸', ''));
    setUserModalVisible(true);
  };

  const handleUserItemPress = (user) => {
    if (selectedService) {
      setSelectedUser(user);
      setUserModalVisible(false);
      fetchSalary(selectedService, user);
    } else {
      Alert.alert('Ошибка', 'Выберите услугу перед выбором пользователя.');
    }
  };

  const fetchSalary = async (service, user) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Salary/GetSalaryUser?serviceId=${service.id}&aspNetUserId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 404) {
        setSalaryModalVisible(true);
      } else if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching salary:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        const data = await response.json();
        if (typeof data === 'number') {
          addServiceToOrder(service, user, data);
        } else {
          Alert.alert('Ошибка', 'Неверный формат ответа API');
        }
      }
    } catch (error) {
      if (error.message.includes('404')) {
        setSalaryModalVisible(true);
      } else {
        Alert.alert('Ошибка', 'Не удалось получить зарплату для данной услуги');
      }
    } finally {
      setIsFetchingSalary(false);
      fetchedSalaryRef.current = false;
    }
  };

  const addServiceToOrder = async (service, user, salary) => {
    if (isAddingServiceRef.current) return;
    isAddingServiceRef.current = true;
    setIsAddingService(true);

    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const price = parseFloat(editedPrice);

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/WashService/CreateWashService', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: service.id,
          washOrderId: orderId,
          price: price,
          serviceName: service.name,
          whomAspNetUserId: user.id,
          salary: salary || parseFloat(editedPrice)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка сервера:', errorData);
        throw new Error('Failed to add service to order');
      }

      const serviceWithUpdatedPrice = { ...service, price: `${price} ₸`, user: `${user.firstName} ${user.lastName} ${user.surName}`, salary: salary || editedPrice };

      setAssignedServices(prevServices => [...prevServices, serviceWithUpdatedPrice]);

      Alert.alert(
        'Успех',
        `Услуга успешно добавлена:\nНазвание услуги: ${service.name}\nЦена: ${price} ₸\nЗарплата: ${salary || editedPrice} ₸`
      );

      setSelectedService(null);
      setSelectedUser(null);
      fetchAssignedServices(orderId);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить услугу к заказу');
    } finally {
      isAddingServiceRef.current = false;
      setIsAddingService(false);
    }
  };

  const removeServiceFromOrder = async (washServiceId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashService/DeleteWashServiceFromOrder?id=${washServiceId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Alert.alert('Успех', 'Услуга успешно удалена из заказ-наряда');
        fetchAssignedServices(orderId);
      } else {
        Alert.alert('Ошибка', 'Не удалось удалить услугу из заказ-наряда');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Произошла ошибка при удалении услуги из заказ-наряда');
    }
  };

  const fetchServiceDetails = async (washServiceId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashService/DetailsWashService?id=${washServiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert('Ошибка', 'Услуга не найдена');
          return;
        }
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setServiceDetails(data);
      setDetailsModalVisible(true);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить подробности об услуге');
    }
  };

  const renderServiceItem = (service) => {
    const serviceAdded = assignedServices.some(s => s.id === service.id);
    return (
      <View key={service.id} style={[styles.serviceItem, { backgroundColor: activeColors.secondary }]}>
        <StyledText style={styles.assignedServiceName} numberOfLines={2}>{service.name}</StyledText>
        <StyledText style={styles.assignedServicePrice}>{service.price}</StyledText>
        <TouchableOpacity
          onPress={() => serviceAdded ? removeServiceFromOrder(service.id) : handleServicePress(service)}
          style={styles.addServiceButton}
        >
          <Ionicons name={serviceAdded ? "remove-circle-outline" : "add-circle-outline"} size={30} color={serviceAdded ? "red" : "#007bff"} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAssignedServiceItem = (service) => {
    if (!service.washServiceId) return null;
    const assignedUser = service.aspNetUser ? `${service.aspNetUser.firstName} ${service.aspNetUser.lastName} ${service.aspNetUser.surName}` : 'Неизвестно';

    return (
      <TouchableOpacity key={service.$id} style={[styles.assignedServiceItem, { backgroundColor: activeColors.secondary }]} onPress={() => fetchServiceDetails(service.washServiceId)}>
        <StyledText style={styles.assignedServiceName} numberOfLines={1}>{service.serviceName}</StyledText>
        <StyledText style={styles.assignedServicePrice}>{service.price} ₸</StyledText>
        <StyledText style={styles.assignedServiceStatus}>{service.isOvered ? 'Завершено' : 'Не завершено'}</StyledText>
        <StyledText style={styles.assignedServiceUser}>Назначено: {assignedUser}</StyledText>
        <TouchableOpacity
          onPress={() => removeServiceFromOrder(service.washServiceId)}
          style={styles.removeAssignedServiceButton}
        >
          <Ionicons name="remove-circle-outline" size={30} color="red" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderServiceDetailsModal = () => {
    if (!serviceDetails) return null;
    const { serviceName, salary, aspNetUser, price } = serviceDetails;
    const userFullName = aspNetUser ? `${aspNetUser.firstName} ${aspNetUser.lastName} ${aspNetUser.surName}` : '';

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
          <StyledText style={styles.modalTitle}>Подробности об услуге</StyledText>
          <StyledText style={styles.modalSubtitle}>Название услуги: {serviceName || 'Неизвестно'}</StyledText>
          <StyledText style={styles.modalSubtitle}>Зарплата: {salary} ₸</StyledText>
          <StyledText style={styles.modalSubtitle}>Назначено на: {userFullName}</StyledText>
          <StyledText style={styles.modalSubtitle}>Цена: {price} ₸</StyledText>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
            onPress={() => setDetailsModalVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleUserItemPress(item)}
      style={[styles.userItem, { backgroundColor: activeColors.secondary, borderColor: activeColors.accent, borderWidth: 1 }]}
    >
      <View style={styles.userAvatarContainer}>
        <Image source={{ uri: item.avatarUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbU3j5Unm1Fw0iAklJVN1MTqkAeoIZMiiijQ&s' }} style={styles.userAvatar} />
      </View>
      <View style={styles.userDetails}>
        <StyledText style={styles.userName}>{`${item.firstName} ${item.lastName} ${item.surName}`}</StyledText>
        <StyledText style={styles.userEmail}>{item.email}</StyledText>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color={activeColors.accent} />
    </TouchableOpacity>
  );

  const handleSaveSalary = async () => {
    if (selectedService) {
      await createSalarySetting(selectedService.id, selectedUser.id, salary);
      addServiceToOrder(selectedService, selectedUser, salary);
      setSalaryModalVisible(false);
    } else {
      Alert.alert('Ошибка', 'Выберите услугу перед сохранением зарплаты.');
    }
  };

  const createSalarySetting = async (serviceId, userId, salary) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Salary/createsalarysetting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: serviceId,
          aspNetUserId: userId,
          salary: parseFloat(salary)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to create salary setting');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать настройку зарплаты');
    }
  };

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Добавление услуг' },
    { key: 'second', title: 'Назначенные услуги' },
  ]);

  const renderScene = SceneMap({
    first: () => (
      <>
        <TextInput
          style={[styles.searchBox, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
          value={serviceFilter}
          onChangeText={handleServiceSearch}
          placeholder="Поиск услуг"
          placeholderTextColor={activeColors.tint}
          clearButtonMode="while-editing"
        />
        <ScrollView
          style={styles.serviceListContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onModalRefresh}
              tintColor={activeColors.tint}
            />
          }
        >
          {filteredServices.map(renderServiceItem)}
        </ScrollView>
      </>
    ),
    second: () => (
      <>
        <StyledText style={styles.assignedServicesTitle}>Назначенные услуги</StyledText>
        <ScrollView
          style={styles.assignedServiceListContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onModalRefresh}
              tintColor={activeColors.tint}
            />
          }
        >
          {assignedServices.map(renderAssignedServiceItem)}
        </ScrollView>
      </>
    ),
  });

  return (
    <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color={activeColors.tint} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Услуги для заказ-наряда</Text>
      </View>
      {renderServiceDetailsModal()}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: activeColors.tint }}
            style={{ backgroundColor: activeColors.secondary }}
            labelStyle={{ color: activeColors.tint }}
          />
        )}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={userModalVisible}
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
          <StyledText style={styles.modalTitle}>Выберите пользователя</StyledText>
          <StyledText style={styles.modalSubtitle}>Услуга: {selectedService?.name}</StyledText>
          <StyledText style={styles.modalSubtitle}>Цена: {selectedService?.price}</StyledText>
          <TextInput
            style={[styles.searchBox, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
            value={userFilter}
            onChangeText={handleUserSearch}
            placeholder="Поиск пользователей"
            placeholderTextColor={activeColors.tint}
            clearButtonMode="while-editing"
          />
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.userList}
          />
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
            onPress={() => setUserModalVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {salaryModalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={salaryModalVisible}
          onRequestClose={() => setSalaryModalVisible(false)}
        >
          <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
            <StyledText style={styles.modalTitle}>Введите зарплату</StyledText>
            <StyledText style={styles.modalSubtitle}>Услуга: {selectedService?.name}</StyledText>
            <StyledText style={styles.modalSubtitle}>Стоимость услуги: {selectedService?.price}</StyledText>
            <StyledText style={styles.modalSubtitle}>Пользователь: {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} ${selectedUser.surName}` : ''}</StyledText>
            <TextInput
              style={[styles.editPriceInput, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
              value={salary}
              onChangeText={setSalary}
              placeholder="Введите зарплату"
              keyboardType="numeric"
              placeholderTextColor={activeColors.tint}
            />
            <StyledText style={styles.modalSubtitle}>
              {salary && parseFloat(salary) < 100 && selectedService
                ? `Мастер с этой услуги будет получать ${(parseFloat(selectedService.price) * (parseFloat(salary) / 100)).toFixed(2)} ₸`
                : `Мастер с этой услуги будет получать ${salary} ₸`}
            </StyledText>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
                onPress={handleSaveSalary}
              >
                <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Сохранить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
                onPress={() => setSalaryModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {isAddingService && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={activeColors.accent} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  searchBox: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    margin: 10,
  },
  serviceListContainer: {
    flex: 1,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  assignedServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  assignedServiceName: {
    flex: 2,
    fontSize: 16,
    flexWrap: 'wrap',
  },
  assignedServicePrice: {
    flex: 1,
    fontSize: 16,
  },
  addServiceButton: {
    marginLeft: 10,
  },
  removeAssignedServiceButton: {
    marginLeft: 10,
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
  editPriceInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  assignedServiceStatus: {
    fontSize: 14,
  },
  assignedServiceUser: {
    flex: 2,
    fontSize: 14,
    color: '#555',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
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
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  assignedServicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
});

export default WashOrderServicesScreen;
