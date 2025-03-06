import React, { useContext, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Text,
  Appearance,
  Switch,
  Alert,
  Linking,
  Modal,
  Clipboard
} from "react-native";
import { colors } from "../config/theme";
import { ThemeContext } from "../context/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreens = () => {

  const { theme, updateTheme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(theme.mode === "dark");
  const [userRole, setUserRole] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const role = await AsyncStorage.getItem('role_user_avtosat');
      setUserRole(role);
    };

    fetchUserRole();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkTheme(colorScheme === "dark");
    });

    return () => subscription.remove();
  }, []);

  const toggleTheme = () => {
    updateTheme();
    setIsDarkTheme(prev => !prev);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Fetch new data here and update your state
    // After fetching the data, set refreshing to false
    setRefreshing(false);
  };

  const handleInvitePress = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem('access_token_avtosat');
      if (!jwtToken) {
        Alert.alert("Ошибка", "Токен аутентификации отсутствует.");
        return;
      }
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
      
      const response = await fetch(`${cleanedSatApiURL}/api/Authenticate/InviteUser`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при получении ссылки приглашения');
      }

      const inviteLink = await response.text();
      setInviteLink(inviteLink);
      setModalVisible(true);

    } catch (error) {
      Alert.alert("Ошибка", "Не удалось получить ссылку приглашения");
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(inviteLink);
    Alert.alert("Скопировано", "Ссылка приглашения скопирована в буфер обмена");
  };

  const handleMenuItemPress = async (item) => {
    if (item.soon) {
      Alert.alert("В работе🔥", "Этот раздел будет доступен в скором времени");
      return;
    }

    if (item.title === "Пригласить") {
      handleInvitePress();
    } else if (item.title === "Заказы") {
      try {
        const organizationType = await AsyncStorage.getItem('typeOfOrganization_avtosat');
        if (organizationType === "Car wash") {
          navigation.navigate("Мойка", { userRole });
        } else if (organizationType === "Detailing") {
          navigation.navigate("Заказы", { userRole });
        } else {
          Alert.alert("Ошибка", "Тип организации не определен.");
        }
      } catch (error) {
        Alert.alert("Ошибка", "Не удалось получить тип организации.");
      }
    } else if (item.title === "Клиенты") {
      navigation.navigate("SalarySettings", { userRole });
    } else if (item.title === "Веб-версия") {
      Linking.openURL('https://autosat.kz');
    } else if (item.title === "Статистика") {
      navigation.navigate("Statistics");
    } else if (item.title === "Услуги") {
      navigation.navigate("Список");
    }
  };
  

  const allMenuItems = [
    { title: "Статистика", icon: "stats-chart-outline", roles: ["Мастер", "Директор", "Администратор"], soon: false },
    { title: "Заказы", icon: "file-tray-stacked-outline", roles: ["Администратор", "Директор", "Мастер"] },
    { title: "Мои задачи", icon: "newspaper-outline", roles: ["Директор", "Администратор", "Мастер"], soon: true },
    { title: "Продажи", icon: "cart-outline", roles: ["Администратор", "Директор"], soon: true },
    { title: "Клиенты", icon: "people-outline", roles: ["Администратор", "Директор"] },
    { title: "Лояльность", icon: "layers-outline", roles: ["Директор"], soon: true},
    { title: "Услуги", icon: "briefcase-outline", roles: ["Администратор", "Директор", "Мастер"] },
    { title: "Веб-версия", icon: "logo-chrome", roles: ["Администратор", "Директор", "Мастер"] },
    { title: "Пригласить", icon: "pulse-outline", roles: ["Мастер", "Директор", "Администратор"] }
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  const animation = {
    0: { scale: 1 },
    0.5: { scale: 1.2 },
    1: { scale: 1 },
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[{ backgroundColor: activeColors.primary }, styles.container]}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ flexGrow: 1 }}>
        <View style={[styles.header, { backgroundColor: activeColors.header }]}>
          <Text style={[styles.headerTitle, { color: activeColors.accent }]}>Привет👋</Text>
          <View style={styles.iconsContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Notification')} style={styles.notificationIcon}>
              <Ionicons name="notifications-outline" size={28} color={activeColors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Профиль')} style={styles.profileIcon}>
              <Ionicons name="person-outline" size={28} color={activeColors.accent} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.themeSwitchContainer}>
          <Text style={{ color: activeColors.text }}>Темная тема</Text>
          <Switch
            value={isDarkTheme}
            onValueChange={toggleTheme}
            thumbColor={isDarkTheme ? "#fff" : activeColors.tertiary}
            ios_backgroundColor={activeColors.primary}
            trackColor={{
              false: activeColors.primary,
              true: activeColors.accent,
            }}
          />
        </View>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.menuItem, { backgroundColor: activeColors.menuItem }]} onPress={() => handleMenuItemPress(item)}>
              <Animatable.View
                animation={animation}
                iterationCount="infinite"
                duration={2000}
                useNativeDriver
              >
                <Ionicons name={item.icon} size={28} color={activeColors.accent} />
              </Animatable.View>
              <Text style={[styles.menuItemText, { color: activeColors.text }]}>{item.title}</Text>
              {item.soon && <Text style={styles.soonLabel}>Soon</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <Text style={[styles.versionText, { color: activeColors.accent }]}>Версия 7.0.0</Text>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ссылка приглашения</Text>
            <Text style={styles.modalText}>{inviteLink}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
              <Text style={styles.copyButtonText}>Скопировать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  versionText: {
    padding: 'auto',
    left: 20,
    fontSize: 12,
    fontWeight: 'bold',
  },
  iconsContainer: {
    flexDirection: 'row',
  },
  notificationIcon: {
    padding: 5,
  },
  profileIcon: {
    padding: 5,
    marginLeft: 15,
  },
  themeSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
    marginTop: -20,
  },
  menuItem: {
    width: '40%',
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  menuItemText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  soonLabel: {
    marginTop: 5,
    fontSize: 12,
    color: 'green',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  copyButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default HomeScreens;
