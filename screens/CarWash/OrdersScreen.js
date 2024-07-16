import React, { useContext, useState, useEffect } from "react";
import { View, TextInput, RefreshControl, FlatList, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const OrdersScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [originalOrders, setOriginalOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

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

      const orders = data.$values.map(order => ({
        id: order.id,
        name: `${order.car?.name || 'Неизвестная марка машины'} ${order.modelCar?.name || 'Неизвестная модель'}`,
        description: `${order.carNumber}`,
        brand: order.car?.name || 'Неизвестно',
        model: order.modelCar?.name || 'Неизвестно',
        licensePlate: order.carNumber,
        timeAgo: moment(order.dateOfCreated).fromNow(),
        totalServices: '0 ₸', // Подгрузим позже
        imageUrl: 'https://logowik.com/content/uploads/images/order5492.jpg',
        phoneNumber: order.phoneNumber
      }));

      setOrders(orders);
      setOriginalOrders(orders);
      setRefreshing(false);
    } catch (error) {
      console.error(error);
      setRefreshing(false);
    }
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

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('OrderDetails', { order: item })} style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
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

  return (
    <View style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={activeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Машины на мойке</Text>
        <TouchableOpacity onPress={() => {}} style={styles.infoButton}>
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
          <RefreshControl refreshing={refreshing} onRefresh={fetchOrders} tintColor={activeColors.tint} />
        }
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
  itemTimeAgo: {
    fontSize: 12,
    color: '#888',
  },
});

export default OrdersScreen;
