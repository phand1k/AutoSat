import React, { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const InviteUserScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = route.params;

  const handleRegister = async () => {
    try {
      const response = await fetch('https://yourapi.com/api/Account/Register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          phoneNumber,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Error registering user');
      }

      Alert.alert("Успех", "Регистрация прошла успешно");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Ошибка", error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Номер телефона"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />
      <TextInput
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />
      <Button title="Зарегистрироваться" onPress={handleRegister} />
    </View>
  );
};

export default InviteUserScreen;
