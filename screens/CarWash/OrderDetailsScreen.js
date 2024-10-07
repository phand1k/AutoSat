import React, { useContext, useState, useEffect } from "react";
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Dimensions, ScrollView, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const initialLayout = { width: Dimensions.get('window').width };

const OrderDetailsScreen = ({ route, navigation }) => {
  const { order } = route.params;
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [serviceFilter, setServiceFilter] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [assignedServices, setAssignedServices] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchAssignedServices(order.id);
  }, []);

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

  const handleServicePress = (service) => {
    setSelectedService(service);
    setUserModalVisible(true);
    navigation.navigate('UserSelection', { service, order });
  };

  const renderServiceItem = (service) => {
    const serviceAdded = assignedServices.some(s => s.id === service.id);
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

  const renderAssignedServiceItem = (service) => {
    return (
      <View key={service.id} style={[styles.assignedServiceItem, { backgroundColor: activeColors.secondary }]}>
        <StyledText style={styles.assignedServiceName} numberOfLines={2}>{service.name}</StyledText>
        <StyledText style={styles.assignedServicePrice}>{service.price}</StyledText>
        <StyledText style={styles.assignedServiceStatus}>{service.salary} тенге</StyledText>
      </View>
    );
  };

  const renderOrderDetails = () => {
    const { brand, model, licensePlate, timeAgo, totalServices } = order;

    return (
      <ScrollView style={styles.orderDetailsContainer}>
        <StyledText style={styles.orderDetailItem}>Марка: {brand}</StyledText>
        <StyledText style={styles.orderDetailItem}>Модель: {model}</StyledText>
        <StyledText style={styles.orderDetailItem}>Гос номер: {licensePlate}</StyledText>
        <StyledText style={styles.orderDetailItem}>Создано: {timeAgo} назад</StyledText>
        <StyledText style={styles.orderDetailItem}>Общая сумма услуг: {totalServices}</StyledText>
      </ScrollView>
    );
  };

  const renderScene = SceneMap({
    first: () => (
      <>
        <TextInput
          style={[styles.searchBox, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
          value={serviceFilter}
          onChangeText={setServiceFilter}
          placeholder="Поиск услуг"
          placeholderTextColor={activeColors.tint}
          clearButtonMode="while-editing"
        />
        <View style={styles.serviceListContainer}>
          {filteredServices.map(renderServiceItem)}
        </View>
      </>
    ),
    second: () => (
      <>
        <StyledText style={styles.assignedServicesTitle}>Назначенные услуги</StyledText>
        <View style={styles.assignedServiceListContainer}>
          {assignedServices.map(renderAssignedServiceItem)}
        </View>
      </>
    ),
    third: renderOrderDetails,
  });

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Добавление услуг' },
    { key: 'second', title: 'Назначенные услуги' },
    { key: 'third', title: 'Подробные данные' },
  ]);

  return (
    <View style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={activeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Детали заказа</Text>
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
  orderDetailsContainer: {
    padding: 10,
  },
  orderDetailItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  assignedServiceStatus: {
    fontSize: 14,
  },
});

export default OrderDetailsScreen;
