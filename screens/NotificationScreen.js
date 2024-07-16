import React, { useContext, useState, useEffect } from "react";
import { SafeAreaView, View, FlatList, TouchableOpacity, StyleSheet, Text, Modal, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../context/ThemeContext";
import { colors } from "../config/theme";
import StyledText from "../components/texts/StyledText";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Profile/Notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications. HTTP status ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.$values);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert("Error", `Failed to fetch notifications: ${error.message}`);
    }
  };

  const openModal = (notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)} style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
      <Ionicons name="notifications" size={24} color={activeColors.tint} style={styles.itemIcon} />
      <View style={styles.notificationDetails}>
        <StyledText style={styles.itemTitle}>{item.title}</StyledText>
        <StyledText style={styles.itemMessage}>{item.description}</StyledText>
        <StyledText style={styles.itemTimeAgo}>{formatDistanceToNow(parseISO(item.dateOfCreated), { locale: ru })} назад</StyledText>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color={activeColors.tint} onPress={() => navigation.goBack()} style={styles.backButton} />
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Уведомления</Text>
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />
      {selectedNotification && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
            <StyledText style={styles.modalTitle}>{selectedNotification.title}</StyledText>
            <StyledText style={styles.modalMessage}>{selectedNotification.description}</StyledText>
            <StyledText style={styles.modalTimeAgo}>{formatDistanceToNow(parseISO(selectedNotification.dateOfCreated), { locale: ru })} назад</StyledText>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: activeColors.tint }]}
              onPress={closeModal}
            >
              <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
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
  itemIcon: {
    marginRight: 10,
  },
  notificationDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemMessage: {
    fontSize: 14,
  },
  itemTimeAgo: {
    fontSize: 12,
    color: '#888',
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
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalTimeAgo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
  }
});

export default NotificationScreen;
