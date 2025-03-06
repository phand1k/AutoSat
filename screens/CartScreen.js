import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, Alert, Modal, SafeAreaView, ActivityIndicator, Animated, TouchableWithoutFeedback, Keyboard, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from "../context/ThemeContext";
import { colors } from "../config/theme";
import StyledText from "../components/texts/StyledText";
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';

const initialLayout = { width: Dimensions.get('window').width };
const scaleValue = new Animated.Value(1);
const CartScreen = () => {
  const animatePress = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  };
  
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [userRole, setUserRole] = useState(null); // Состояние для роли пользователя
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'services', title: 'Список услуг' },
    { key: 'users', title: 'Пользователи' },
  ]);
  const [selectedService, setSelectedService] = useState(null); // Выбранная услуга для изменения цены
const [newPriceModalVisible, setNewPriceModalVisible] = useState(false); // Модальное окно для изменения цены
const [newPrice, setNewPrice] = useState(''); // Новая цена

  const [services, setServices] = useState([]);
  const [filter, setFilter] = useState('');
  const [originalServices, setOriginalServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('');
  const [originalUsers, setOriginalUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const ws = useRef(null);
  const openPriceModal = (service) => {
    setSelectedService(service); // Устанавливаем выбранную услугу
    setNewPrice(service.price.toString()); // Устанавливаем текущую цену услуги
    setNewPriceModalVisible(true); // Показываем модальное окно для изменения цены
  };
  
  const getInitialLetters = (brand) => {
    return brand && brand.length >= 3 ? brand.substring(0, 1).toUpperCase() : brand.toUpperCase();
  };
  
  useEffect(() => {
    fetchServices();
    fetchUsers();
    fetchRoles();
    setupWebSocket();
    const fetchUserRole = async () => {
      const role = await AsyncStorage.getItem('role_user_avtosat');
      setUserRole(role);
  };

  fetchUserRole();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const setupWebSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      ws.current = new WebSocket(`wss://avtosat-001-site1.ftempurl.com/ws?token=${token}`);

      ws.current.onopen = () => {
        console.log('WebSocket connection opened');
      };

      ws.current.onmessage = (e) => {
        console.log('WebSocket message received:', e.data);
        const message = JSON.parse(e.data);
        handleWebSocketMessage(message);
      };

      ws.current.onerror = (e) => {
        console.error('WebSocket error', e.message);
      };

      ws.current.onclose = (e) => {
        console.log('WebSocket connection closed', e.code, e.reason);
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      Alert.alert("Error", `Failed to set up WebSocket: ${error.message}`);
    }
  };

  const handleWebSocketMessage = (message) => {
    console.log('Received WebSocket message:', message);
    if (message.name && message.price) {
      fetchServices();
    }
  };

  const fetchServices = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL')
      const cleanedSatApiURL = SatApiURL.trim();
      console.log(token);
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`${cleanedSatApiURL}/api/service/GetAllServices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch services. HTTP status ${response.status}`);
      }

      const responseData = await response.json();
      setServices(responseData.$values);
      setOriginalServices(responseData.$values);
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert("Error", `Failed to fetch services: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL')
      const cleanedSatApiURL = SatApiURL.trim();
      console.log(token);
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`${cleanedSatApiURL}/api/userrole/GetUsersWithRoles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users. HTTP status ${response.status}`);
      }

      const responseData = await response.json();
      setUsers(responseData.$values);
      setOriginalUsers(responseData.$values);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert("Error", `Failed to fetch users: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL')
      const cleanedSatApiURL = SatApiURL.trim();
      console.log(token);
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`${cleanedSatApiURL}/api/userrole/GetRoles`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('URL'+SatApiURL);
      console.log('response for me'+response.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch roles. HTTP status ${response.message}`);
      }

      const responseData = await response.json();
      setRoles(responseData.$values);
    } 
    catch (error) {
      console.error('Error fetching roles:', error);
      console.log('URL'+SatApiURL);
      console.log('response for me'+response.url);
      Alert.alert("Error", `Failed to fetch roles: ${error.message}`);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL')
      const cleanedSatApiURL = SatApiURL.trim();
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`${cleanedSatApiURL}/api/director/deleteuser/?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user. HTTP status ${response.status}`);
      }

      Alert.alert("Удалено✅", "Аккаунт пользователя успешно удален");
      setUsers(users.filter(user => user.userId !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert("Error", `Failed to delete user: ${error.message}`);
    }
  };

  const handleDeleteService = async (id) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL')
      const cleanedSatApiURL = SatApiURL.trim();
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`${cleanedSatApiURL}/api/service/deleteservice/?id=${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete service. HTTP status ${response.status}`);
      }

      Alert.alert("Удалено✅", "Услуга успешно удалена");
      setServices(services.filter(service => service.id !== id));
    } catch (error) {
      console.error('Error deleting service:', error);
      Alert.alert("Error", `Failed to delete service: ${error.message}`);
    }
  };

  const handleUpdateUserRole = async () => {
    if (selectedUser && selectedRole) {
      try {
        const token = await AsyncStorage.getItem('access_token_avtosat');
        const SatApiURL = await AsyncStorage.getItem('SatApiURL')
        const cleanedSatApiURL = SatApiURL.trim();
        if (!token) {
          throw new Error('Authentication token is not available.');
        }

        const response = await fetch(`${cleanedSatApiURL}/api/UserRole/EditUserRole?userId=${selectedUser.userId}&roleId=${selectedRole}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to update user role. HTTP status ${response.status}`);
        }

        Alert.alert("Обновлено✅", "Роль пользователя успешно обновлена");
        const updatedUsers = users.map(user =>
          user.userId === selectedUser.userId ? { ...user, roles: { $values: [roles.find(role => role.id === selectedRole).name] } } : user
        );
        setUsers(updatedUsers);
        setUserModalVisible(false);
      } catch (error) {
        console.error('Error updating user role:', error);
        Alert.alert("Error", `Failed to update user role: ${error.message}`);
      }
    }
  };

  const handleSearch = text => {
    setFilter(text);
    if (text === '') {
      setServices(originalServices);
    } else {
      const filteredData = originalServices.filter(service =>
        service.name.toLowerCase().includes(text.toLowerCase())
      );
      setServices(filteredData);
    }
  };

  const handleUserSearch = text => {
    setUserFilter(text);
    if (text === '') {
      setUsers(originalUsers);
    } else {
      const filteredData = originalUsers.filter(user =>
        user.userName.toLowerCase().includes(text.toLowerCase())
      );
      setUsers(filteredData);
    }
  };
  const handleChangePrice = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL')
      const cleanedSatApiURL = SatApiURL.trim();
      if (!token) {
        throw new Error('Токен аутентификации недоступен.');
      }
  
      const response = await fetch(`${cleanedSatApiURL}/api/Service/ChangePrice?serviceId=${selectedService.id}&newPrice=${newPrice}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Не удалось сменить цену. HTTP статус: ${response.status}`);
      }
  
      Alert.alert('Изменено!', 'Цена была успешно изменена🤑');
      setNewPriceModalVisible(false); // Закрыть модальное окно
      fetchServices(); // Обновить список услуг
    } catch (error) {
      console.error('Ошибка при смене цены:', error);
      Alert.alert('Ошибка', `Не удалось сменить цену: ${error.message}`);
    }
  };
  
  const handleCreateService = async () => {
    if (!serviceName || !price) {
      setError('Все поля должны быть заполнены');
      return;
    }
    console.log(price);
    // Проверка, является ли введённая цена числом и больше ли она нуля
    if (isNaN(price) || price <= 0) {
      setError('Цена должна быть положительным числом');
      return;
    }
  
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL')
      const cleanedSatApiURL = SatApiURL.trim();
      if (!token) {
        throw new Error('Authentication token is not available.');
      }
  
      const response = await fetch(`${cleanedSatApiURL}/api/service/CreateService`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Используем проверенное значение с корректной ценой
        body: JSON.stringify({ name: serviceName, price: price }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to create service. HTTP status ${response.status}`);
      }
  
      Alert.alert("Создано✅", "Услуга успешно создана");
      setModalVisible(false);
      setServiceName('');
      setPrice('');
      fetchServices();
    } catch (error) {
      console.error('Error:', error);
      setError('Произошла ошибка при создании услуги');
    } finally {
      setLoading(false);
    }
  };
  

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => {
        animatePress();
        openPriceModal(item);
      }}
      style={[styles.itemContainer, { 
        backgroundColor: activeColors.secondary, 
        transform: [{ scale: scaleValue }] 
      }]}
    >
      <View style={styles.brandContainer}>
        <Text style={styles.brandText}>{getInitialLetters(item.name)}</Text>
      </View>
      <View style={styles.orderDetails}>
        <StyledText style={styles.itemName}>{item.name}</StyledText>
        <StyledText style={styles.itemDescription}>{item.description}</StyledText>
        <StyledText style={styles.itemPrice}>{item.price}₸</StyledText>
      </View>
      {userRole !== 'Мастер' && (
        <TouchableOpacity onPress={() => handleConfirmDeleteService(item.id)} style={styles.addIconContainer}>
          <Ionicons name="trash-outline" size={30} color="red" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
  

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => {
        animatePress();
        navigation.navigate('UserDetail', { user: item });
      }}
      style={[styles.itemContainer, { 
        backgroundColor: activeColors.secondary, 
        transform: [{ scale: scaleValue }] 
      }]}
    >
      <View style={styles.orderDetails}>
        <StyledText style={styles.itemName}>{item.userName.trim() || 'Без имени'}</StyledText>
        <StyledText style={styles.itemDescription}>Роль: {item.roles.$values.join(', ') || 'Нет роли'}</StyledText>
        <StyledText style={styles.itemPhoneNumber}>Телефон: {item.phoneNumber || 'Не указан'}</StyledText>
      </View>
      {userRole !== 'Мастер' && (
        <TouchableOpacity onPress={() => handleConfirmDeleteUser(item.userId)} style={styles.addIconContainer}>
          <Ionicons name="trash-outline" size={30} color="red" />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => { 
        setSelectedUser(item); 
        setSelectedRole(item.roles.$values[0] || '');
        setUserModalVisible(true); 
      }} style={styles.addIconContainer}>
        <Ionicons name="create-outline" size={30} color="blue" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const handleConfirmDeleteService = (id) => {
    Alert.alert(
      "Подтверждение удаления",
      "Вы уверены, что хотите удалить эту услугу?",
      [
        {
          text: "Отмена",
          style: "cancel"
        },
        {
          text: "Удалить",
          onPress: () => handleDeleteService(id)
        }
      ],
      { cancelable: true }
    );
  };

  const handleConfirmDeleteUser = (id) => {
    Alert.alert(
      "Подтверждение удаления",
      "Вы уверены, что хотите удалить этот аккаунт пользователя?",
      [
        {
          text: "Отмена",
          style: "cancel"
        },
        {
          text: "Удалить",
          onPress: () => handleDeleteUser(id)
        }
      ],
      { cancelable: true }
    );
  };

  const renderScene = SceneMap({
    services: () => (
      <View style={{ flex: 1, backgroundColor: activeColors.primary, justifyContent: 'space-between' }}>
        <TextInput
          style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
          value={filter}
          onChangeText={handleSearch}
          placeholder="Поиск"
          placeholderTextColor="#aaaaaa"
          clearButtonMode="while-editing"
        />
        {services.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Ionicons name="cog-outline" size={60} color={activeColors.tint} />
            <Text style={{ color: activeColors.tint, textAlign: 'center', marginTop: 20 }}>Список услуг пустой.</Text>
          </View>
        ) : (
          <FlatList
            data={services}
            renderItem={renderServiceItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={fetchServices} />
            }
          />
        )}
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: activeColors.accent, alignSelf: 'stretch' }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>Добавить услугу</Text>
        </TouchableOpacity>
      </View>
    ),
    users: () => (
      <View style={{ flex: 1, backgroundColor: activeColors.primary }}>
        <TextInput
          style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
          value={userFilter}
          onChangeText={handleUserSearch}
          placeholder="Поиск пользователей"
          placeholderTextColor="#aaaaaa"
          clearButtonMode="while-editing"
        />
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchUsers} />
          }
        />
      </View>
    ),
});



  return (
    <View style={{ flex: 1, backgroundColor: activeColors.primary }}>
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
      <Modal
  visible={newPriceModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setNewPriceModalVisible(false)}
>
  
  <SafeAreaView style={styles.modalBackdrop}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.modalContainer, { backgroundColor: activeColors.primary }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.modalTitle}>Изменить цену</Text>
          <TouchableOpacity onPress={() => setNewPriceModalVisible(false)}>
            <Ionicons name="close" size={24} color={activeColors.tint} />
          </TouchableOpacity>
        </View>
        <Text style={styles.modalText}>Услуга: {selectedService?.name}</Text>
        <TextInput
          style={[styles.modalInput, { borderColor: activeColors.secondary, color: activeColors.tint }]}
          value={newPrice}
          onChangeText={setNewPrice}
          keyboardType="numeric"
          placeholder="Новая цена"
          placeholderTextColor="#aaaaaa"
        />
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: activeColors.accent }]}
          onPress={handleChangePrice}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Сохранить</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  </SafeAreaView>

</Modal>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalContainer, { backgroundColor: activeColors.primary }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.modalTitle}>Создать услугу</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={activeColors.tint} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.modalInput, { borderColor: activeColors.secondary, color: activeColors.tint }]}
                  value={serviceName}
                  onChangeText={setServiceName}
                  placeholder="Название услуги"
                  placeholderTextColor="#aaaaaa"
                />
                <TextInput
                  style={[styles.modalInput, { borderColor: activeColors.secondary, color: activeColors.tint }]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Цена"
                  placeholderTextColor="#aaaaaa"
                  keyboardType="numeric"
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: activeColors.accent }]}
                    onPress={handleCreateService}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
                {loading && <ActivityIndicator size="large" color={activeColors.accent} />}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>
      <Modal
        visible={userModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUserModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalContainer, { backgroundColor: activeColors.primary }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.modalTitle}>Редактировать роль</Text>
                  <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                    <Ionicons name="close" size={24} color={activeColors.tint} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.roleButtonContainer}>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleCard,
                        selectedRole === role.id && { borderColor: activeColors.accent }
                      ]}
                      onPress={() => setSelectedRole(role.id)}
                    >
                      <MaterialIcons name="person" size={24} color={activeColors.accent} />
                      <Text style={[
                        styles.roleText, 
                        selectedRole === role.id && { color: activeColors.accent }
                      ]}>
                        {role.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: activeColors.accent }]}
                    onPress={handleUpdateUserRole}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
                {loading && <ActivityIndicator size="large" color={activeColors.accent} />}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBox: {
    height: 50,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginVertical: 15,
    fontSize: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
  },
  orderDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 20,
    color: '#007bff',
    fontWeight: 'bold',
  },
  itemTimeAgo: {
    fontSize: 12,
    color: '#888',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readyBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  inProgressBadge: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
  },
  statusText: {
    fontSize: 14,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  itemPhoneNumber: {
    fontSize: 14,
    color: '#007bff',
  },
  brandContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  brandText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  addIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  createButton: {
    padding: 15,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    padding: 10,
  },
  roleButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  roleCard: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
    backgroundColor: '#f2f2f2',
    minWidth: '40%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default CartScreen;
