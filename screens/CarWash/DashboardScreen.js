import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, Animated, Button, Linking, Modal } from "react-native";
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import DateRangePicker from "../../components/DateRangePicker";
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

const windowWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }) => {
  const { theme } = React.useContext(ThemeContext);
  const activeColors = colors[theme?.mode || 'light'];
  const [selectedFilter, setSelectedFilter] = useState('');
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateRange, setDateRange] = useState('');


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

  
  const filters = ['Завершенные', 'Последние услуги'];

  const completedOrders = [
    { id: 1, licensePlate: 'A123BC', make: 'Тойота', model: 'Камри' },
    { id: 2, licensePlate: 'B456DE', make: 'БМВ', model: 'X5' },
    { id: 3, licensePlate: 'C789FG', make: 'Мерседес-Бенц', model: 'C-Класс' },
  ];


  const recentServices = [
    { id: 6, serviceName: 'Замена масла двигателя', price: 15000, car: 'Тойота Камри' },
    { id: 7, serviceName: 'Замена шин', price: 20000, car: 'БМВ X5' },
    { id: 8, serviceName: 'Проверка тормозов', price: 12000, car: 'Мерседес-Бенц C-Класс' },
  ];

  const totalCashPayments = 30000;
  const totalNonCashPayments = 50000;
  const totalReturns = 2;

  const filteredOrders = 
    selectedFilter === 'Завершенные' ? completedOrders 
    : recentServices;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (selectedFilter === 'Завершенные' && startDate && endDate) {
      setDateRange(`${format(parseISO(startDate), 'dd.MM.yyyy', { locale: ru })} - ${format(parseISO(endDate), 'dd.MM.yyyy', { locale: ru })}`);
    }
  }, [selectedFilter, startDate, endDate]);

  const renderFilterButton = (filter) => {
    const isSelected = selectedFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[styles.filterButton, isSelected && styles.filterButtonSelected]}
        onPress={() => setSelectedFilter(filter)}
      >
        <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>{filter}</Text>
      </TouchableOpacity>
    );
  };

  const renderOrderItem = ({ item }) => {
    return selectedFilter === 'Последние услуги' ? (
      <Animated.View
        style={[styles.orderContainer, { transform: [{ scale: scaleAnim }] }]}
        onTouchStart={onPressIn}
        onTouchEnd={onPressOut}
      >
        <View style={styles.orderIconContainer}>
          <FontAwesome name="wrench" size={24} color="#fff" />
        </View>
        <View style={styles.orderContent}>
          <Text style={styles.orderTitle}>{item.serviceName}</Text>
          <Text style={styles.orderStatus}>Цена: {item.price} ₸</Text>
          <Text style={styles.orderStatus}>Машина: {item.car}</Text>
        </View>
        <TouchableOpacity style={styles.orderButton}>
          <MaterialIcons name="keyboard-arrow-right" size={24} color="#000" />
        </TouchableOpacity>
      </Animated.View>
    ) : (
      <Animated.View
        style={[styles.orderContainer, { transform: [{ scale: scaleAnim }] }]}
        onTouchStart={onPressIn}
        onTouchEnd={onPressOut}
      >
        <View style={styles.orderIconContainer}>
          <FontAwesome name="car" size={24} color="#fff" />
        </View>
        <View style={styles.orderContent}>
          <Text style={styles.orderTitle}>Гос. номер: {item.licensePlate}</Text>
          <Text style={styles.orderStatus}>Марка: {item.make}</Text>
          <Text style={styles.orderStatus}>Модель: {item.model}</Text>
        </View>
        <TouchableOpacity style={styles.orderButton}>
          <MaterialIcons name="keyboard-arrow-right" size={24} color="#000" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const openReportLink = () => {
    const url = 'https://autosat.kz/reports'; // Замените на нужный URL
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={activeColors.tint}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Отчеты</Text>
      </View>
      <View style={styles.actionsContainer}>
        {selectedFilter === 'Завершенные' && (
          <TouchableOpacity style={styles.actionButton} onPress={() => setPickerVisible(true)}>
            <Ionicons name="calendar-outline" size={24} color={activeColors.tint} />
            <Text style={[styles.actionText, { color: activeColors.tint }]}>Выбрать даты</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={openReportLink}>
          <Ionicons name="link-outline" size={24} color={activeColors.tint} />
          <Text style={[styles.actionText, { color: activeColors.tint }]}>Подробнее на сайте</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filtersContainer}>
        {filters.map(renderFilterButton)}
      </View>
      {selectedFilter === '' && (
        <View style={styles.promptContainer}>
          <Text style={[styles.promptText, { color: activeColors.text }]}>Пожалуйста, выберите фильтр для отображения данных.</Text>
        </View>
      )}
      {selectedFilter !== '' && (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.ordersList}
        />
      )}



      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryText, { color: activeColors.text }]}>Сумма оплат наличными: {totalCashPayments} ₸</Text>
        <Text style={[styles.summaryText, { color: activeColors.text }]}>Сумма оплат безналом: {totalNonCashPayments} ₸</Text>
        <Text style={[styles.summaryText, { color: activeColors.text }]}>Количество возвратов: {totalReturns}</Text>
      </View>


      
      <Modal visible={isPickerVisible} animationType="slide">
        <DateRangePicker
          onSave={({ startDate, endDate }) => {
            setStartDate(startDate);
            setEndDate(endDate);
            setPickerVisible(false);
          }}
          onCancel={() => setPickerVisible(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  backButton: {
    position: 'absolute',
    left: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 5,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  filterButtonSelected: {
    backgroundColor: '#4f7cfe',
  },
  filterText: {
    fontSize: 14,
    color: '#000',
  },
  filterTextSelected: {
    color: '#fff',
  },
  promptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  promptText: {
    fontSize: 18,
    textAlign: 'center',
  },
  ordersList: {
    paddingVertical: 10,
  },
  orderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 7,
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4f7cfe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  orderContent: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    color: '#999',
    marginTop: 3,
  },
  orderButton: {
    marginLeft: 10,
  },
  summaryContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default DashboardScreen;

