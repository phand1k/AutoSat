import React, { useContext, useState, useEffect } from "react";
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserSelectionScreen = ({ route, navigation }) => {
  const { service, order } = route.params;
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [salary, setSalary] = useState('');
  const [isFetchingSalary, setIsFetchingSalary] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Director/GetAllUsers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data.$values);
      setFilteredUsers(data.$values);
    } catch (error) {
      console.error(error);
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

  const handleUserItemPress = (user) => {
    setSelectedUser(user);
  };

  const handleSaveSalary = async () => {
    if (selectedUser && salary) {
      try {
        setIsFetchingSalary(true);
        const token = await AsyncStorage.getItem('access_token_avtosat');
        const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/director/createsalarysetting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            serviceId: service.id,
            aspNetUserId: selectedUser.id,
            salary: parseFloat(salary)
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Ошибка сервера:', errorData);
          throw new Error('Failed to create salary setting');
        }

        navigation.navigate('OrderDetails', { order });
      } catch (error) {
        console.error('Ошибка при создании настройки зарплаты:', error);
        Alert.alert('Ошибка', 'Не удалось создать настройку зарплаты');
      } finally {
        setIsFetchingSalary(false);
      }
    } else {
      Alert.alert('Ошибка', 'Выберите пользователя и введите зарплату перед сохранением.');
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleUserItemPress(item)}
      style={[styles.userItem, { backgroundColor: activeColors.secondary }]}
    >
      <StyledText style={styles.userName}>{`${item.firstName} ${item.lastName} ${item.surName}`}</StyledText>
    </TouchableOpacity>
  );

  return (
    <View style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={activeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Выбор пользователя</Text>
      </View>
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
        renderItem={renderUserItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.userList}
      />
      <View style={styles.footer}>
        <TextInput
          style={[styles.salaryInput, { backgroundColor: activeColors.primary, borderColor: activeColors.secondary, color: activeColors.tint }]}
          value={salary}
          onChangeText={setSalary}
          placeholder="Введите зарплату"
          keyboardType="numeric"
          placeholderTextColor={activeColors.tint}
        />
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: activeColors.accent }]}
          onPress={handleSaveSalary}
        >
          {isFetchingSalary ? (
            <ActivityIndicator size="small" color={activeColors.primary} />
          ) : (
            <Text style={[styles.saveButtonText, { color: activeColors.primary }]}>Сохранить</Text>
          )}
        </TouchableOpacity>
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
  userList: {
    flex: 1,
  },
  userItem: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  userName: {
    fontSize: 16,
  },
  footer: {
    padding: 10,
  },
  salaryInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  saveButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
  },
});

export default UserSelectionScreen;
