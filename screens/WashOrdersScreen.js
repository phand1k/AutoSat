import React, { useContext, useState } from "react";
import { View, TextInput, RefreshControl, FlatList, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../context/ThemeContext";
import { colors } from "../config/theme";
import StyledText from "../components/texts/StyledText";

const ListOfWashOrdersScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [orders, setOrders] = useState([
    { id: 1, name: 'Raven Pro', description: 'Landing', brand: 'Toyota', model: 'Camry', licensePlate: 'X123ABC', createdAt: '2024-06-07T08:00:00Z', progress: 39, totalServices: '$1311', imageUrl: 'https://via.placeholder.com/50' },
    { id: 2, name: 'Boots4', description: 'Portfolio', brand: 'BMW', model: 'X5', licensePlate: 'Y456DEF', createdAt: '2024-06-06T09:00:00Z', progress: 26, totalServices: '$860', imageUrl: 'https://via.placeholder.com/50' },
    { id: 3, name: 'Falcon', description: 'Admin', brand: 'Mercedes-Benz', model: 'E-Class', licensePlate: 'Z789GHI', createdAt: '2024-06-05T10:00:00Z', progress: 16, totalServices: '$539', imageUrl: 'https://via.placeholder.com/50' },
    { id: 4, name: 'Slick', description: 'Builder', brand: 'Audi', model: 'A4', licensePlate: 'K321JLK', createdAt: '2024-06-04T11:00:00Z', progress: 10, totalServices: '$343', imageUrl: 'https://via.placeholder.com/50' },
    { id: 5, name: 'Reign Pro', description: 'Agency', brand: 'Honda', model: 'Civic', licensePlate: 'M654NOP', createdAt: '2024-06-03T12:00:00Z', progress: 8, totalServices: '$280', imageUrl: 'https://via.placeholder.com/50' },
  ]);
  const [originalOrders, setOriginalOrders] = useState(orders);

  const onRefresh = () => {
    setRefreshing(true);
    // Fetch new data here and update your state
    setRefreshing(false);
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
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}
      onPress={() => {
        // Действия при нажатии на элемент списка заказов
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.orderDetails}>
        <StyledText style={styles.itemName} numberOfLines={1}>{item.name}</StyledText>
        <StyledText style={styles.itemDescription} numberOfLines={1}>{item.description}</StyledText>
      </View>
      <View style={styles.orderStats}>
        <StyledText style={styles.totalTime}>{item.totalServices}</StyledText>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
        </View>
        <StyledText style={styles.progressText}>{item.progress}%</StyledText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: activeColors.primary }}>
      <View style={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={activeColors.tint} />
          </TouchableOpacity>
          <StyledText style={styles.headerTitle}>Best Selling Products</StyledText>
        </View>
        <TextInput
        style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
        value={filter}
        onChangeText={handleSearch}
        placeholder="Поиск"
        placeholderTextColor="#aaaaaa"
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
        <View style={styles.footer}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Last 7 days</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { /* Handle navigation or action */ }} style={styles.showAll}>
            <Text style={styles.showAllText}>View All</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  searchBox: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    margin: 10,
    backgroundColor: '#333',
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
    color: '#007bff',
  },
  itemDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  orderStats: {
    alignItems: 'flex-end',
  },
  totalTime: {
    fontSize: 14,
    color: '#007bff',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  filterButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#007bff',
  },
  showAll: {
    padding: 10,
  },
  showAllText: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default ListOfWashOrdersScreen;
