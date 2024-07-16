import React, { useContext, useState, useEffect } from "react";
import { SafeAreaView, View, TextInput, FlatList, TouchableOpacity, StyleSheet, Text, Image, Modal, ScrollView, Alert, RefreshControl, ActivityIndicator, Dimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';

const initialLayout = { width: Dimensions.get('window').width };

const CompletedWashOrdersScreen = ({ navigation }) => {
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

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'orderDetails', title: 'Подробности заказа' },
    { key: 'assignedServices', title: 'Назначенные услуги' },
  ]);

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const fetchCompletedOrders = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/director/GetAllCompletedWashOrdersAsync', {
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

      const orders = data.$values.map(order => {
        const resolvedOrder = resolveReferences(order);
        const car = resolvedOrder.car || {};
        const modelCar = resolvedOrder.modelCar || {};

        return {
          id: resolvedOrder.id,
          name: `Авто: ${car.name || 'Неизвестная марка машины'} ${modelCar.name || 'Неизвестная модель'}`,
          description: `${resolvedOrder.carNumber}`,
          brand: car.name || 'Неизвестно',
          model: modelCar.name || 'Неизвестно',
          licensePlate: resolvedOrder.carNumber,
          createdAt: resolvedOrder.dateOfCreated,
          timeAgo: formatDistanceToNow(parseISO(resolvedOrder.dateOfCreated), { locale: ru }),
          imageUrl: 'https://logowik.com/content/uploads/images/order5492.jpg'
        };
      });

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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/GetDetailsWashOrder?id=${orderId}`, {
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

  const fetchPaymentInfo = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/GetInfoPaymentForWashOrder?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const responseText = await response.text(); // Получаем ответ как текст

      if (responseText) { // Проверяем, что ответ не пустой
        const data = JSON.parse(responseText); // Парсим текст в JSON
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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/GetAllWashServicesOnOrderAsync?id=${orderId}`, {
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
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/GetDetailsWashService?id=${washServiceId}`, {
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
    await fetchOrderDetails(order.id);
    await fetchPaymentInfo(order.id); // Fetch payment info
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
    <TouchableOpacity onPress={() => openModal(item)} style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.orderDetails}>
        <StyledText style={styles.itemName}>{item.name}</StyledText>
        <StyledText style={styles.itemDescription}>{item.description}</StyledText>
        <StyledText style={styles.itemInfo}>{item.brand} {item.model} ({item.licensePlate})</StyledText>
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
          </View>
          <View style={styles.detailsContainer}>
            <StyledText style={styles.detailsTitle}>Информация о мастере</StyledText>
            <StyledText style={styles.detailsText}>Мастер: {orderDetails.aspNetUser.fullName}</StyledText>
            <StyledText style={styles.detailsText}>Номер телефона: {orderDetails.phoneNumber}</StyledText>
          </View>
          {paymentInfo && (
            <View style={styles.detailsContainer}>
              <StyledText style={styles.detailsTitle}>Информация о платеже</StyledText>
              <StyledText style={styles.detailsText}>Способ оплаты: {paymentInfo.paymentMethodId === 1 ? 'Наличный' : 'Безналичный'}</StyledText>
              <StyledText style={styles.detailsText}>Сумма оплаты: {paymentInfo.summ} тг</StyledText>
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

  return (
    <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      {renderServiceDetailsModal()}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Завершенные заказ-наряды</Text>
      </View>
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
  progressBarContainer: {
    width: 100,
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginVertical: 5,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#ccc',
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
  noSelectionText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  }
});

export default CompletedWashOrdersScreen;
