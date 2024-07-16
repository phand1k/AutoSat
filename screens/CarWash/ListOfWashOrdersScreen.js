import React, { useContext, useState, useEffect, useRef } from "react";
import { View, TextInput, RefreshControl, FlatList, TouchableOpacity, StyleSheet, Text, Image, Modal, ScrollView, Alert, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Dimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentSlider from "../PaymentSlider";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import moment from 'moment';
import * as Linking from 'expo-linking';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const initialLayout = { width: Dimensions.get('window').width };

const ListOfWashOrdersScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [originalOrders, setOriginalOrders] = useState([]);
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
  const [dashboardModalVisible, setDashboardModalVisible] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [modalRefreshing, setModalRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchServices();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser && selectedService && !isFetchingSalary && !fetchedSalaryRef.current) {
      setIsFetchingSalary(true);
      fetchedSalaryRef.current = true;
      fetchSalary(selectedService, selectedUser);
    }
  }, [selectedUser, selectedService]);

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Director/GetInfoForWashorderList', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrderTotal = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/GetSummOfWashServicesOnOrder?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const sum = await response.json();
      return sum;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const fetchServiceDetails = async (washServiceId) => {
    try {
      if (!washServiceId) {
        console.warn('Invalid washServiceId:', washServiceId);
        Alert.alert('Ошибка', 'Недействительный идентификатор услуги');
        return;
      }

      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Токен не найден');
      }
      console.log(`Fetching service details for washServiceId: ${washServiceId} with token: ${token}`);

      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/GetDetailsWashService?id=${washServiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          console.error('Error data:', errorData);
          Alert.alert('Ошибка', 'Услуга не найдена');
          return;
        }
        const errorData = await response.text();
        console.error('Error data:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched service details:', data);

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data structure');
      }

      setServiceDetails(data);
      setDetailsModalVisible(true);
      console.log('Details modal set to visible');
    } catch (error) {
      console.error('Error fetching service details:', error);
      Alert.alert('Ошибка', 'Не удалось получить подробности об услуге');
    }
  };

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

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/director/GetAllNotCompletedWashOrdersAsync', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 403) {
          Alert.alert('Истекла подписка', 'Истек срок действия подписки');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || !data.$values) {
        throw new Error('Invalid data structure');
      }

      const idMap = {};

      data.$values.forEach(item => {
        idMap[item.$id] = item;
        if (item.car) idMap[item.car.$id] = item.car;
        if (item.modelCar) idMap[item.modelCar.$id] = item.modelCar;
      });

      const resolveReferences = (obj) => {
        if (obj && obj.$ref) {
          return resolveReferences(idMap[obj.$ref]);
        }
        if (typeof obj === 'object') {
          for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
              obj[key] = resolveReferences(obj[key]);
            }
          }
        }
        return obj;
      };

      const orders = await Promise.all(data.$values.map(async (order) => {
        const resolvedOrder = resolveReferences(order);
        const car = resolvedOrder.car || {};
        const modelCar = resolvedOrder.modelCar || {};

        const sumResponse = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/GetSummOfWashServicesOnOrder?id=${resolvedOrder.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!sumResponse.ok) {
          throw new Error(`HTTP error! status: ${sumResponse.status}`);
        }
        const sum = await sumResponse.json();

        return {
          id: resolvedOrder.id,
          name: `${car.name || 'Неизвестная марка машины'} ${modelCar.name || 'Неизвестная модель'}`,
          description: `${resolvedOrder.carNumber}`,
          brand: car.name || 'Неизвестно',
          model: modelCar.name || 'Неизвестно',
          licensePlate: resolvedOrder.carNumber,
          timeAgo: formatDistanceToNow(parseISO(resolvedOrder.dateOfCreated), { locale: ru }),
          progress: Math.floor(Math.random() * 100),
          totalServices: `${sum} ₸`,
          imageUrl: 'https://logowik.com/content/uploads/images/order5492.jpg',
          services: [],
          phoneNumber: resolvedOrder.phoneNumber
        };
      }));

      setOrders(orders);
      setOriginalOrders(orders);
      setRefreshing(false);
    } catch (error) {
      console.error(error);
      setRefreshing(false);
    }
  };

  const fetchServices = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Director/GetAllServices', {
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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/GetAllWashServicesOnOrderAsync?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Fetched assigned services:', data.$values);

      const validServices = data.$values.filter(service => service.washServiceId !== null);
      setAssignedServices(validServices);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSalary = async (service, user) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      console.log(`Fetching salary for serviceId: ${service.id}, userId: ${user.id}`);

      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/GetSalaryUser?serviceId=${service.id}&aspNetUserId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (response.status === 404) {
        console.log('Salary not found, showing salary modal');
        setSalaryModalVisible(true);
      } else if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching salary:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        const data = await response.json();
        console.log('API response data:', data);

        if (typeof data === 'number') {
          console.log('Fetched salary:', data);
          addServiceToOrder(service, user, data);
        } else {
          console.error('Unexpected response format:', data);
          Alert.alert('Ошибка', 'Неверный формат ответа API');
        }
      }
    } catch (error) {
      console.error('Error fetching salary:', error);
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

  const createSalarySetting = async (serviceId, userId, salary) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/director/createsalarysetting', {
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
        console.error('Ошибка сервера:', errorData);
        throw new Error('Failed to create salary setting');
      }
    } catch (error) {
      console.error('Ошибка при создании настройки зарплаты:', error);
      Alert.alert('Ошибка', 'Не удалось создать настройку зарплаты');
    }
  };

  const completeWashOrder = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/director/CompleteWashOrder/?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: orderId })
      });

      if (response.ok) {
        Alert.alert('Успех', 'Заказ-наряд успешно завершен');
        fetchOrders(); // Обновить список заказов после завершения
      } else {
        Alert.alert('Ошибка', 'Не удалось завершить заказ-наряд');
      }
    } catch (error) {
      console.error('Error completing wash order:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при завершении заказа-наряда');
    }
  };

  const deleteWashOrder = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/director/deletewashorder/?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Alert.alert('Успех', 'Заказ-наряд успешно удален');
        fetchOrders(); // Обновить список заказов после удаления
      } else {
        Alert.alert('Ошибка', 'Не удалось удалить заказ-наряд');
      }
    } catch (error) {
      console.error('Error deleting wash order:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при удалении заказа-наряда');
    }
  };

  const deleteWashServiceFromOrder = async (washServiceId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/DeleteWashServiceFromOrder?id=${washServiceId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Alert.alert('Успех', 'Услуга успешно удалена из заказ-наряда');
        await fetchAssignedServices(selectedOrder.id); // Обновить список назначенных услуг после удаления
        const updatedSum = await fetchOrderTotal(selectedOrder.id);
        if (updatedSum !== null) {
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === selectedOrder.id
                ? { ...order, totalServices: `${updatedSum} ₸` }
                : order
            )
          );
        }
      } else {
        Alert.alert('Ошибка', 'Не удалось удалить услугу из заказ-наряда');
      }
    } catch (error) {
      console.error('Error deleting wash service from order:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при удалении услуги из заказ-наряда');
    }
  };

  const onRefresh = () => {
    fetchOrders();
  };

  const handleSearch = (text) => {
    setFilter(text);
    if (text === '') {
      setOrders(originalOrders);
    } else {
      const filteredData = originalOrders.filter(order =>
        order.name.toLowerCase().includes(text.toLowerCase())
      );
      setOrders(filteredData);
    }
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

  const openModal = async (order) => {
    setIsLoadingModal(true);
    setModalVisible(true); // Сначала показываем модальное окно
    setSelectedOrder(order);
    setFilteredServices(services.filter(service => !order.services.some(s => s.id === service.id)));
    setFilteredUsers(users);
    await fetchAssignedServices(order.id);
    setIsLoadingModal(false); // Затем скрываем индикатор загрузки
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
    setSelectedService(null);
    setSelectedUser(null);
    setRecentlyClosedOrder(selectedOrder.id);
  };

  const openConfirmationModal = () => {
    setConfirmationModalVisible(true);
  };

  const confirmOrderCompletion = () => {
    setConfirmationModalVisible(false);
    Alert.alert('Успех', 'Заказ-наряд завершен');
  };

  const handleServicePress = (service) => {
    setSelectedService(service);
    setEditedPrice(service.price.replace(' ₸', ''));
    setModalVisible(false);
    setUserModalVisible(true);
  };

  const addServiceToOrder = async (service, user, salary) => {
    if (isAddingServiceRef.current) return;
    isAddingServiceRef.current = true;
    setIsAddingService(true);

    try {
      if (!user) {
        throw new Error('Не выбран пользователь для услуги');
      }

      const token = await AsyncStorage.getItem('access_token_avtosat');
      const price = parseFloat(editedPrice);

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Director/CreateWashService', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: service.id,
          washOrderId: selectedOrder.id,
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

      const updatedOrders = orders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, services: [...order.services, serviceWithUpdatedPrice] }
          : order
      );

      setOrders(updatedOrders);
      setSelectedOrder(prevOrder => ({ ...prevOrder, services: [...prevOrder.services, serviceWithUpdatedPrice] }));

      // Обновление суммы заказа с сервера
      const updatedSum = await fetchOrderTotal(selectedOrder.id);
      if (updatedSum !== null) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === selectedOrder.id
              ? { ...order, totalServices: `${updatedSum} ₸` }
              : order
          )
        );
      }

      Alert.alert(
        'Успех',
        `Услуга успешно добавлена:\nМарка: ${selectedOrder.brand}\nМодель: ${selectedOrder.model}\nГос номер: ${selectedOrder.licensePlate}\nНазвание услуги: ${service.name}\nЦена: ${price} ₸\nЗарплата: ${salary || editedPrice} ₸`
      );

      setSelectedService(null);
      setSelectedUser(null);
      setUserModalVisible(false);
      openModal(selectedOrder);
    } catch (error) {
      console.error('Ошибка при добавлении услуги:', error);
      Alert.alert('Ошибка', 'Не удалось добавить услугу к заказу');
    } finally {
      isAddingServiceRef.current = false;
      setIsAddingService(false);
    }
  };

  const handleSaveSalary = async () => {
    if (selectedService) {
      await createSalarySetting(selectedService.id, selectedUser.id, salary);
      addServiceToOrder(selectedService, selectedUser, salary);
      setSalaryModalVisible(false);
    } else {
      Alert.alert('Ошибка', 'Выберите услугу перед сохранением зарплаты.');
    }
  };

  const removeServiceFromOrder = (service) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, services: order.services.filter(s => s.id !== service.id) }
          : order
      )
    );
    setSelectedOrder(prevOrder => ({ ...prevOrder, services: prevOrder.services.filter(s => s.id !== service.id) }));
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)} style={[styles.itemContainer, { backgroundColor: activeColors.secondary, borderColor: item.id === recentlyClosedOrder ? activeColors.accent : activeColors.secondary, borderWidth: item.id === recentlyClosedOrder ? 0.8 : 0 }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.orderDetails}>
        <StyledText style={styles.itemName}>{item.name}</StyledText>
        <StyledText style={styles.itemDescription}>{item.description}</StyledText>
        <StyledText style={styles.totalTime}>{item.totalServices}</StyledText>
        <View style={styles.createdInfo}>
          <StyledText style={styles.itemTimeAgo}>Создано: {item.timeAgo} назад</StyledText>
        </View>
      </View>
      <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${item.phoneNumber}`)}>
        <Ionicons name="chatbubbles-outline" size={26} color={"#1DA1F2"} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderServiceItem = (service) => {
    const serviceAdded = selectedOrder?.services.some(s => s.id === service.id);
    return (
      <View key={service.id} style={[styles.serviceItem, { backgroundColor: activeColors.secondary }]}>
        <StyledText style={styles.assignedServiceName} numberOfLines={2}>{service.name}</StyledText>
        <StyledText style={styles.assignedServicePrice}>{service.price}</StyledText>
        <TouchableOpacity
          onPress={() => serviceAdded ? removeServiceFromOrder(service) : handleServicePress(service)}
          style={styles.addServiceButton}
        >
          <Ionicons name={serviceAdded ? "remove-circle-outline" : "add-circle-outline"} size={30} color={serviceAdded ? "red" : "#007bff"} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderServiceDetailsModal = () => {
    if (!serviceDetails) return null;
    const { serviceName, salary, aspNetUser, price } = serviceDetails;
    const userFullName = aspNetUser ? `${aspNetUser.firstName} ${aspNetUser.lastName} ${aspNetUser.surName}` : '';

    console.log('Rendering service details modal with data:', serviceDetails);

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

  const renderAssignedServiceItem = (service) => {
    if (!service.washServiceId) {
      console.warn('Invalid washServiceId:', service);
      return null;
    }
    console.log('Assigned service:', service);
    const assignedUser = service.aspNetUser ? `${service.aspNetUser.firstName} ${service.aspNetUser.lastName} ${service.aspNetUser.surName}` : 'Неизвестно';

    return (
      <TouchableOpacity key={service.$id} style={[styles.assignedServiceItem, { backgroundColor: activeColors.secondary }]} onPress={() => fetchServiceDetails(service.washServiceId)}>
        <StyledText style={styles.assignedServiceName} numberOfLines={1}>{service.serviceName}</StyledText>
        <StyledText style={styles.assignedServicePrice}>{service.price} ₸</StyledText>
        <StyledText style={styles.assignedServiceStatus}>{service.isOvered ? 'Завершено' : 'Не завершено'}</StyledText>
        <StyledText style={styles.assignedServiceUser}>Назначено: {assignedUser}</StyledText>
        <TouchableOpacity
          onPress={() => deleteWashServiceFromOrder(service.washServiceId)}
          style={styles.removeAssignedServiceButton}
        >
          <Ionicons name="remove-circle-outline" size={30} color="red" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
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

  const onModalRefresh = async () => {
    if (selectedOrder) {
      setModalRefreshing(true);
      await fetchAssignedServices(selectedOrder.id);
      await fetchServices();
      await fetchUsers();
      setModalRefreshing(false);
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
    - Общая сумма услуг: ${dashboardData.summOfAllServices} ₸;`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
  };

  const renderDashboardModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={dashboardModalVisible}
      onRequestClose={() => setDashboardModalVisible(false)}
      onShow={fetchDashboardData}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={[styles.dashboardModalView, { backgroundColor: activeColors.primary }]}>
            <View style={styles.dashboardContainer}>
              <View style={styles.dashboardHeader}>
                <StyledText style={styles.dashboardTitle}>Статистика машин на мойке</StyledText>
              </View>
              <StyledText style={styles.dashboardSubtitle}>Текущее время: {moment().format('HH:mm:ss')}</StyledText>
              {dashboardData ? (
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
                      <StyledText style={styles.dashboardItemValue}>{dashboardData.summOfAllServices} ₸</StyledText>
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
                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
                    onPress={() => setDashboardModalVisible(false)}
                  >
                    <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <ActivityIndicator size="large" color={activeColors.tint} />
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderOrderDetailsTab = () => {
    if (!selectedOrder) return null;
    const { brand, model, licensePlate, timeAgo, totalServices } = selectedOrder;

    return (
      <ScrollView
        style={styles.orderDetailsContainer}
        refreshControl={
          <RefreshControl
            refreshing={modalRefreshing}
            onRefresh={onModalRefresh}
            tintColor={activeColors.tint}
          />
        }
      >
        <StyledText style={styles.orderDetailItem}>Марка: {brand}</StyledText>
        <StyledText style={styles.orderDetailItem}>Модель: {model}</StyledText>
        <StyledText style={styles.orderDetailItem}>Гос номер: {licensePlate}</StyledText>
        <StyledText style={styles.orderDetailItem}>Создано: {timeAgo} назад</StyledText>
        <StyledText style={styles.orderDetailItem}>Общая сумма услуг: {totalServices}</StyledText>
      </ScrollView>
    );
  };

  const renderServiceTab = () => (
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
            refreshing={modalRefreshing}
            onRefresh={onModalRefresh}
            tintColor={activeColors.tint}
          />
        }
      >
        {filteredServices.map(renderServiceItem)}
      </ScrollView>
    </>
  );

  const renderAssignedServicesTab = () => (
    <>
      <StyledText style={styles.assignedServicesTitle}>Назначенные услуги</StyledText>
      <ScrollView
        style={styles.assignedServiceListContainer}
        refreshControl={
          <RefreshControl
            refreshing={modalRefreshing}
            onRefresh={onModalRefresh}
            tintColor={activeColors.tint}
          />
        }
      >
        {assignedServices.map(renderAssignedServiceItem)}
      </ScrollView>
    </>
  );

  const renderScene = SceneMap({
    first: renderServiceTab,
    second: renderAssignedServicesTab,
    third: renderOrderDetailsTab,
  });

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Добавление услуг' },
    { key: 'second', title: 'Назначенные услуги' },
    { key: 'third', title: 'Подробные данные' },
  ]);

  return (
    <View style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      {renderServiceDetailsModal()}
      {renderDashboardModal()}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={activeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Машины на мойке</Text>
        <TouchableOpacity onPress={() => setDashboardModalVisible(true)} style={styles.infoButton}>
          <Ionicons name="download-outline" size={26} color='#1DA1F2' />
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.searchBox, { backgroundColor: activeColors.secondary, borderColor: activeColors.secondary, color: activeColors.tint }]}
        value={filter}
        onChangeText={handleSearch}
        placeholder="Поиск"
        placeholderTextColor={activeColors.tint}
        clearButtonMode="while-editing"
      />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeColors.tint} />
        }
      />
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: activeColors.accent }]}
          onPress={() => navigation.navigate('CompletedWashOrders')}
        >
          <Text style={[styles.filterButtonText, { color: activeColors.primary }]}>Завершенные заказ-наряды</Text>
        </TouchableOpacity>
      </View>
      {selectedOrder && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
            {isLoadingModal ? (
              <ActivityIndicator size="large" color={activeColors.tint} />
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <StyledText style={styles.modalTitle}>{selectedOrder.licensePlate}</StyledText>
                  <StyledText style={styles.modalSubtitle}>{selectedOrder.brand} {selectedOrder.model}</StyledText>
                </View>
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
                <PaymentSlider
                  onComplete={() => completeWashOrder(selectedOrder.id)}
                  onSwipeLeft={() => deleteWashOrder(selectedOrder.id)}
                  selectedOrder={selectedOrder}
                />
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
                  onPress={closeModal}
                >
                  <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>
      )}
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
            <PaymentSlider onComplete={confirmOrderCompletion} onSwipeLeft={() => setConfirmationModalVisible(false)} />
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
              onPress={() => setConfirmationModalVisible(false)}
            >
              <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
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
      {isAddingService && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={activeColors.accent} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemTimeAgo: {
    fontSize: 12,
    color: '#888',
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
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemImage: {
    width: 70,
    height: 60,
    borderRadius: 20,
    marginRight: 20,
  },
  orderDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
  },
  itemInfo: {
    fontSize: 12,
  },
  totalTime: {
    fontSize: 20,
    color: '#007bff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  filterButton: {
    padding: 10,
    borderRadius: 5,
  },
  filterButtonText: {
    fontSize: 12,
  },
  modalView: {
    flex: 1,
    marginTop: 50,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: 'center',
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
  serviceListContainer: {
    flex: 1,
  },
  assignedServicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  assignedServiceListContainer: {
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
  userList: {
    flex: 1,
  },
  userItem: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  userAvatarContainer: {
    marginRight: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
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
  swipeButtonContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  segmentedControl: {
    marginVertical: 20,
  },
  tabStyle: {
    borderColor: '#007bff',
  },
  activeTabStyle: {
    backgroundColor: '#007bff',
  },
  infoButton: {
    position: 'absolute',
    right: 10,
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
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDetailsContainer: {
    padding: 10,
  },
  orderDetailItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  serviceDetailContainer: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  serviceDetailItem: {
    fontSize: 14,
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
});

export default ListOfWashOrdersScreen;
