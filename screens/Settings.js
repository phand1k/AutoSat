import { View, TouchableOpacity, StyleSheet, ScrollView, Appearance, Alert, RefreshControl, TextInput, Modal } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { colors } from "../config/theme";
import { ThemeContext } from "../context/ThemeContext";
import StyledText from "../components/texts/StyledText";
import SettingsItem from "../components/settings/SettingsItem";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const { theme, updateTheme } = useContext(ThemeContext);
  let activeColors = colors[theme.mode];
  const [isDarkTheme, setIsDarkTheme] = useState(theme.mode === "dark");
  const [userInfo, setUserInfo] = useState(null);
  const [organizationInfo, setOrganizationInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userRole, setUserRole] = useState(null); // Состояние для роли пользователя
  const [isFullNameModalVisible, setIsFullNameModalVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  useEffect(() => {
    const fetchUserRole = async () => {
        const role = await AsyncStorage.getItem('role_user_avtosat');
        setUserRole(role);
    };

    fetchUserRole(); // Загружаем роль пользователя при монтировании компонента
}, []);
  const toggleTheme = () => {
    updateTheme();
    setIsDarkTheme(prev => !prev);
  };

  const handleLogout = async () => {
    // Показываем Alert с подтверждением
    Alert.alert(
      "Выход из системы", // Заголовок
      "Вы уверены, что хотите выйти?", // Сообщение
      [
        {
          text: "Отмена", // Кнопка "Отмена"
          style: "cancel", // Стиль кнопки
        },
        {
          text: "Выйти", // Кнопка "Выйти"
          onPress: async () => { // Действие при нажатии
            try {
              await AsyncStorage.removeItem("access_token_avtosat");
              await AsyncStorage.removeItem("role_user_avtosat");
  
              // Сброс стека навигации и переход на экран Welcome
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              console.error('Ошибка при удалении токена:', error);
            }
          },
        },
      ],
      { cancelable: true } // Возможность закрыть Alert по клику вне его
    );
  };


  const setUserFullName = async (firstName, lastName) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim();
  
      const response = await fetch(`${cleanedSatApiURL}/api/Authenticate/SetUserFullName?firstName=${firstName}&lastName=${lastName}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        Alert.alert("Успех", "ФИО успешно обновлено.");
        setIsFullNameModalVisible(false); // Закрываем модальное окно после успешного обновления
        fetchData(); // Обновляем данные пользователя
      } else {
        throw new Error('Failed to update full name');
      }
    } catch (error) {
      console.error('Error updating full name:', error);
      Alert.alert("Ошибка", "Не удалось обновить ФИО.");
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      const userResponse = await fetch(`${cleanedSatApiURL}/api/profile/getprofileinfo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const userFullNameResponse = await fetch(`${cleanedSatApiURL}/api/Authenticate/CheckUserFullName`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const organizationResponse = await fetch(`${cleanedSatApiURL}/api/organization/getsubscriptionorganization`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const userData = await userResponse.json();
      const organizationData = await organizationResponse.json();

      if (userFullNameResponse.status === 204) {
        setIsFullNameModalVisible(true);
      }
      if (userResponse.ok && organizationResponse.ok) {
        setUserInfo(userData);
        setOrganizationInfo(organizationData);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert("Error", "Не удалось загрузить данные.");
    } finally {
      setRefreshing(false);
    }
  };

  const confirmOrganizationPassword = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
      console.log(password);
      const response = await fetch(`${cleanedSatApiURL}/api/Organization/ConfirmRights/?password=${password}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        await handleLogout();
        Alert.alert("Успех", "Пароль подтвержден. Пожалуйста, войдите снова.");
      } else {
        console.log(response);
        Alert.alert("Ошибка", "Не верный пароль организации.");
      }
    } catch (error) {
      console.error('Error confirming organization password:', error);
      Alert.alert("Ошибка", "Не удалось подтвердить пароль.");
    } finally {
      setModalVisible(false);
      setPassword('');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      const response = await fetch(`${cleanedSatApiURL}/api/Authenticate/DeleteUser/?id=${userInfo.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await handleLogout();
        Alert.alert("Успех", "Аккаунт успешно удален.");
      } else {
        Alert.alert("Ошибка", "Не удалось удалить аккаунт.");
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert("Ошибка", "Произошла ошибка при удалении аккаунта.");
    } finally {
      setDeleteModalVisible(false);
    }
  };

  useEffect(() => {
    fetchData();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkTheme(colorScheme === "dark");
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
        }}
        style={[{ backgroundColor: activeColors.primary }, styles.scrollContainer]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
        }
      >
        <View style={styles.header}>
          <StyledText style={{ color: activeColors.accent }} bold>Пользователь</StyledText>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
              <Ionicons name="refresh" size={24} color={activeColors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleteModalVisible(true)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
          </View>
        </View>

       <Modal
  animationType="slide"
  transparent={true}
  visible={isFullNameModalVisible}
  onRequestClose={() => setIsFullNameModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
      <StyledText style={[styles.modalTitle, { color: activeColors.text }]}>
        Пожалуйста, заполните ваше ФИО
      </StyledText>
      <TextInput
        style={[styles.input, { backgroundColor: activeColors.secondary, color: activeColors.text }]}
        placeholder="Имя"
        placeholderTextColor={activeColors.text}
        onChangeText={(text) => setFirstName(text)}
      />
      <TextInput
        style={[styles.input, { backgroundColor: activeColors.secondary, color: activeColors.text }]}
        placeholder="Фамилия"
        placeholderTextColor={activeColors.text}
        onChangeText={(text) => setLastName(text)}
      />
      <TouchableOpacity
        onPress={() => setUserFullName(firstName, lastName)}
        style={[styles.confirmButton, { backgroundColor: activeColors.accent }]}
      >
        <StyledText style={{ color: activeColors.primary, fontSize: 18 }}>
          Заполнить ФИО
        </StyledText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setIsFullNameModalVisible(false)}
        style={[styles.cancelButton, { backgroundColor: activeColors.secondary }]}
      >
        <StyledText style={{ color: activeColors.text, fontSize: 18 }}>
          Отмена
        </StyledText>
      </TouchableOpacity>
    </View>
  </View>
</Modal>




        {userInfo && (
          <View style={styles.section}>
            <SettingsItem label="ФИО">
              <StyledText>{userInfo.fullName || "Нет данных"}</StyledText>
            </SettingsItem>
            <SettingsItem label="Номер телефона">
              <StyledText>{userInfo.phoneNumber || "Нет данных"}</StyledText>
            </SettingsItem>
            <SettingsItem label="Роль:">
              <StyledText>{userRole}</StyledText>
            </SettingsItem>
          </View>
        )}

        <StyledText style={{ color: activeColors.accent }} bold>Организация</StyledText>
        {organizationInfo && (
          <View style={styles.section}>
            <SettingsItem label="Организация">
              <StyledText>{organizationInfo.organization.fullName || "Нет данных"}</StyledText>
            </SettingsItem>
            <SettingsItem label="БИН/ИИН">
              <StyledText>{organizationInfo.organization.number || "Нет данных"}</StyledText>
            </SettingsItem>
            <SettingsItem label="Дата начала подписки">
              <StyledText>{new Date(organizationInfo.dateOfCreated).toLocaleDateString()}</StyledText>
            </SettingsItem>
            <SettingsItem label="Дата окончания подписки">
              <StyledText>{new Date(organizationInfo.dateOfEnd).toLocaleDateString()}</StyledText>
            </SettingsItem>
            {userRole !== 'Директор' && (
               <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.infoButton}>
               <Ionicons name="help-circle-outline" size={24} color={activeColors.accent} />
               <StyledText style={{ color: activeColors.accent }}>Вы владелец данной организации?</StyledText>
             </TouchableOpacity>
            )}
           
          </View>
        )}
      </ScrollView>
      <View style={styles.logout}>
        <TouchableOpacity onPress={handleLogout}>
          <SettingsItem>
            <Ionicons name="log-out-outline" size={24} color="red" />
            <StyledText style={{ color: "red" }}>Выход</StyledText>
          </SettingsItem>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
            <StyledText style={[styles.modalTitle, { color: activeColors.text }]}>Подтвердите пароль</StyledText>
            <TextInput
              style={[styles.input, { backgroundColor: activeColors.secondary, color: activeColors.text }]}
              placeholder="Введите пароль"
              placeholderTextColor={activeColors.text}
              secureTextEntry
              keyboardType="numeric"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={confirmOrganizationPassword} style={[styles.confirmButton, { backgroundColor: activeColors.accent }]}>
              <StyledText style={{ color: activeColors.primary, fontSize: 18 }}>Подтвердить</StyledText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.cancelButton, { backgroundColor: activeColors.secondary }]}>
              <StyledText style={{ color: activeColors.text, fontSize: 18 }}>Отмена</StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
            <StyledText style={[styles.modalTitle, { color: activeColors.text }]}>Удаление аккаунта</StyledText>
            <StyledText style={[styles.modalMessage, { color: activeColors.text }]}>
              Вы уверены, что хотите удалить аккаунт? Это действие необратимо.
            </StyledText>
            <TouchableOpacity onPress={handleDeleteAccount} style={[styles.confirmButton, { backgroundColor: activeColors.accent }]}>
              <StyledText style={{ color: activeColors.primary, fontSize: 18 }}>Удалить</StyledText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={[styles.cancelButton, { backgroundColor: activeColors.secondary }]}>
              <StyledText style={{ color: activeColors.text, fontSize: 18 }}>Отмена</StyledText>
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
  },
  scrollContainer: {
    flex: 1,
    padding: 25,
  },
  section: {
    borderRadius: 30,
    overflow: "hidden",
    marginTop: 25,
    marginBottom: 25,
  },
  logout: {
    position: 'absolute',
    bottom: 25,
    alignSelf: 'center',
    borderRadius: 30,
    overflow: "hidden",
    marginTop: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButton: {
    marginLeft: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  passwordSection: {
    marginTop: 25,
  },
  input: {
    height: 50,
    width: '80%',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 15,
    fontSize: 18,
  },
  confirmButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginTop: 10,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 15,
  },
  infoButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 10,
  },
});

export default SettingsScreen;
