import React, { useContext, useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, TextInput, RefreshControl, Image, Modal, ScrollView } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { colors } from '../config/theme';
import { Ionicons } from '@expo/vector-icons';
import StyledText from '../components/texts/StyledText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNPickerSelect from 'react-native-picker-select';

const SalarySettingsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [salarySettings, setSalarySettings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSalarySetting, setSelectedSalarySetting] = useState(null);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [salary, setSalary] = useState('');

  useEffect(() => {
    fetchSalarySettings();
    fetchUsers();
    fetchServices();
  }, []);

  const fetchSalarySettings = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Salary/GetAllSalarySettings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch salary settings. HTTP status ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched data:', data);  // Для отладки

      // Resolve nested objects using $id and $ref
      const idMap = {};
      data.$values.forEach(item => {
        idMap[item.$id] = item;
        if (item.aspNetUser) idMap[item.aspNetUser.$id] = item.aspNetUser;
        if (item.service) idMap[item.service.$id] = item.service;
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

      const resolvedData = data.$values.map(item => {
        const resolvedItem = resolveReferences(item);
        return {
          id: resolvedItem.id,
          salary: resolvedItem.salary,
          serviceName: resolvedItem.service ? resolvedItem.service.name : undefined,
          servicePrice: resolvedItem.service ? resolvedItem.service.price : undefined,
          userFullName: resolvedItem.aspNetUser ? `${resolvedItem.aspNetUser.firstName} ${resolvedItem.aspNetUser.lastName} ${resolvedItem.aspNetUser.surName}` : undefined,
          aspNetUserId: resolvedItem.aspNetUser ? resolvedItem.aspNetUser.id : null,
          serviceId: resolvedItem.service ? resolvedItem.service.id : null,
        };
      });

      console.log('Resolved data:', resolvedData);  // Для отладки
      setSalarySettings(resolvedData);
    } catch (error) {
      console.error('Error fetching salary settings:', error);
      Alert.alert("Error", `Failed to fetch salary settings: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Director/GetAllUsers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users. HTTP status ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.$values.map(user => ({
        label: `${user.firstName} ${user.lastName} ${user.surName}`,
        value: user.id,
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert("Error", `Failed to fetch users: ${error.message}`);
    }
  };

  const fetchServices = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Service/GetAllServices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch services. HTTP status ${response.status}`);
      }

      const data = await response.json();
      setServices(data.$values.map(service => ({
        label: service.name,
        value: service.id,
      })));
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert("Error", `Failed to fetch services: ${error.message}`);
    }
  };

  const handleSearch = (text) => {
    setFilter(text);
    if (text === '') {
      fetchSalarySettings();
    } else {
      const filteredData = salarySettings.filter(item =>
        item.userFullName?.toLowerCase().includes(text.toLowerCase())
      );
      setSalarySettings(filteredData);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Salary/DeleteSalarySetting?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete salary setting. HTTP status ${response.status}`);
      }

      setSalarySettings(prevSettings => prevSettings.filter(item => item.id !== id));
      Alert.alert("Success", "Salary setting deleted successfully");
    } catch (error) {
      console.error('Error deleting salary setting:', error);
      Alert.alert("Error", `Failed to delete salary setting: ${error.message}`);
    }
  };

  const handleItemPress = (item) => {
    setSelectedSalarySetting(item);
    setSelectedUser(item.aspNetUserId);
    setSelectedService(item.serviceId);
    setSalary(item.salary.toString());
    setModalVisible(true);
  };

  const renderSalaryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}
      onPress={() => handleItemPress(item)}
    >
      <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/5534/5534747.png' }} style={styles.itemImage} />
      <View style={styles.orderDetails}>
        <StyledText style={styles.itemDescription}>Услуга: {item.serviceName}</StyledText>
        <StyledText style={styles.itemDescription}>Цена услуги: {item.servicePrice}тенге</StyledText>
        <StyledText style={styles.itemInfo}>Зарплата с услуги: {item.salary}тенге</StyledText>
        <StyledText style={styles.itemName}>Работник: {item.userFullName}</StyledText>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={activeColors.tint} />
        </TouchableOpacity>
        <StyledText style={[styles.headerTitle, { color: activeColors.tint }]}>Настройки Зарплат</StyledText>
        <TouchableOpacity onPress={fetchSalarySettings} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={activeColors.tint} />
        </TouchableOpacity>
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
        data={salarySettings}
        renderItem={renderSalaryItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchSalarySettings} />
        }
      />
      {selectedSalarySetting && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <ScrollView contentContainerStyle={styles.modalScrollView}>
            <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
              <StyledText style={styles.modalTitle}>Подробности о зарплате</StyledText>
              <StyledText style={styles.modalSubtitle}>Услуга: {selectedSalarySetting.serviceName}</StyledText>
              <StyledText style={styles.modalSubtitle}>Цена услуги: {selectedSalarySetting.servicePrice}тенге</StyledText>
              <StyledText style={styles.modalSubtitle}>Работник: {selectedSalarySetting.userFullName}</StyledText>
              <TextInput
                style={[styles.salaryInput, { backgroundColor: activeColors.secondary, borderColor: activeColors.accent, color: activeColors.tint }]}
                value={salary}
                onChangeText={setSalary}
                placeholder="Введите зарплату"
                keyboardType="numeric"
              />
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  style={pickerSelectStyles(activeColors)}
                  onValueChange={(value) => setSelectedUser(value)}
                  items={users}
                  placeholder={{
                    label: 'Выберите работника',
                    value: null,
                    color: activeColors.tint,
                  }}
                  value={selectedUser}
                />
              </View>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  style={pickerSelectStyles(activeColors)}
                  onValueChange={(value) => setSelectedService(value)}
                  items={services}
                  placeholder={{
                    label: 'Выберите услугу',
                    value: null,
                    color: activeColors.tint,
                  }}
                  value={selectedService}
                />
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const pickerSelectStyles = (activeColors) => ({
  inputIOS: {
    color: activeColors.tint,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: activeColors.secondary,
    borderRadius: 5,
    backgroundColor: activeColors.primary,
    fontSize: 16,
  },
  inputAndroid: {
    color: activeColors.tint,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: activeColors.secondary,
    borderRadius: 5,
    backgroundColor: activeColors.primary,
    fontSize: 16,
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  refreshButton: {
    position: 'absolute',
    right: 10,
  },
  headerTitle: {
    fontSize: 18,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
  },
  itemInfo: {
    fontSize: 12,
  },
  deleteButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'red',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    marginVertical: 5,
    marginRight: 10,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
  },
  modalView: {
    flex: 1,
    marginTop: 50,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalScrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  salaryInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
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
  pickerContainer: {
    marginVertical: 10,
  },
});

export default SalarySettingsScreen;
