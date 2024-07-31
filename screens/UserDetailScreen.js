// UserDetailScreen.js
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Modal, Button } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import DateRangePicker from '../components/DateRangePicker';
import StyledText from "../components/texts/StyledText";

const UserDetailScreen = ({ route, navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const { user } = route.params;

  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateRange, setDateRange] = useState('');

  useEffect(() => {
    fetchEarnings();
  }, [startDate, endDate]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      // Тестовые данные
      const data = [
        { id: '1', service: 'Мойка', amount: 1500, date: '2023-07-01' },
        { id: '2', service: 'Полировка', amount: 3000, date: '2023-07-05' },
        { id: '3', service: 'Химчистка', amount: 2500, date: '2023-07-10' },
      ];

      if (startDate && endDate) {
        const filteredData = data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
        });
        setEarnings(filteredData);
      } else {
        setEarnings(data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      Alert.alert('Error', `Failed to fetch earnings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderEarningItem = ({ item }) => (
    <View style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
      <View style={styles.earningDetails}>
        <StyledText style={styles.itemTitle}>{item.service}</StyledText>
        <StyledText style={styles.itemMessage}>{item.amount}₸</StyledText>
        <StyledText style={styles.itemDate}>{format(parseISO(item.date), 'dd/MM/yyyy')}</StyledText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color={activeColors.tint} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Зарплата</Text>
      </View>
      <View style={styles.userDetails}>
        <StyledText style={styles.userName}>{user.userName}</StyledText>
        <StyledText style={styles.userRole}>Роль: {user.roles.$values.join(', ')}</StyledText>
      </View>
      <Button title="Выбрать даты" onPress={() => setPickerVisible(true)} />
      {dateRange && <Text style={[styles.dateRange, { color: activeColors.text }]}>Выбранный период: {dateRange}</Text>}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={activeColors.accent} />
        </View>
      ) : earnings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: activeColors.text }]}>Нет данных для отображения</Text>
        </View>
      ) : (
        <FlatList
          data={earnings}
          renderItem={renderEarningItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
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
  userDetails: {
    padding: 20,
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userRole: {
    fontSize: 16,
    color: '#888',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 2,
  },
  earningDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemMessage: {
    fontSize: 14,
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
  },
  dateRange: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

export default UserDetailScreen;
