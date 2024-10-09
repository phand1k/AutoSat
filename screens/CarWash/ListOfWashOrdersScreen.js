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
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Switch } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

const initialLayout = { width: Dimensions.get('window').width };

const ListOfWashOrdersScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const route = useRoute();

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [modalRefreshing, setModalRefreshing] = useState(false);
  const [switchValues, setSwitchValues] = useState({});
  const [loadingOrders, setLoadingOrders] = useState({});
  const [visibleOrders, setVisibleOrders] = useState({});
  const [confirmActionVisible, setConfirmActionVisible] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState(null); // 'complete' или 'delete'
  const [confirmOrderId, setConfirmOrderId] = useState(null);
  const [openSwipeableRef, setOpenSwipeableRef] = useState(null);
  const [reportData, setReportData] = useState({
    notCompletedOrders: 0,
    completedServices: 0,
    totalServiceSum: 0,
  });

  const [reportModalVisible, setReportModalVisible] = useState(false); // Состояние для видимости модального окна
  const swipeableRefs = useRef({});

  const fetchReportData = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/WashOrder/GetInfoForWashorderList', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setReportData({
        notCompletedOrders: data.countOfNotCompletedOrders,
        completedServices: data.countOfCompeltedServices,
        totalServiceSum: data.summOfAllServices,
        notCompletedServices: data.countOfNotCompletedServices
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchReportData();
    fetchServices();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchOrders(); // Обновление списка, если параметр refresh установлен
    }
  }, [route.params?.refresh]);

  const handleToggleSwitch = async (orderId, value) => {
    setLoadingOrders(prevState => ({
      ...prevState,
      [orderId]: true, // Устанавливаем состояние загрузки для данного заказа
    }));

    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashOrder/ReadyWashOrder/?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');

      }
      setRefreshing(true);
      Alert.alert('Отправлено💬', 'Клиенту, если он зарегистрирован отправлено уведомление на телефон');
      setRefreshing(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update order status');
      setRefreshing(true);
    } finally {
      setLoadingOrders(prevState => ({
        ...prevState,
        [orderId]: false, // Сбрасываем состояние загрузки для данного заказа
      }));

      if (swipeableRefs.current[orderId]) {
        swipeableRefs.current[orderId].close(); // Закрываем свайп в любом случае
      }
    }
  };

  const renderReportSummary = () => {
    return (
      <View style={[styles.reportSummaryContainer, { backgroundColor: activeColors.secondary }]}>
        <Text style={[styles.summaryText, { color: activeColors.text }]}>
          Незавершенные заказы: {reportData.notCompletedOrders}
        </Text>
        <Text style={[styles.summaryText, { color: activeColors.text }]}>
          Завершенные услуги: {reportData.completedServices}
        </Text>
        <Text style={[styles.summaryText, { color: activeColors.text }]}>
          Сумма всех услуг: {reportData.totalServiceSum} тенге
        </Text>
        <Text style={[styles.summaryText, { color: activeColors.text }]}>
          Незавершенные услуги: {reportData.notCompletedServices} тенге
        </Text>
      </View>
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders(); // Вызов функции для обновления списка заказов
    }, [])
  );

  const ws = useRef(null);

  useEffect(() => {
    setupWebSocket();
    fetchOrders();
    fetchServices();
    fetchUsers();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const setupWebSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      ws.current = new WebSocket(`wss://avtosat-001-site1.ftempurl.com/ws?token=${token}`);

      ws.current.onopen = () => {
        console.log('WebSocket connection opened');
      };

      ws.current.onmessage = (e) => {
        console.log('WebSocket message received:', e.data);
        const message = JSON.parse(e.data);
        handleWebSocketMessage(message);
      };

      ws.current.onerror = (e) => {
        console.error('WebSocket error', e.message);
      };

      ws.current.onclose = (e) => {
        console.log('WebSocket connection closed', e.code, e.reason);
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      Alert.alert("Error", `Failed to set up WebSocket: ${error.message}`);
    }
  };

  const handleWebSocketMessage = (message) => {
    console.log('Received WebSocket message:', message);
    switch (message.eventType) {
      case "create":
        const { id, carNumber, phoneNumber, dateOfCreated, name } = message.order;
        const newOrder = {
          id,
          name: 'Неизвестная марка машины Неизвестная модель',
          description: carNumber,
          brand: 'Неизвестно',
          model: 'Неизвестно',
          licensePlate: carNumber,
          timeAgo: formatDistanceToNow(parseISO(dateOfCreated), { locale: ru }),
          progress: Math.floor(Math.random() * 100),
          totalServices: `0 тенге`,
          imageUrl: 'https://logowik.com/content/uploads/images/order5492.jpg',
          services: [],
          phoneNumber,
          whomAspNetUserId: aspNetUser.fullName,
          name
        };
        setOrders(prevOrders => [newOrder, ...prevOrders]);
        setOriginalOrders(prevOrders => [newOrder, ...prevOrders]);
        break;
      case "serviceUpdated":
        const { orderId, newTotalServices } = message;
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, totalServices: `${newTotalServices} тенге` }
              : order
          )
        );
        setOriginalOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, totalServices: `${newTotalServices} тенге` }
              : order
          )
        );
        break;
      default:
        console.warn(`Unhandled event type: ${message.eventType}`);
    }
  };

  useEffect(() => {
    if (selectedUser && selectedService && !isFetchingSalary && !fetchedSalaryRef.current) {
      setIsFetchingSalary(true);
      fetchedSalaryRef.current = true;
      fetchSalary(selectedService, selectedUser);
    }
  }, [selectedUser, selectedService]);

  useEffect(() => {
    if (selectedService) {
      const salaryPercentage = 0.4; // 40%
  
      const priceWithoutCurrency = selectedService.price.replace(' тенге', '');
      console.log(priceWithoutCurrency);
      const validPrice = priceWithoutCurrency && !isNaN(priceWithoutCurrency) ? priceWithoutCurrency : 0;
  
      const calculatedSalary = (validPrice * salaryPercentage).toFixed(2);
      setSalary(calculatedSalary); // Устанавливаем рассчитанную зарплату
    }
  }, [selectedService]);
  

  const CarImageOrLetter = ({ brand }) => {
    const getInitialLetters = (brand) => {
      return brand && brand.length >= 3 ? brand.substring(0, 3).toUpperCase() : brand.toUpperCase();
    };

    const initialLetters = getInitialLetters(brand);

    return (
      <View style={styles.carImageOrLetterContainer}>
        <Text style={styles.carLetter}>{initialLetters}</Text>
      </View>
    );
  };


  const fetchOrderTotal = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashOrder/GetSummOfWashServicesOnOrder?id=${orderId}`, {
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

      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashService/DetailsWashService?id=${washServiceId}`, {
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
  const handleDeleteOrder = async (orderId) => {
    setLoadingOrders(prevState => ({
      ...prevState,
      [orderId]: true, // Устанавливаем состояние загрузки для данного заказа
    }));

    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashOrder/deletewashorder/?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      Alert.alert('Удалено🗑️', 'Заказ-наряд успешно удален');
      fetchOrders(); // Обновить список заказов после удаления
    } catch (error) {
      console.error(error);
      Alert.alert('Ошибка', 'Failed to delete order');
    } finally {
      setLoadingOrders(prevState => ({
        ...prevState,
        [orderId]: false, // Сбрасываем состояние загрузки для данного заказа
      }));

      if (swipeableRefs.current[orderId]) {
        swipeableRefs.current[orderId].close(); // Закрываем свайп в любом случае
      }
    }
  };

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/WashOrder/AllNotCompletedWashOrdersAsync', {
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

        const sumResponse = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Washorder/GetSummOfWashServicesOnOrder?id=${resolvedOrder.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!sumResponse.ok) {
          throw new Error(`HTTP error! status: ${sumResponse.status}`);
        }
        const sum = await sumResponse.json();

        // Определение статуса заказа на основе значений isReady и isOvered
        let status = '';
        if (resolvedOrder.isReady) {
          status = 'Готов к сдаче клиенту';
        } else {
          status = 'В работе';
        }

        return {
          id: resolvedOrder.id,
          name: `${car.name || 'Неизвестная марка машины'} ${modelCar.name || 'Неизвестная модель'}`,
          description: `${resolvedOrder.carNumber}`,
          brand: car.name || 'Неизвестно',
          model: modelCar.name || 'Неизвестно',
          licensePlate: resolvedOrder.carNumber,
          timeAgo: formatDistanceToNow(parseISO(resolvedOrder.dateOfCreated), { locale: ru }),
          progress: Math.floor(Math.random() * 100),
          totalServices: `${sum} тенге`,
          imageUrl: 'https://logowik.com/content/uploads/images/order5492.jpg',
          services: [],
          phoneNumber: resolvedOrder.phoneNumber,
          status: status, // Добавлено новое поле для статуса
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
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Service/GetAllServices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      const services = data.$values.map(service => ({
        id: service.id,
        name: service.name,
        price: `${service.price} тенге`
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
      console.log('Fetched assigned services:', data.$values);

      const validServices = data.$values.filter(service => service.washServiceId !== null);
      setAssignedServices(validServices);
    } catch (error) {
      console.error(error);
    }
  };

  const renderConfirmActionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={confirmActionVisible}
      onRequestClose={() => {
        setConfirmActionVisible(false);
        if (openSwipeableRef) {
          openSwipeableRef.close();  // Возвращаем свайп к исходному состоянию
          setOpenSwipeableRef(null);
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmModalView, { backgroundColor: activeColors.primary }]}>
          <Ionicons
            name={confirmActionType === 'complete' ? "checkmark-circle-outline" : "trash-outline"}
            size={60}
            color={confirmActionType === 'complete' ? "#4CAF50" : "#f44336"}
            style={styles.confirmIcon}
          />
          <StyledText style={[styles.confirmModalTitle, { color: activeColors.tint }]}>
            {confirmActionType === 'complete' ? 'Завершить заказ?' : 'Удалить заказ?'}
          </StyledText>
          <StyledText style={[styles.confirmModalSubtitle, { color: activeColors.tint }]}>
            {confirmActionType === 'complete'
              ? 'Вы уверены, что хотите завершить этот заказ? Это действие нельзя отменить.'
              : 'Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.'}
          </StyledText>
          <View style={styles.confirmModalButtonContainer}>
            <TouchableOpacity
              style={[styles.confirmModalButton, { backgroundColor: '#007bff' }]} // Синий цвет для кнопки "Да"
              onPress={() => {
                if (confirmActionType === 'complete') {
                  handleToggleSwitch(confirmOrderId, true);  // Завершение заказа
                } else if (confirmActionType === 'delete') {
                  handleDeleteOrder(confirmOrderId);  // Удаление заказа
                }
                setConfirmActionVisible(false);
                setOpenSwipeableRef(null);
              }}
            >
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.confirmModalButtonText}>Да</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmModalButton, styles.confirmModalCancelButton]}
              onPress={() => {
                setConfirmActionVisible(false);
                if (openSwipeableRef) {
                  openSwipeableRef.close();  // Возвращаем свайп к исходному состоянию
                  setOpenSwipeableRef(null);
                }
              }}
            >
              <Ionicons name="close" size={24} color="#fff" />
              <Text style={styles.confirmModalButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const fetchSalary = async (service, user) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      console.log(`Fetching salary for serviceId: ${service.id}, userId: ${user.id}`);

      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Salary/GetSalaryUser?serviceId=${service.id}&aspNetUserId=${user.id}`, {
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
      
      console.log(salary);
      const validSalary = salary && !isNaN(salary) ? salary : 0;
  
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Salary/createsalarysetting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: serviceId,
          aspNetUserId: userId,
          salary: validSalary
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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashOrder/CompleteWashOrder/?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: orderId })
      });

      if (response.ok) {
        Alert.alert('Завершено🧺', 'Заказ-наряд успешно завершен');
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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashOrder/deletewashorder/?id=${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Alert.alert('Удалено🗑️', 'Заказ-наряд успешно удален');
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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashService/DeleteWashServiceFromOrder?id=${washServiceId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Alert.alert('Удалено🗑️', 'Услуга успешно удалена с заказ-наряда');
        await fetchAssignedServices(selectedOrder.id); // Обновить список назначенных услуг после удаления
        const updatedSum = await fetchOrderTotal(selectedOrder.id);
        if (updatedSum !== null) {
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === selectedOrder.id
                ? { ...order, totalServices: `${updatedSum} тенге` }
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
        order.name.toLowerCase().includes(text.toLowerCase()) ||  // Фильтрация по марке и модели авто
        order.licensePlate.toLowerCase().includes(text.toLowerCase()) // Фильтрация по гос. номеру
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
    setRecentlyClosedOrder(selectedOrder?.id || null);
  };

  const openConfirmationModal = () => {
    setConfirmationModalVisible(true);
  };

  const confirmOrderCompletion = () => {
    setConfirmationModalVisible(false);
    Alert.alert('Завершено🧺', 'Заказ-наряд завершен');
  };

  const handleServicePress = (service) => {
    setSelectedService(service);
    const priceWithoutCurrency = service.price.replace(' тенге', '');
    
    console.log(priceWithoutCurrency);
    const validPrice = priceWithoutCurrency && !isNaN(priceWithoutCurrency) ? priceWithoutCurrency : 0;
    setEditedPrice(validPrice.toString()); // Преобразование обратно в строку
    setModalVisible(false);
    setUserModalVisible(true);
  };
  

  const addServiceToOrder = async (service, user, salary) => {
    try {
      if (!user) {
        throw new Error('Не выбран пользователь для услуги');
      }
  
      const token = await AsyncStorage.getItem('access_token_avtosat');
      
      // Преобразование строки в число с проверкой
      console.log(editedPrice);
      const priceWithoutCurrency = editedPrice && !isNaN(editedPrice) ? editedPrice : 0;
      console.log(salary);
      const validSalary = salary && !isNaN(salary) ? salary : 0;
  
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/WashService/CreateWashService', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: service.id,
          washOrderId: selectedOrder.id,
          price: priceWithoutCurrency,
          serviceName: service.name,
          whomAspNetUserId: user.id,
          salary: validSalary
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка сервера:', errorData);
        throw new Error('Failed to add service to order');
      }
      
      // Логика продолжения работы после успешного добавления услуги
    } catch (error) {
      console.error('Ошибка при добавлении услуги:', error);
      Alert.alert('Ошибка', 'Не удалось добавить услугу к заказу');
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
    <Swipeable
      ref={ref => (swipeableRefs.current[item.id] = ref)}  // Привязываем реф к каждому элементу
      renderLeftActions={() => (
        <View style={styles.swipeActionComplete}>
          {loadingOrders[item.id] ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.swipeActionText}>Завершить</Text>
          )}
        </View>
      )}
      renderRightActions={() => (
        <View style={styles.swipeActionDelete}>
          {loadingOrders[item.id] ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.swipeActionText}>Удалить</Text>
          )}
        </View>
      )}
      onSwipeableWillOpen={() => {
        if (loadingOrders[item.id]) {
          // Если уже идет запрос, запрещаем открытие свайпа
          swipeableRefs.current[item.id].close();
        } else {
          // Сохраняем ссылку на открытый Swipeable элемент
          setOpenSwipeableRef(swipeableRefs.current[item.id]);
        }
      }}

      onSwipeableLeftOpen={() => {
        setConfirmActionType('complete');
        setConfirmOrderId(item.id);
        setConfirmActionVisible(true);
      }}  // Завершение заказа

      onSwipeableRightOpen={() => {
        setConfirmActionType('delete');
        setConfirmOrderId(item.id);
        setConfirmActionVisible(true);
      }}  // Удаление заказа

    >
      <TouchableOpacity onPress={() => openModal(item)} style={[styles.itemContainer, { backgroundColor: activeColors.secondary, borderColor: item.id === recentlyClosedOrder ? activeColors.accent : activeColors.secondary, borderWidth: item.id === recentlyClosedOrder ? 0.8 : 0 }]}>
        <CarImageOrLetter brand={item.brand} />
        <View style={styles.orderDetails}>
          <StyledText style={styles.itemName}>{item.name}</StyledText>
          <StyledText style={styles.itemDescription}>{item.description}</StyledText>
          <StyledText style={styles.totalTime}>{item.totalServices}</StyledText>
          <StyledText
            style={[
              styles.itemStatus,
              { color: item.status === 'В работе' ? 'orange' : item.status === 'Готов к сдаче клиенту' ? 'green' : 'defaultColor' }
            ]}
          >
            {item.status || 'Статус неизвестен'}
          </StyledText>
          <View style={styles.createdInfo}>
            <StyledText style={styles.itemTimeAgo}>Создано: {item.timeAgo} назад</StyledText>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
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
          <StyledText style={styles.modalSubtitle}>Зарплата: {salary} тенге</StyledText>
          <StyledText style={styles.modalSubtitle}>Назначено на: {userFullName}</StyledText>
          <StyledText style={styles.modalSubtitle}>Цена: {price} тенге</StyledText>
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
    const handlePress = () => {
      closeModal(); // Закрываем модальное окно
      setTimeout(() => {
        navigation.navigate('ServiceDetails', { washServiceId: service.washServiceId });
      }, 300); // Задержка, чтобы убедиться, что модальное окно закрылось
    };

    return (
      <TouchableOpacity
        key={service.$id}
        style={[styles.serviceItem, { backgroundColor: activeColors.secondary }]}
        onPress={handlePress}
      >
        <StyledText style={styles.assignedServiceName} numberOfLines={2}>
          {service.serviceName || 'Без названия'}
        </StyledText>
        <StyledText style={styles.assignedServicePrice}>
          {service.price ? `${service.price} тенге` : 'Цена не указана'}
        </StyledText>
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
    second: renderAssignedServicesTab
  });

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Добавление услуг' },
    { key: 'second', title: 'Назначенные услуги' }
  ]);

  return (
    <View style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      {renderServiceDetailsModal()}
      {renderConfirmActionModal()}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Машины на мойке</Text>
      </View>
      <View style={styles.iconWrapper}>
  <TouchableOpacity onPress={() => setReportModalVisible(true)}>
    <Ionicons name="stats-chart" size={24} color={activeColors.tint} />
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
  style={[styles.reportButton, { backgroundColor: activeColors.accent }]}
  onPress={() => navigation.navigate('CompletedWashOrders')} // Изменено на 'DashboardScreen'
>
  <Ionicons name="bar-chart-outline" size={15} color={activeColors.primary} style={styles.reportIcon} />
  <Text style={[styles.reportButtonText, { color: activeColors.primary }]}>Отчет</Text>
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
                  <View style={styles.licensePlateContainer}>
                    <StyledText style={styles.modalTitle}>{selectedOrder.licensePlate}</StyledText>
                    <TouchableOpacity
                      style={styles.iconWrapper}
                      onPress={() => {
                        const phoneNumber = selectedOrder.phoneNumber.replace(/[^0-9]/g, ''); // Убираем все нечисловые символы
                        const whatsappUrl = `https://wa.me/${phoneNumber}`;
                        Linking.openURL(whatsappUrl);
                      }}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={29} color="#007bff" />
                    </TouchableOpacity>
                  </View>
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
                  onComplete={() => {
                    completeWashOrder(selectedOrder.id);
                    closeModal(); // Закрыть модальное окно после завершения заказ-наряда
                  }}
                  onSwipeLeft={() => {
                    deleteWashOrder(selectedOrder.id);
                    closeModal(); // Закрыть модальное окно после удаления заказ-наряда
                  }}
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
            { salary && salary < 100 && selectedService
              ? `Мастер с этой услуги будет получать ${(selectedService.price * (salary / 100)).toFixed(2)} тенге`
              : `Мастер с этой услуги будет получать ${salary} тенге`}
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
      {/* Модальное окно для отчетов */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.reportModalContainer}>
          <View style={[styles.reportModalView, { backgroundColor: activeColors.primary }]}>
            <Ionicons name="bar-chart-outline" size={50} color={activeColors.accent} />
            <StyledText style={[styles.reportModalTitle, { color: activeColors.tint }]}>Отчеты</StyledText>
            <StyledText style={[styles.reportModalSubtitle, { color: activeColors.tint }]}>Незавершенные заказы: {reportData.notCompletedOrders}</StyledText>
            <StyledText style={[styles.reportModalSubtitle, { color: activeColors.tint }]}>Завершенные услуги: {reportData.completedServices}</StyledText>
            <StyledText style={[styles.reportModalSubtitle, { color: activeColors.tint }]}>Незавершенные услуги: {reportData.notCompletedServices}</StyledText>
            <StyledText style={[styles.reportModalSubtitle, { color: activeColors.tint }]}>Сумма всех услуг: {reportData.totalServiceSum} тенге</StyledText>
            <TouchableOpacity
              style={[styles.reportModalButton, { backgroundColor: activeColors.accent }]}
              onPress={() => setReportModalVisible(false)}
            >
              <Text style={[styles.reportModalButtonText, { color: activeColors.primary }]}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    height: 50, // Увеличение высоты
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15, // Увеличение padding
    marginVertical: 15, // Увеличение вертикального отступа
    fontSize: 18, // Увеличение размера шрифта
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
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    backgroundColor: 'green',
    marginVertical: 5,
    borderRadius: 10,
  },
  swipeActionComplete: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    backgroundColor: 'green',
    marginVertical: 5,
    borderRadius: 10,
  },
  swipeActionDelete: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    backgroundColor: 'red',
    marginVertical: 5,
    borderRadius: 10,
  },
  swipeActionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  assignedServiceListContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Полупрозрачный фон
  },
  confirmModalView: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmIcon: {
    marginBottom: 15,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  confirmModalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  confirmModalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50', // Зеленая кнопка
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 10,
    flex: 1,
  },
  confirmModalCancelButton: {
    backgroundColor: '#f44336', // Красная кнопка
  },
  confirmModalButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15, // Увеличение padding
    marginVertical: 10, // Увеличение отступа сверху и снизу
    borderRadius: 10, // Увеличение радиуса границы
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
    padding: 15, // Увеличение padding
    marginVertical: 10, // Увеличение отступа сверху и снизу
    borderRadius: 10, // Увеличение радиуса границы
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  assignedServiceName: {
    flex: 2,
    fontSize: 17, // Увеличение размера шрифта
    flexWrap: 'wrap',
  },
  assignedServicePrice: {
    flex: 1,
    fontSize: 17, // Увеличение размера шрифта
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
  carImageOrLetterContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  carLetter: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  licensePlateContainer: {
    width: '100%',
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    right: 0,
    top: 0,
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
  reportSummaryContainer: {
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 10,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 15,
    elevation: 3, // Добавление тени для кнопки
  },

  reportButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  reportIcon: {
    marginRight: 10,
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
  itemStatus: {
    fontSize: 14,
    color: '#007bff',
    marginTop: 5,
  },

  switchContainer: {
    marginLeft: 'auto',
    marginRight: 10,
  },
  // Стили для модального окна отчетов
  reportModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  reportModalView: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  reportModalSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  reportModalButton: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ListOfWashOrdersScreen;
