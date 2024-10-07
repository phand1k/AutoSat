import React, { useState, useContext, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Button, Dialog, Portal, Provider, Card } from 'react-native-paper';
import { colors } from "../config/theme";
import { ThemeContext } from "../context/ThemeContext";
import CustomButton from "../components/CustomButton";
import NetInfo from "@react-native-community/netinfo";

const RegisterOrganizationScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [number, setOrganizationNumber] = useState('');
  const [name, setNameOrganization] = useState('');
  const [fullName, setFullNameOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizationTypes, setOrganizationTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchOrganizationTypes = async () => {
      try {
        const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Organization/TypeOfOrganizationsList');
        const data = await response.json();
        setOrganizationTypes(data.$values);
      } catch (error) {
        console.error('Error fetching organization types:', error);
      }
    };

    fetchOrganizationTypes();
  }, []);

  const handleRegister = async () => {
    const connectionState = await NetInfo.fetch();
    if (!connectionState.isConnected) {
      Alert.alert("Ошибка", "Нет интернет-соединения");
      return;
    }

    if (!number || !name || !fullName || !password || !selectedType) {
      Alert.alert("Ошибка", "Заполните все поля корректно");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/Organization/CreateOrganization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number,
          fullName,
          name,
          password,
          typeOfOrganizationId: selectedType,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert("Ошибка", "БИН/ИИН организации некорректный или организация не зарегистрирована");
        } else if (response.status === 400) {
          Alert.alert("Ошибка", "Организация с указаным БИН/ИИН уже существует");
        } else {
          Alert.alert("Ошибка", "Ошибка при регистрации");
        }
        setLoading(false);
        return;
      }

      Alert.alert("Успех", "Регистрация организации прошла успешно");
      navigation.navigate('Register');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert("Ошибка", "Произошла ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleModalSubmit = () => {
    closeModal();
  };

  return (
    <Provider>
      <SafeAreaView
        style={{
          backgroundColor: activeColors.primary,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ paddingHorizontal: 25, marginTop: 50 }}
        >
          <View style={{ alignItems: "center" }}>
            <Image
              source={require("../images/login.png")}
              style={{
                height: 200,
                width: 200,
                transform: [{ rotate: "-5deg" }],
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: "500",
              color: activeColors.tint,
              marginBottom: 30,
            }}
          >
            Регистрация организации
          </Text>

          <TextInput
            style={{
              borderBottomWidth: 1,
              borderBottomColor: activeColors.secondary,
              marginBottom: 20,
              fontSize: 16,
              color: activeColors.tint,
              paddingBottom: 10,
            }}
            placeholder="БИН/ИИН организации"
            placeholderTextColor="#aaaaaa"
            keyboardType="numeric"
            onChangeText={setOrganizationNumber}
            value={number}
          />

          <TextInput
            style={{
              borderBottomWidth: 1,
              borderBottomColor: activeColors.secondary,
              marginBottom: 20,
              fontSize: 16,
              color: activeColors.tint,
              paddingBottom: 10,
            }}
            placeholder="Название организации"
            placeholderTextColor="#aaaaaa"
            onChangeText={setNameOrganization}
            value={name}
          />

          <TextInput
            style={{
              borderBottomWidth: 1,
              borderBottomColor: activeColors.secondary,
              marginBottom: 20,
              fontSize: 16,
              color: activeColors.tint,
              paddingBottom: 10,
            }}
            placeholder="Полное наименование организации"
            placeholderTextColor="#aaaaaa"
            onChangeText={setFullNameOrganization}
            value={fullName}
          />

          <TextInput
            style={{
              borderBottomWidth: 1,
              borderBottomColor: activeColors.secondary,
              marginBottom: 20,
              fontSize: 16,
              color: activeColors.tint,
              paddingBottom: 10,
            }}
            placeholder="Пароль для организации"
            placeholderTextColor="#aaaaaa"
            onChangeText={setPassword}
            maxLength={4}
            keyboardType="numeric"
            value={password}
          />

          <Button
            mode="contained"
            onPress={openModal}
            style={{ marginBottom: 20, backgroundColor: activeColors.accent }}
          >
            Выберите тип организации
          </Button>

          {loading ? (
            <ActivityIndicator size="large" color={activeColors.tint} />
          ) : (
            <CustomButton label={"Регистрация"} onPress={handleRegister} />
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: 30,
            }}
          >
            <Text style={{ color: activeColors.tint }}>Уже зарегистрированы? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: activeColors.accent, fontWeight: "700" }}>
                {" "}
                Войти
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Portal>
          <Dialog visible={modalVisible} onDismiss={closeModal}>
            <Dialog.Title>Выберите тип организации</Dialog.Title>
            <Dialog.Content>
              {organizationTypes.map((type) => (
                <TouchableOpacity key={type.id} onPress={() => setSelectedType(type.id)}>
                  <Card style={{
                    marginBottom: 10,
                    backgroundColor: selectedType === type.id ? activeColors.accent : activeColors.primary,
                    borderWidth: 1,
                    borderColor: selectedType === type.id ? activeColors.secondary : activeColors.primary,
                  }}>
                    <Card.Content>
                      <Text style={{ color: activeColors.tint }}>{type.name}</Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeModal}>Отмена</Button>
              <Button onPress={handleModalSubmit}>ОК</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </Provider>
  );
};

export default RegisterOrganizationScreen;
