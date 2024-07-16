import React, { useContext, useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ActivityScreen = ({ route }) => {
  const { userRole } = route.params;
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [activities, setActivities] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (userRole === "Директор") {
      fetchAllUsers();
    } else {
      fetchUserActivity();
    }
  }, [selectedUser]);

  const fetchAllUsers = async () => {
    // Тестовые данные для пользователей
    const testUsers = [
      { id: 1, name: "Иван Иванов" },
      { id: 2, name: "Петр Петров" },
      { id: 3, name: "Сидор Сидоров" },
    ];
    setActivities(testUsers);
  };

  const fetchUserActivity = async () => {
    // Тестовые данные для активности пользователя
    const testActivities = [
      { id: 1, activity: "Проверка машины", date: "2024-07-10 12:00:00" },
      { id: 2, activity: "Очистка салона", date: "2024-07-10 12:30:00" },
      { id: 3, activity: "Мойка кузова", date: "2024-07-10 13:00:00" },
    ];
    setActivities(testActivities);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user.id);
    fetchUserActivity(user.id);
  };

  const renderActivityItem = ({ item }) => (
    <View style={[styles.activityItem, { backgroundColor: activeColors.secondary }]}>
      <Text style={[styles.activityText, { color: activeColors.text }]}>{item.activity}</Text>
      <Text style={[styles.activityDate, { color: activeColors.text }]}>{item.date}</Text>
    </View>
  );

  const renderUserItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleUserSelect(item)}>
      <View style={[styles.userItem, { backgroundColor: activeColors.secondary }]}>
        <Text style={[styles.userText, { color: activeColors.text }]}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: activeColors.primary }]}>
      {userRole === "Директор" && !selectedUser && (
        <FlatList
          data={activities}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
      {(userRole !== "Директор" || selectedUser) && (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  activityItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  activityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityDate: {
    fontSize: 12,
  },
  userItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  userText: {
    fontSize: 16,
  },
});

export default ActivityScreen;
