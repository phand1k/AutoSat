import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, Alert, Modal, SafeAreaView, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from "../context/ThemeContext";
import { colors } from "../config/theme";
import StyledText from "../components/texts/StyledText";
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';

const initialLayout = { width: Dimensions.get('window').width };

const CartScreen = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'services', title: 'Список услуг' },
    { key: 'users', title: 'Пользователи' },
  ]);

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
  const [refreshing, setRefreshing] = useState(false); // Добавляем состояние для обновления
  const ws = useRef(null);

  useEffect(() => {
    fetchServices();
    fetchUsers();
    fetchRoles();
    setupWebSocket();

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
      setRefreshing(true); // Начинаем обновление
      const token = await AsyncStorage.getItem('access_token_avtosat');
      console.log(token);
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Director/GetAllServices', {
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
      setRefreshing(false); // Заканчиваем обновление
    }
  };

  const fetchUsers = async () => {
    try {
      setRefreshing(true); // Начинаем обновление
      const token = await AsyncStorage.getItem('access_token_avtosat');
      console.log(token);
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/userrole/GetUsersWithRoles', {
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
      setRefreshing(false); // Заканчиваем обновление
    }
  };

  const fetchRoles = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      console.log(token);
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/userrole/GetRoles', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles. HTTP status ${response.status}`);
      }

      const responseData = await response.json();
      setRoles(responseData.$values);
    } catch (error) {
      console.error('Error fetching roles:', error);
      Alert.alert("Error", `Failed to fetch roles: ${error.message}`);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/director/deleteuser/?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user. HTTP status ${response.status}`);
      }

      Alert.alert("Success", "Аккаунт пользователя успешно удален");
      setUsers(users.filter(user => user.userId !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert("Error", `Failed to delete user: ${error.message}`);
    }
  };

  const handleDeleteService = async (id) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/director/deleteservice/?id=${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete service. HTTP status ${response.status}`);
      }

      Alert.alert("Success", "Услуга успешно удалена");
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
        if (!token) {
          throw new Error('Authentication token is not available.');
        }

        const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/UserRole/EditUserRole?userId=${selectedUser.userId}&roleId=${selectedRole}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to update user role. HTTP status ${response.status}`);
        }

        Alert.alert("Success", "Роль пользователя успешно обновлена");
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

  const handleCreateService = async () => {
    if (!serviceName || !price) {
      setError('Все поля должны быть заполнены');
      return;
    }
    if (isNaN(price)) {
      setError('Цена должна быть числом');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Director/CreateService', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: serviceName, price: parseFloat(price) }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create service. HTTP status ${response.status}`);
      }

      Alert.alert("Success", "Услуга успешно создана");
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
    <View style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
      <Image source={{ uri: 'https://www.freeiconspng.com/thumbs/services-icon-png/developer-services-icon-21.png' }} style={styles.itemImage} />
      <View style={styles.orderDetails}>
        <StyledText style={styles.itemName}>{item.name}</StyledText>
        <StyledText style={styles.itemDescription}>{item.description}</StyledText>
        <StyledText style={styles.itemPrice}>{item.price}₸</StyledText>
      </View>
      <TouchableOpacity onPress={() => handleConfirmDeleteService(item.id)} style={styles.addIconContainer}>
        <Ionicons name="trash-outline" size={30} color="red" />
      </TouchableOpacity>
    </View>
  );

  const renderUserItem = ({ item }) => (
    <View style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
      <View style={styles.orderDetails}>
        <StyledText style={styles.itemName}>{item.userName.trim() || 'Без имени'}</StyledText>
        <StyledText style={styles.itemDescription}>Роль: {item.roles.$values.join(', ') || 'Нет роли'}</StyledText>
      </View>
      <TouchableOpacity onPress={() => handleConfirmDeleteUser(item.userId)} style={styles.addIconContainer}>
        <Ionicons name="trash-outline" size={30} color="red" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { 
        setSelectedUser(item); 
        setSelectedRole(item.roles.$values[0] || ''); 
        setUserModalVisible(true); 
      }} style={styles.addIconContainer}>
        <Ionicons name="create-outline" size={30} color="blue" />
      </TouchableOpacity>
    </View>
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
      <View style={{ flex: 1, backgroundColor: activeColors.primary }}>
        <TextInput
          style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
          value={filter}
          onChangeText={handleSearch}
          placeholder="Поиск"
          placeholderTextColor="#aaaaaa"
          clearButtonMode="while-editing"
        />
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchServices} />
          }
        />
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: activeColors.accent }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Добавить услугу</Text>
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  itemDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  itemPrice: {
    fontSize: 14,
    color: '#007bff',
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
