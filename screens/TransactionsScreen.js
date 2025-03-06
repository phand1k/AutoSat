import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Modal, Button } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import DateRangePicker from '../components/DateRangePicker';

const TransactionsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateRange, setDateRange] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Токен аутентификации недоступен.');
      }
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      const url = new URL(`${cleanedSatApiURL}/api/Transaction/GetAllTransactions`);
      if (startDate && endDate) {
        url.searchParams.append('dateOfStart', startDate);
        url.searchParams.append('dateOfEnd', endDate);
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
      setLoading(false);
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

  const renderTransactionItem = ({ item }) => {
    const formattedDate = format(parseISO(item.dateOfCreated), 'dd.MM.yyyy HH:mm', { locale: ru });
    let iconName;
    if (item.paymentMethod) {
      switch (item.paymentMethod.name) {
        case 'Наличный':
          iconName = 'attach-money';
          break;
        case 'Безналичный':
          iconName = 'credit-card';
          break;
        default:
          iconName = 'payment';
          break;
      }
    }

    return (
      <View style={[styles.transactionItem, { backgroundColor: activeColors.secondary }]}>
        <MaterialIcons name={iconName} size={28} color={activeColors.accent} style={styles.icon} />
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionText, { color: activeColors.text }]}>Номер транзакции: {item.id}</Text>
          <Text style={[styles.transactionText, { color: activeColors.text }]}>Способ оплаты: {item.paymentMethod ? item.paymentMethod.name : 'Неизвестно'}</Text>
          <Text style={[styles.transactionText, { color: activeColors.text }]}>Сумма: {item.summ} ₸</Text>
          <Text style={[styles.transactionText, { color: activeColors.text }]}>Дата: {formattedDate}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={activeColors.accent} />
      </View>
    );
  }

  const { totalAmount, cashAmount, nonCashAmount } = calculateTotals();

  return (
    <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color={activeColors.tint} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Оплаты</Text>
      </View>
      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryText, { color: activeColors.text }]}>Общая сумма: {totalAmount} ₸</Text>
        <Text style={[styles.summaryText, { color: activeColors.text }]}>Наличными: {cashAmount} ₸</Text>
        <Text style={[styles.summaryText, { color: activeColors.text }]}>Безналичный: {nonCashAmount} ₸</Text>
        {dateRange && <Text style={[styles.summaryText, { color: activeColors.text }]}>Выбранный период: {dateRange}</Text>}
      </View>
      <Button title="Выбрать даты" onPress={() => setPickerVisible(true)} />
      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: activeColors.text }]}>Нет данных для отображения</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.list}
        />
      )}
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
    </SafeAreaView>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginRight: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionText: {
    fontSize: 16,
  },
  summaryContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
  },
});

export default TransactionsScreen;
