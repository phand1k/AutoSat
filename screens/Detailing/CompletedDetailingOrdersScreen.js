import React, { useContext, useState, useEffect } from "react";
import { SafeAreaView, Button, View, TextInput, FlatList, TouchableOpacity, Share, StyleSheet, Text, Image, Modal, ScrollView, Alert, RefreshControl, ActivityIndicator, Dimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistanceToNow, parseISO, addHours, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import DateRangePicker from "../../components/DateRangePicker";
import { format } from 'date-fns';

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
  
  const [lastSelectedOrderId, setLastSelectedOrderId] = useState(null);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'orderDetails', title: 'Подробности заказа' },
    { key: 'assignedServices', title: 'Назначенные услуги' },
  ]);

  useEffect(() => {
    const today = new Date();
  const formattedStartDate = format(today, "yyyy-MM-dd'T'00:00:00");
  const formattedEndDate = format(today, "yyyy-MM-dd'T'23:59:59");
  setStartDate(formattedStartDate);
  setEndDate(formattedEndDate);
  setDateRange(`${format(today, 'dd.MM.yyyy')} - ${format(today, 'dd.MM.yyyy')}`);
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
      if (!token) {
        throw new Error('Токен аутентификации недоступен.');
      }
  
      // Форматирование дат для транзакций
      const formattedStartDate = startDate ? format(parseISO(startDate), "yyyy-MM-dd'T'00:00:00") : null;
      const formattedEndDate = endDate ? format(addMinutes(addHours(parseISO(endDate), 23), 59), "yyyy-MM-dd'T'HH:mm:ss") : null;
  
      const url = new URL('https://avtosat-001-site1.ftempurl.com/api/Transaction/GetAllDetailingOrderTransactions');
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
  
    transactions.forEach(transaction => {
      totalAmount += transaction.summ;
      if (transaction.paymentMethod && transaction.paymentMethod.name === 'Наличный') {
        cashAmount += transaction.summ;
      } else if (transaction.paymentMethod && transaction.paymentMethod.name === 'Безналичный') {
        nonCashAmount += transaction.summ;
      }
    });
  
    return { totalAmount, cashAmount, nonCashAmount };
  };
  
  


const fetchCompletedOrders = async () => {
  try {
    setRefreshing(true);
    const token = await AsyncStorage.getItem('access_token_avtosat');
    
    // Форматирование дат
    const formattedStartDate = startDate ? format(parseISO(startDate), "yyyy-MM-dd'T'00:00:00") : null;
    const formattedEndDate = endDate ? format(addMinutes(addHours(parseISO(endDate), 23), 59), "yyyy-MM-dd'T'HH:mm:ss") : null;

    // Формирование URL с параметрами дат
    const url = new URL('https://avtosat-001-site1.ftempurl.com/api/DetailingOrder/AllCompletedDetailingOrders');
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

      const sumResponse = await fetch(`https://avtosat-001-site1.ftempurl.com/api/DetailingOrder/GetSummOfDetailingServicesOnOrder?id=${resolvedOrder.id}`, {
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
        createdAt: resolvedOrder.dateOfCreated,
        timeAgo: formatDistanceToNow(parseISO(resolvedOrder.dateOfCreated), { locale: ru }),
        imageUrl: 'https://logowik.com/content/uploads/images/order5492.jpg',
        totalServices: `${sum} тенге`
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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/DetailingOrder/DetailsDetailingOrder?id=${orderId}`, {
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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/DetailingOrder/GetInfoPaymentForDetailingOrder?id=${orderId}`, {
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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/DetailingService/AllDetailingServicesOnOrderAsync?id=${orderId}`, {
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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/WashService/DetailsWashService?id=${washServiceId}`, {
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
      {orderDetails ? (
        <ScrollView>
          <View style={styles.detailsContainer}>
            <StyledText style={styles.detailsText}>Марка: {orderDetails.car.name}</StyledText>
            <StyledText style={styles.detailsText}>Модель: {orderDetails.modelCar.name}</StyledText>
            <StyledText style={styles.detailsText}>Гос номер: {orderDetails.carNumber}</StyledText>
            <StyledText style={styles.detailsText}>Создано: {formatDistanceToNow(parseISO(orderDetails.dateOfCreated), { locale: ru })} назад</StyledText>
            <StyledText style={styles.detailsText}>Создал: {orderDetails.createdByFullName}</StyledText>
            <StyledText style={styles.detailsText}>Завершил: {orderDetails.endedByFullName}</StyledText>
          </View>
          <View style={styles.detailsContainer}>
            <StyledText style={styles.detailsTitle}>Информация о детейлинге</StyledText>
            <StyledText style={styles.detailsText}>
  Мастер: {orderDetails.aspNetUser ? orderDetails.aspNetUser.fullName : 'Неизвестно'}
</StyledText>
            <StyledText style={styles.detailsText}>Клиент: {orderDetails.phoneNumber}</StyledText>
          </View>
          {paymentInfo && (
            <View style={styles.detailsContainer}>
              <StyledText style={styles.detailsTitle}>Информация о платеже</StyledText>
              <StyledText style={styles.detailsText}>Способ оплаты: {paymentInfo.paymentMethod ? paymentInfo.paymentMethod.name : 'Неизвестно'}</StyledText>
              <StyledText style={styles.detailsText}>Сумма оплаты: {paymentInfo.summ} тг</StyledText>
              <StyledText style={styles.detailsText}>К оплате: {paymentInfo.toPay} тг</StyledText>
            </View>
          )}
        </ScrollView>
      ) : (
        <StyledText style={styles.noSelectionText}>Выберите заказ-наряд для просмотра подробностей</StyledText>
      )}
    </View>
  );

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
  const { totalAmount, cashAmount, nonCashAmount } = calculateTotals();
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
    <Text style={[styles.summaryText, { color: activeColors.text }]}>Общая сумма: {totalAmount} тенге</Text>
    <Text style={[styles.summaryText, { color: activeColors.text }]}>Наличными: {cashAmount} тенге</Text>
    <Text style={[styles.summaryText, { color: activeColors.text }]}>Безналичный: {nonCashAmount} тенге</Text>
    {dateRange && <Text style={[styles.summaryText, { color: activeColors.text }]}>Выбранный период: {dateRange}</Text>}
</View>
<Button title="Выбрать даты" onPress={() => setPickerVisible(true)} />
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
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
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
  brandText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CompletedDetailingOrdersScreen;
