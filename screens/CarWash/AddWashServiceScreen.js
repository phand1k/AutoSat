import React, { useState, useEffect, useContext } from "react";
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Alert, ScrollView, Modal, RefreshControl } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentSlider from "../PaymentSlider";

const AddWashServiceScreen = ({ route, navigation }) => {
  const { order, services, users, fetchAssignedServices, completeWashOrder, deleteWashOrder } = route.params;
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [serviceFilter, setServiceFilter] = useState('');
  const [filteredServices, setFilteredServices] = useState(services);
  const [userFilter, setUserFilter] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(false);
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setFilteredServices(services);
    setFilteredUsers(users);
  }, [services, users]);

  const handleServiceSearch = (text) => {
    setServiceFilter(text);
    if (text === '') {
      setFilteredServices(services);
    } else {
      const filteredData = services.filter(service =>
        service.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredServices(filteredData);
    }
  };

  const handleUserSearch = (text) => {
    setUserFilter(text);
    if (text === '') {
      setFilteredUsers(users);
    } else {
      const filteredData = users.filter(user =>
        `${user.firstName} ${user.lastName} ${user.surName}`.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUsers(filteredData);
    }
  };

  const addServiceToOrder = async () => {
    if (!selectedService || !selectedUser || !salary) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите услугу, пользователя и введите зарплату');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const price = parseFloat(selectedService.price.replace(' тг', ''));

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Director/CreateWashService', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          washOrderId: order.id,
          price: price,
          serviceName: selectedService.name,
          whomAspNetUserId: selectedUser.id,
          salary: parseFloat(salary)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка сервера:', errorData);
        throw new Error('Failed to add service to order');
      }

      Alert.alert('Успех', 'Услуга успешно добавлена');
      fetchAssignedServices(order.id);
      navigation.goBack();
    } catch (error) {
      console.error('Ошибка при добавлении услуги:', error);
      Alert.alert('Ошибка', 'Не удалось добавить услугу к заказу');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalary = async (service, user) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      console.log(`Fetching salary for serviceId: ${service.id}, userId: ${user.id}`);

      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/Director/GetSalaryUser?serviceId=${service.id}&aspNetUserId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (response.status === 404) {
        console.log('Salary not found, showing salary modal');
        setSalaryModalVisible(true);
      } else if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching salary:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        const data = await response.json();
        console.log('API response data:', data);

        if (typeof data === 'number') {
          console.log('Fetched salary:', data);
          setSalary(data.toString());
        } else {
          console.error('Unexpected response format:', data);
          Alert.alert('Ошибка', 'Неверный формат ответа API');
        }
      }
    } catch (error) {
      console.error('Error fetching salary:', error);
      if (error.message.includes('404')) {
        setSalaryModalVisible(true);
      } else {
        Alert.alert('Ошибка', 'Не удалось получить зарплату для данной услуги');
      }
    }
  };

  const handleSaveSalary = async () => {
    await createSalarySetting(selectedService.id, selectedUser.id, salary);
    addServiceToOrder();
    setSalaryModalVisible(false);
  };

  const createSalarySetting = async (serviceId, userId, salary) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/director/createsalarysetting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: serviceId,
          aspNetUserId: userId,
          salary: parseFloat(salary)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка сервера:', errorData);
        throw new Error('Failed to create salary setting');
      }
    } catch (error) {
      console.error('Ошибка при создании настройки зарплаты:', error);
      Alert.alert('Ошибка', 'Не удалось создать настройку зарплаты');
    }
  };

  return (
    <View style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={activeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Добавить услугу</Text>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {}} tintColor={activeColors.tint} />
        }
      >
        <TextInput
          style={[styles.searchBox, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
          value={serviceFilter}
          onChangeText={handleServiceSearch}
          placeholder="Поиск услуг"
          placeholderTextColor={activeColors.tint}
          clearButtonMode="while-editing"
        />
        <FlatList
          data={filteredServices}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedService(item)} style={[styles.itemContainer, selectedService?.id === item.id ? styles.selectedItem : {}, { backgroundColor: activeColors.secondary }]}>
              <StyledText style={styles.itemName}>{item.name}</StyledText>
              <StyledText style={styles.itemPrice}>{item.price}</StyledText>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
        />
        {selectedService && (
          <>
            <TextInput
              style={[styles.searchBox, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
              value={userFilter}
              onChangeText={handleUserSearch}
              placeholder="Поиск пользователей"
              placeholderTextColor={activeColors.tint}
              clearButtonMode="while-editing"
            />
            <FlatList
              data={filteredUsers}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => { setSelectedUser(item); fetchSalary(selectedService, item); }} style={[styles.itemContainer, selectedUser?.id === item.id ? styles.selectedItem : {}, { backgroundColor: activeColors.secondary }]}>
                  <StyledText style={styles.itemName}>{`${item.firstName} ${item.lastName} ${item.surName}`}</StyledText>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
            />
          </>
        )}
        {selectedUser && (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
              value={salary}
              onChangeText={setSalary}
              placeholder="Введите зарплату"
              keyboardType="numeric"
              placeholderTextColor={activeColors.tint}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: activeColors.accent }]}
              onPress={addServiceToOrder}
            >
              {loading ? (
                <ActivityIndicator color={activeColors.primary} />
              ) : (
                <Text style={[styles.addButtonText, { color: activeColors.primary }]}>Добавить услугу</Text>
              )}
            </TouchableOpacity>
          </>
        )}
        <PaymentSlider
          onComplete={() => completeWashOrder(order.id)}
          onSwipeLeft={() => deleteWashOrder(order.id)}
          selectedOrder={order}
        />
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={salaryModalVisible}
        onRequestClose={() => setSalaryModalVisible(false)}
      >
        <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
          <StyledText style={styles.modalTitle}>Введите зарплату</StyledText>
          <StyledText style={styles.modalSubtitle}>Услуга: {selectedService?.name}</StyledText>
          <StyledText style={styles.modalSubtitle}>Пользователь: {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} ${selectedUser.surName}` : ''}</StyledText>
          <TextInput
            style={[styles.editPriceInput, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
            value={salary}
            onChangeText={setSalary}
            placeholder="Введите зарплату"
            keyboardType="numeric"
            placeholderTextColor={activeColors.tint}
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
              onPress={handleSaveSalary}
            >
              <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Сохранить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
              onPress={() => setSalaryModalVisible(false)}
            >
              <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
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
    marginVertical: 10,
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
    borderRadius: 10,
    borderWidth: 1,
  },
  selectedItem: {
    borderColor: '#007bff',
    borderWidth: 2,
  },
  itemName: {
    fontSize: 16,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    color: '#888',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  addButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  addButtonText: {
    fontSize: 16,
  },
  modalView: {
    flex: 1,
    marginTop: 50,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
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
  editPriceInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
  },
});

export default AddWashServiceScreen;
