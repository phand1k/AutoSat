import React, { useContext, useState, useEffect } from "react";
import { SafeAreaView, Button, View, TextInput, FlatList, Animated, TouchableOpacity, Share, StyleSheet, Text, Image, Modal, ScrollView, Alert, RefreshControl, ActivityIndicator, Dimensions } from "react-native";
import { Ionicons, MaterialIcons  } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistanceToNow, parseISO, addHours, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import DateRangePicker from "../../components/DateRangePicker";
import { format } from 'date-fns';
import LottieView from 'lottie-react-native'; // Для анимации пустого списка


const initialLayout = { width: Dimensions.get('window').width };

const CompletedDetailingOrdersScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [originalOrders, setOriginalOrders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assignedServices, setAssignedServices] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateRange, setDateRange] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0]; // Для анимации появления
  const [lastSelectedOrderId, setLastSelectedOrderId] = useState(null);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'orderDetails', title: 'Подробности заказа' },
    { key: 'assignedServices', title: 'Назначенные услуги' },
  ]);
  const handleShareOrderDetails = async () => {
    try {
      if (!orderDetails) return;
  
      // Формируем сообщение с данными о заказе
      const message = `
        Детали заказа:
        - Марка: ${orderDetails.car.name}
        - Модель: ${orderDetails.modelCar.name}
        - Гос номер: ${orderDetails.carNumber}
        - Создано: ${formatDistanceToNow(parseISO(orderDetails.dateOfCreated), { locale: ru })} назад
        - Создал: ${orderDetails.createdByFullName}
        - Завершил: ${orderDetails.endedByFullName}
        - Способ оплаты: ${paymentInfo?.paymentMethod?.name || 'Неизвестно'}
        - Сумма оплаты: ${paymentInfo?.summ || '0'} тг
        - К оплате: ${paymentInfo?.toPay || '0'} тг
      `;
  
      // Отправляем сообщение через API Share
      await Share.share({
        message: message,
      });
    } catch (error) {
      console.error('Ошибка при отправке данных:', error);
      Alert.alert('Ошибка', 'Не удалось отправить данные');
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
    const today = new Date();
  const formattedStartDate = format(today, "yyyy-MM-dd'T'00:00:00");
  const formattedEndDate = format(today, "yyyy-MM-dd'T'23:59:59");
  setDateRange(`${format(formattedStartDate, 'dd.MM.yyyy')} - ${format(formattedEndDate, 'dd.MM.yyyy')}`);
    fetchCompletedOrders();
    fetchTransactions();
  }, [startDate, endDate]);
  
  const getInitialLetters = (brand) => {
    return brand && brand.length >= 3 ? brand.substring(0, 3).toUpperCase() : brand.toUpperCase();
  };
  
  const fetchTransactions = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
      if (!token) {
        throw new Error('Токен аутентификации недоступен.');
      }
  
      // Форматирование дат для транзакций
      const formattedStartDate = startDate ? format(parseISO(startDate), "yyyy-MM-dd'T'00:00:00") : null;
      const formattedEndDate = endDate ? format(addMinutes(addHours(parseISO(endDate), 23), 59), "yyyy-MM-dd'T'HH:mm:ss") : null;
  
      const url = new URL(`${cleanedSatApiURL}/api/Transaction/GetAllDetailingOrderTransactions`);
      if (formattedStartDate && formattedEndDate) {
        url.searchParams.append('dateOfStart', formattedStartDate);
        url.searchParams.append('dateOfEnd', formattedEndDate);
      }
  
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Отправляемый URL:', url.toString());

      if (!response.ok) {
        throw new Error(`Не удалось получить транзакции. HTTP статус ${response.status}`);
      }
  
      const responseData = await response.json();
      if (!responseData || !responseData.$values) {
        setTransactions([]);
      } else {
        const idMap = {};
  
        responseData.$values.forEach(item => {
          idMap[item.$id] = item;
          if (item.paymentMethod) idMap[item.paymentMethod.$id] = item.paymentMethod;
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
  
        const transactions = responseData.$values.map(transaction => resolveReferences(transaction));
        setTransactions(transactions);
      }
    } catch (error) {
      console.error('Ошибка при получении транзакций:', error);
      Alert.alert('Ошибка', `Не удалось получить транзакции: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };
  
  const calculateTotals = () => {
    let totalAmount = 0;
    let cashAmount = 0;
    let nonCashAmount = 0;
    let mixedPayment = 0;
    transactions.forEach(transaction => {
      totalAmount += transaction.summ;
      if (transaction.paymentMethod && transaction.paymentMethod.name === 'Наличный') {
        cashAmount += transaction.summ;
      } else if (transaction.paymentMethod && transaction.paymentMethod.name === 'Безналичный') {
        nonCashAmount += transaction.summ;
      }
      else if (transaction.paymentMethod && transaction.paymentMethod.name === 'Смешанная оплата'){
        mixedPayment += transaction.summ;
      }
    });
  
    return { totalAmount, cashAmount, nonCashAmount, mixedPayment };
  };
  
  


  const fetchCompletedOrders = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
      // Форматирование дат
      const formattedStartDate = startDate ? format(parseISO(startDate), "yyyy-MM-dd'T'00:00:00") : null;
      const formattedEndDate = endDate ? format(addMinutes(addHours(parseISO(endDate), 23), 59), "yyyy-MM-dd'T'HH:mm:ss") : null;
  
      // Формирование URL с параметрами дат
      const url = new URL(`${cleanedSatApiURL}/api/DetailingOrder/AllCompletedDetailingOrders`);
      if (formattedStartDate && formattedEndDate) {
        url.searchParams.append('dateOfStart', formattedStartDate);
        url.searchParams.append('dateOfEnd', formattedEndDate);
      }
  
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      const data = await response.json();
      
      if (response.status === 403) {
        Alert.alert('Истекла подписка', 'Истек срок действия подписки');
      }
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
  
        const sumResponse = await fetch(`${cleanedSatApiURL}/api/DetailingOrder/GetSummOfDetailingServicesOnOrder?id=${resolvedOrder.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!sumResponse.ok) {
          throw new Error(`HTTP error! status: ${sumResponse.status}`);
        }
        const sum = await sumResponse.json();
  
        // Получаем информацию о платеже
        const paymentResponse = await fetch(`${cleanedSatApiURL}/api/DetailingOrder/GetInfoPaymentForDetailingOrder?id=${resolvedOrder.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const paymentInfo = paymentResponse.ok ? await paymentResponse.json() : null;
  
        return {
          id: resolvedOrder.id,
          name: `${car.name || 'Неизвестная марка машины'} ${modelCar.name || 'Неизвестная модель'}`,
          description: `${resolvedOrder.carNumber}`,
          brand: car.name || 'Неизвестно',
          model: modelCar.name || 'Неизвестно',
          licensePlate: resolvedOrder.carNumber,
          createdAt: resolvedOrder.dateOfCreated,
          timeAgo: formatDistanceToNow(parseISO(resolvedOrder.dateOfCreated), { locale: ru }),
          imageUrl: 'https://logowik.com/content/uploads/images/order5492.jpg',
          totalServices: `${sum} тенге`,
          paymentMethod: paymentInfo ? paymentInfo.paymentMethod.name : 'Неизвестно'
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



  const fetchOrderDetails = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      const response = await fetch(`${cleanedSatApiURL}/api/DetailingOrder/DetailsDetailingOrder?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Ошибка', 'Не удалось получить подробности заказа');
    }
  };
  const handleShareReport = async () => {
    try {
      const message = `Отчет:\nОбщая сумма: ${totalAmount} тг\nНаличными: ${cashAmount} тг\nБезналичными: ${nonCashAmount} тг\nВыбранный период: ${dateRange}`;
      await Share.share({
        message: message,
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отправить отчет');
      console.error(error);
    }
  };
  const fetchPaymentInfo = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      const response = await fetch(`${cleanedSatApiURL}/api/DetailingOrder/GetInfoPaymentForDetailingOrder?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const responseText = await response.text();

      if (responseText) {
        const data = JSON.parse(responseText);
        setPaymentInfo(data);
      } else {
        throw new Error('Response is empty');
      }
    } catch (error) {
      console.error('Error fetching payment info:', error);
      Alert.alert('Ошибка', 'Не удалось получить информацию о платеже');
    }
  };

  const fetchAssignedServices = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      const response = await fetch(`${cleanedSatApiURL}/api/DetailingService/AllDetailingServicesOnOrderAsync?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      const validServices = data.$values.filter(service => service.washServiceId !== null);
      setAssignedServices(validServices);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchServiceDetails = async (washServiceId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      const response = await fetch(`${cleanedSatApiURL}/api/WashService/DetailsWashService?id=${washServiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setServiceDetails(data);
      setDetailsModalVisible(true);
    } catch (error) {
      console.error('Error fetching service details:', error);
      Alert.alert('Ошибка', 'Не удалось получить подробности об услуге');
    }
  };

  const onRefresh = () => {
    fetchCompletedOrders();
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

  const openModal = async (order) => {
    setIsLoadingModal(true);
    setModalVisible(true);
    setSelectedOrder(order);
    setLastSelectedOrderId(order.id);
    await fetchOrderDetails(order.id);
    await fetchPaymentInfo(order.id);
    await fetchAssignedServices(order.id);
    setIsLoadingModal(false);
    setIndex(0);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
    setOrderDetails(null);
    setPaymentInfo(null);
    setAssignedServices([]);
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => openModal(item)}
      style={[
        styles.itemContainer,
        { backgroundColor: activeColors.secondary },
        item.id === lastSelectedOrderId && styles.selectedItemContainer
      ]}
    >
      <View style={styles.brandContainer}>
        <Text style={styles.brandText}>{getInitialLetters(item.brand)}</Text>
      </View>
      <View style={styles.orderDetails}>
        <StyledText style={styles.itemName}>{item.name}</StyledText>
        <StyledText style={styles.itemDescription}>{item.description}</StyledText>
        <StyledText style={styles.itemTotalServices}>{item.totalServices}</StyledText>
        <StyledText style={styles.itemTimeAgo}>Создано: {item.timeAgo} назад</StyledText>
        <View style={styles.paymentMethodContainer}>
          {item.paymentMethod === 'Наличный' ? (
            <MaterialIcons name="attach-money" size={20} color={activeColors.tint} />
          ) : item.paymentMethod === 'Безналичный' ? (
            <MaterialIcons name="credit-card" size={20} color={activeColors.tint} />
          ) : (
            <MaterialIcons name="payment" size={20} color={activeColors.tint} />
          )}
          <StyledText style={[styles.paymentMethodText, { color: activeColors.tint }]}>
            {item.paymentMethod}
          </StyledText>
        </View>
      </View>
    </TouchableOpacity>
  );
  

  const renderAssignedServiceItem = (service) => (
    <TouchableOpacity key={service.$id} style={[styles.assignedServiceItem, { backgroundColor: activeColors.secondary }]} onPress={() => fetchServiceDetails(service.washServiceId)}>
      <View style={styles.serviceDetailsContainer}>
        <StyledText style={[styles.assignedServiceName, { color: activeColors.tint }]} numberOfLines={1}>{service.serviceName}</StyledText>
        <StyledText style={[styles.assignedServicePrice, { color: activeColors.tint }]}>Цена: {service.price} тг</StyledText>
        <StyledText style={[styles.assignedServiceUser, { color: activeColors.tint }]}>Назначено на: {service.whomAspNetUserId}</StyledText>
        <StyledText style={[styles.assignedServiceSalary, { color: activeColors.tint }]}>Зарплата: {service.salary} тг</StyledText>
      </View>
    </TouchableOpacity>
  );

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
          <StyledText style={styles.modalSubtitle}>Зарплата: {salary} тг</StyledText>
          <StyledText style={styles.modalSubtitle}>Мастер: {userFullName}</StyledText>
          <StyledText style={styles.modalSubtitle}>Цена: {price} тг</StyledText>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setDetailsModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  
  const renderOrderDetails = () => (
    <View style={{ flex: 1, padding: 10 }}>
      {/* Кнопка "Поделиться" в правом верхнем углу */}
      <TouchableOpacity
        style={styles.shareButtonModal}
        onPress={handleShareOrderDetails}
      >
        <Ionicons name="share-outline" size={24} color={activeColors.tint} />
      </TouchableOpacity>
  
      {orderDetails ? (
        <ScrollView>
          {/* Основная информация */}
          <View style={[styles.detailsCard, { backgroundColor: activeColors.secondary }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car" size={24} color={activeColors.tint} />
              <StyledText style={[styles.sectionTitle, { color: activeColors.tint }]}>Основная информация</StyledText>
            </View>
            <View style={styles.detailsRow}>
              <StyledText style={[styles.detailsLabel, { color: activeColors.tint }]}>Марка:</StyledText>
              <StyledText style={[styles.detailsText, { color: activeColors.tint }]}>{orderDetails.car.name}</StyledText>
            </View>
            <View style={styles.detailsRow}>
              <StyledText style={[styles.detailsLabel, { color: activeColors.tint }]}>Модель:</StyledText>
              <StyledText style={[styles.detailsText, { color: activeColors.tint }]}>{orderDetails.modelCar.name}</StyledText>
            </View>
            <View style={styles.detailsRow}>
              <StyledText style={[styles.detailsLabel, { color: activeColors.tint }]}>Гос номер:</StyledText>
              <StyledText style={[styles.detailsText, { color: activeColors.tint }]}>{orderDetails.carNumber}</StyledText>
            </View>
            <View style={styles.detailsRow}>
              <StyledText style={[styles.detailsLabel, { color: activeColors.tint }]}>Создано:</StyledText>
              <StyledText style={[styles.detailsText, { color: activeColors.tint }]}>
                {formatDistanceToNow(parseISO(orderDetails.dateOfCreated), { locale: ru })} назад
              </StyledText>
            </View>
            <View style={styles.detailsRow}>
              <StyledText style={[styles.detailsLabel, { color: activeColors.tint }]}>Создал:</StyledText>
              <StyledText style={[styles.detailsText, { color: activeColors.tint }]}>{orderDetails.createdByFullName}</StyledText>
            </View>
            <View style={styles.detailsRow}>
              <StyledText style={[styles.detailsLabel, { color: activeColors.tint }]}>Завершил:</StyledText>
              <StyledText style={[styles.detailsText, { color: activeColors.tint }]}>{orderDetails.endedByFullName}</StyledText>
            </View>
          </View>
  
          {/* Информация о платеже */}
          {paymentInfo && (
            <View style={[styles.detailsCard, { backgroundColor: activeColors.secondary }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cash" size={24} color={activeColors.tint} />
                <StyledText style={[styles.sectionTitle, { color: activeColors.tint }]}>Информация о платеже</StyledText>
              </View>
              <View style={styles.detailsRow}>
                <StyledText style={[styles.detailsLabel, { color: activeColors.tint }]}>Способ оплаты:</StyledText>
                <StyledText style={[styles.detailsText, { color: activeColors.tint }]}>
                  {paymentInfo.paymentMethod ? paymentInfo.paymentMethod.name : 'Неизвестно'}
                </StyledText>
              </View>
              <View style={styles.detailsRow}>
                <StyledText style={[styles.detailsLabel, { color: activeColors.tint }]}>Сумма оплаты:</StyledText>
                <StyledText style={[styles.detailsText, { color: activeColors.tint }]}>{paymentInfo.summ} тг</StyledText>
              </View>
              <View style={styles.detailsRow}>
                <StyledText style={[styles.detailsLabel, { color: activeColors.tint }]}>К оплате:</StyledText>
                <StyledText style={[styles.detailsText, { color: activeColors.tint }]}>{paymentInfo.toPay} тг</StyledText>
              </View>
            </View>
          )}
  
          {/* Информация о клиенте */}
          <View style={[styles.detailsCard, { backgroundColor: activeColors.secondary }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={24} color={activeColors.tint} />
              <StyledText style={[styles.sectionTitle, { color: activeColors.tint }]}>Информация о клиенте</StyledText>
            </View>
            <View style={styles.detailsRow}>
              <StyledText style={[styles.detailsLabel, { color: activeColors.tint }]}>Клиент:</StyledText>
              <StyledText style={[styles.detailsText, { color: activeColors.tint }]}>{orderDetails.phoneNumber}</StyledText>
            </View>
          </View>
        </ScrollView>
      ) : (
        <StyledText style={styles.noSelectionText}>Выберите заказ-наряд для просмотра подробностей</StyledText>
      )}
    </View>
  );

  const handlePeriodSelect = (period) => {
    const today = new Date();
    let startDate, endDate;
  
    switch (period) {
      case 'today':
        startDate = format(today, "yyyy-MM-dd'T'00:00:00");
        endDate = format(today, "yyyy-MM-dd'T'23:59:59");
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = format(yesterday, "yyyy-MM-dd'T'00:00:00");
        endDate = format(yesterday, "yyyy-MM-dd'T'23:59:59");
        break;
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startDate = format(startOfWeek, "yyyy-MM-dd'T'00:00:00");
        endDate = format(today, "yyyy-MM-dd'T'23:59:59");
        break;
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = format(startOfMonth, "yyyy-MM-dd'T'00:00:00");
        endDate = format(today, "yyyy-MM-dd'T'23:59:59");
        break;
      default:
        startDate = null;
        endDate = null;
    }
  
    setStartDate(startDate);
    setEndDate(endDate);
    setDateRange(`${format(parseISO(startDate), 'dd.MM.yyyy')} - ${format(parseISO(endDate), 'dd.MM.yyyy')}`);
  };
  const renderAssignedServices = () => (
    <View style={styles.assignedServiceListContainer}>
      <ScrollView style={styles.assignedServiceList}>
        {assignedServices.map(renderAssignedServiceItem)}
      </ScrollView>
    </View>
  );

  const renderScene = SceneMap({
    orderDetails: renderOrderDetails,
    assignedServices: renderAssignedServices,
  });
  const { totalAmount, cashAmount, nonCashAmount, mixedPayment } = calculateTotals();
  return (
    <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      {renderServiceDetailsModal()}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color={activeColors.tint} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Завершенные машины</Text>
        <Ionicons
          name="share-outline"
          size={24}
          color={activeColors.tint}
          onPress={handleShareReport}
          style={styles.shareButton}
        />
      </View>
      <View style={[styles.summaryContainer, { backgroundColor: activeColors.secondary }]}>
        
    <Text style={[styles.summaryText, { color: activeColors.text }]}>Общая сумма: {totalAmount} ₸</Text>
    <Text style={[styles.summaryText, { color: activeColors.text }]}>Наличными: {cashAmount} ₸</Text>
    <Text style={[styles.summaryText, { color: activeColors.text }]}>Безналичный: {nonCashAmount} ₸</Text>
    <Text style={[styles.summaryText, { color: activeColors.text }]}>Смешанная оплата: {mixedPayment} ₸</Text>
    {dateRange && <Text style={[styles.summaryText, { color: activeColors.text }]}>Выбранный период: {dateRange}</Text>}
    <TouchableOpacity
    style={styles.filterButton}
    onPress={() => setPickerVisible(true)}
>
    <Ionicons name="calendar-outline" size={24} color={activeColors.primary} />
    <Text style={styles.filterButtonText}>Фильтр</Text>
</TouchableOpacity>
</View>
<View style={styles.periodButtonsContainer}>
  <TouchableOpacity
    style={[styles.periodButton, { backgroundColor: activeColors.secondary }]}
    onPress={() => handlePeriodSelect('today')}
  >
    <Text style={[styles.periodButtonText, { color: activeColors.tint }]}>Сегодня</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.periodButton, { backgroundColor: activeColors.secondary }]}
    onPress={() => handlePeriodSelect('yesterday')}
  >
    <Text style={[styles.periodButtonText, { color: activeColors.tint }]}>Вчера</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.periodButton, { backgroundColor: activeColors.secondary }]}
    onPress={() => handlePeriodSelect('week')}
  >
    <Text style={[styles.periodButtonText, { color: activeColors.tint }]}>Неделя</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.periodButton, { backgroundColor: activeColors.secondary }]}
    onPress={() => handlePeriodSelect('month')}
  >
    <Text style={[styles.periodButtonText, { color: activeColors.tint }]}>Месяц</Text>
  </TouchableOpacity>
</View>

<Modal visible={isPickerVisible} animationType="slide">
    <DateRangePicker
        onSave={({ startDate, endDate }) => {
            setStartDate(startDate);
            setEndDate(endDate);
            setDateRange(`${format(parseISO(startDate), 'dd.MM.yyyy')} - ${format(parseISO(endDate), 'dd.MM.yyyy')}`);
            setPickerVisible(false);
        }}
        onCancel={() => setPickerVisible(false)}
    />
</Modal>
      <TextInput
        style={[styles.searchBox, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
        value={filter}
        onChangeText={handleSearch}
        placeholder="Поиск"
        placeholderTextColor={activeColors.tint}
        clearButtonMode="while-editing"
      />
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
                                <LottieView
                                    source={require('../../assets/service-not-found.json')}
                                    autoPlay
                                    loop
                                    style={{ width: 300, height: 300 }}
                                />
                                <Text style={styles.emptyText}>Данные не найдены</Text>
                            </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </Animated.View>
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
                <TabView
                  navigationState={{ index, routes }}
                  renderScene={renderScene}
                  onIndexChange={setIndex}
                  initialLayout={initialLayout}
                  renderTabBar={props => (
                    <TabBar
                      {...props}
                      indicatorStyle={{ backgroundColor: activeColors.accent }}
                      style={{ backgroundColor: activeColors.primary }}
                      labelStyle={{ color: activeColors.tint }}
                    />
                  )}
                />
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: activeColors.tint }]}
                  onPress={closeModal}
                >
                  <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>
        
      )}
    </SafeAreaView>
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
    elevation: 2,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
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
  itemTotalServices: {
    fontSize: 22,
    color: '#007bff',
  },
  modalView: {
    flex: 1,
    marginTop: 50,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  shareButtonModal: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  periodButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  periodButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  serviceDetailsContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  assignedServiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  assignedServicePrice: {
    fontSize: 14,
    marginBottom: 5,
  },
  assignedServiceUser: {
    fontSize: 14,
    marginBottom: 5,
  },
  assignedServiceSalary: {
    fontSize: 14,
  },
  assignedServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
  },
  removeAssignedServiceButton: {
    marginLeft: 10,
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
  assignedServicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  assignedServiceListContainer: {
    flex: 1,
  },
  assignedServiceList: {
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
  detailsCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
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
  detailsContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 10,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 16,
    marginBottom: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  
summaryText: {
    fontSize: 16,
    marginBottom: 10,
},

  noSelectionText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },
  selectedItemContainer: {
    borderWidth: 0.5,
    borderColor: 'blue',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsText: {
    fontSize: 14,
  },
  noSelectionText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#007bff',
    marginVertical: 10,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5, // Для Android
},
filterButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
},
  shareButton: {
    position: 'absolute',
    right: 10,
  },
  brandContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
},
emptyText: {
    marginTop: 20,
    fontSize: 18,
    color: '#888',
    textAlign: 'center'
},
  brandText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CompletedDetailingOrdersScreen;
