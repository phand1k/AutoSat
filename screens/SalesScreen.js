import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../context/ThemeContext';
import { colors } from '../config/theme';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SalesScreen = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  // Состояния для вкладок (чеков)
  const [activeTab, setActiveTab] = useState(0); // Индекс активной вкладки
  const [receipts, setReceipts] = useState([[]]); // Массив чеков
  const [products, setProducts] = useState([
    { id: 1, name: 'Товар 1', price: 100, quantity: 0 },
    { id: 2, name: 'Товар 2', price: 200, quantity: 0 },
    { id: 3, name: 'Товар 3', price: 300, quantity: 0 },
    { id: 4, name: 'Товар 4', price: 400, quantity: 0 },
  ]);

  // Состояния для кассовой смены
  const [isCashShiftOpen, setIsCashShiftOpen] = useState(false);
  const [cashShiftInfo, setCashShiftInfo] = useState(null);
  const [shiftStatistics, setShiftStatistics] = useState({
    totalSales: 0, // Общая сумма продаж
    totalReceipts: 0, // Количество чеков
    totalReturns: 0, // Количество возвратов
  });

  // Открытие кассовой смены
  const openCashShift = () => {
    setIsCashShiftOpen(true);
    setCashShiftInfo({
      openedBy: 'Администратор', // Замените на реальное имя пользователя
      openedAt: new Date().toLocaleString(), // Текущее время
    });
    setReceipts([[]]); // Сброс чеков
    setShiftStatistics({ totalSales: 0, totalReceipts: 0, totalReturns: 0 }); // Сброс статистики
  };

  // Закрытие кассовой смены
  const closeCashShift = () => {
    setIsCashShiftOpen(false);
    setCashShiftInfo(null);
    Alert.alert(
      'Статистика смены',
      `Продажи: ${shiftStatistics.totalSales} руб.\nЧеков: ${shiftStatistics.totalReceipts}\nВозвратов: ${shiftStatistics.totalReturns}`
    );
  };

  // Добавление товара в текущий чек
  const addProductToReceipt = (product) => {
    const updatedProducts = products.map((p) =>
      p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
    );
    setProducts(updatedProducts);

    const currentReceipt = receipts[activeTab];
    const existingProduct = currentReceipt.find((item) => item.id === product.id);
    if (existingProduct) {
      const updatedReceipt = currentReceipt.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setReceipts((prev) => {
        const newReceipts = [...prev];
        newReceipts[activeTab] = updatedReceipt;
        return newReceipts;
      });
    } else {
      setReceipts((prev) => {
        const newReceipts = [...prev];
        newReceipts[activeTab] = [...currentReceipt, { ...product, quantity: 1 }];
        return newReceipts;
      });
    }
  };

  // Уменьшение количества товара в текущем чеке
  const removeProductFromReceipt = (product) => {
    const updatedProducts = products.map((p) =>
      p.id === product.id ? { ...p, quantity: Math.max(p.quantity - 1, 0) } : p
    );
    setProducts(updatedProducts);

    const currentReceipt = receipts[activeTab];
    const updatedReceipt = currentReceipt
      .map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0);

    setReceipts((prev) => {
      const newReceipts = [...prev];
      newReceipts[activeTab] = updatedReceipt;
      return newReceipts;
    });
  };

  // Оформление чека
  const finalizeReceipt = () => {
    const currentReceipt = receipts[activeTab];
    if (currentReceipt.length === 0) {
      Alert.alert('Ошибка', 'Добавьте товары в чек');
      return;
    }
    const total = currentReceipt.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setShiftStatistics((prev) => ({
      ...prev,
      totalSales: prev.totalSales + total,
      totalReceipts: prev.totalReceipts + 1,
    }));
    setReceipts((prev) => {
      const newReceipts = [...prev, []]; // Добавляем новый пустой чек
      return newReceipts;
    });
    setActiveTab(receipts.length); // Переключаемся на новую вкладку
    Alert.alert('Успешно', 'Чек оформлен');
  };

  // Рендер товара в списке
  const renderProductItem = ({ item }) => (
    <Animatable.View animation="fadeInUp" duration={500} useNativeDriver>
      <View style={[styles.productItem, { backgroundColor: activeColors.secondary }]}>
        <Text style={[styles.productText, { color: activeColors.tint }]}>{item.name}</Text>
        <Text style={[styles.productText, { color: activeColors.tint }]}>{item.price} руб.</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            onPress={() => removeProductFromReceipt(item)}
            disabled={item.quantity === 0}
          >
            <Ionicons name="remove-circle-outline" size={24} color={activeColors.tint} />
          </TouchableOpacity>
          <Text style={[styles.quantityText, { color: activeColors.tint }]}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => addProductToReceipt(item)}>
            <Ionicons name="add-circle-outline" size={24} color={activeColors.tint} />
          </TouchableOpacity>
        </View>
      </View>
    </Animatable.View>
  );

  // Рендер вкладок (чеков)
  const renderTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        {receipts.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tab, activeTab === index && styles.activeTab]}
            onPress={() => setActiveTab(index)}
          >
            <Text style={[styles.tabText, { color: activeColors.tint }]}>Чек {index + 1}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addTabButton}
          onPress={() => {
            setReceipts((prev) => [...prev, []]); // Добавляем новый чек
            setActiveTab(receipts.length); // Переключаемся на новую вкладку
          }}
        >
          <Ionicons name="add" size={24} color={activeColors.tint} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: activeColors.primary }}>
      <View style={{ flex: 1, backgroundColor: activeColors.primary }}>
        {/* Шапка экрана */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={activeColors.tint} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: activeColors.tint }]}>
            {isCashShiftOpen ? 'Кассовая смена открыта' : 'Кассовая смена закрыта'}
          </Text>
          <TouchableOpacity onPress={isCashShiftOpen ? closeCashShift : openCashShift}>
            <Ionicons
              name={isCashShiftOpen ? 'lock-open' : 'lock-closed'}
              size={24}
              color={activeColors.tint}
            />
          </TouchableOpacity>
        </View>

        {/* Вкладки (чеки) */}
        {renderTabs()}

        {/* Список товаров */}
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />

        {/* Текущий чек */}
        <Animatable.View animation="fadeInUp" duration={500} useNativeDriver>
          <View style={[styles.currentReceipt, { backgroundColor: activeColors.secondary }]}>
            <Text style={[styles.currentReceiptText, { color: activeColors.tint }]}>
              Текущий чек:
            </Text>
            {receipts[activeTab].map((item) => (
              <Text key={item.id} style={[styles.currentReceiptText, { color: activeColors.tint }]}>
                {item.name} - {item.quantity} x {item.price} руб.
              </Text>
            ))}
            <TouchableOpacity
              style={[styles.finalizeButton, { backgroundColor: activeColors.accent }]}
              onPress={finalizeReceipt}
            >
              <LinearGradient
                colors={['#007bff', '#1a70d9']}
                style={styles.gradientButton}
              >
                <Text style={styles.finalizeButtonText}>Оформить чек</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tab: {
    padding: 10,
    marginRight: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
  },
  addTabButton: {
    padding: 10,
  },
  list: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  productText: {
    fontSize: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  currentReceipt: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  currentReceiptText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  finalizeButton: {
    borderRadius: 12,
    marginTop: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    padding: 16,
    alignItems: 'center',
  },
  finalizeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SalesScreen;