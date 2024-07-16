import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView, Platform, KeyboardAvoidingView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from "../context/ThemeContext";
import { colors } from "../config/theme";
import CustomButton from "../components/CustomButton";

const AddServiceScreen = ({ route }) => {
  const { order } = route.params;
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const navigation = useNavigation();

  const [service, setService] = useState('');
  const [price, setPrice] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const servicesList = ['Мойка кузова', 'Полировка', 'Химчистка салона'];

  const handleServiceChange = (text) => {
    setService(text);
    if (text) {
      const filteredSuggestions = servicesList.filter(service => 
        service.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleAddService = () => {
    // Логика добавления услуги
  };

  const handleSuggestionPress = (suggestion) => {
    setService(suggestion);
    setSuggestions([]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: activeColors.primary }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={activeColors.tint} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: activeColors.tint }]}>Добавить Услугу</Text>

          <View style={styles.orderInfoContainer}>
            <Text style={[styles.label, { color: activeColors.tint }]}>Номер заказ-наряда: {order.name}</Text>
            <Text style={[styles.label, { color: activeColors.tint }]}>Марка машины: {order.brand}</Text>
            <Text style={[styles.label, { color: activeColors.tint }]}>Модель: {order.model}</Text>
            <Text style={[styles.label, { color: activeColors.tint }]}>Гос номер: {order.licensePlate}</Text>
          </View>

          <TextInput
            style={[styles.input, { borderColor: activeColors.secondary, color: activeColors.tint }]}
            placeholder="Выберите услугу"
            placeholderTextColor="#aaaaaa"
            value={service}
            onChangeText={handleServiceChange}
          />
          {suggestions.length > 0 && (
            <View style={[styles.suggestionsContainer, { borderColor: activeColors.secondary }]}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSuggestionPress(suggestion)}
                  style={styles.suggestionItem}
                >
                  <Text style={{ color: activeColors.tint }}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <TextInput
            style={[styles.input, { borderColor: activeColors.secondary, color: activeColors.tint }]}
            placeholder="Введите цену"
            placeholderTextColor="#aaaaaa"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <CustomButton label={"Добавить услугу"} onPress={handleAddService} />

          <View style={styles.additionalInfoContainer}>
            <Text style={[styles.additionalInfoTitle, { color: activeColors.tint }]}>Популярные услуги</Text>
            <FlatList
              data={servicesList}
              renderItem={({ item }) => (
                <Text style={[styles.additionalInfoItem, { color: activeColors.tint }]}>{item}</Text>
              )}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ padding: 10 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    marginBottom: 30,
    textAlign: 'center',
  },
  orderInfoContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginVertical: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 10,
  },
  suggestionItem: {
    padding: 10,
  },
  additionalInfoContainer: {
    marginTop: 30,
  },
  additionalInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  additionalInfoItem: {
    fontSize: 16,
    padding: 5,
  },
});

export default AddServiceScreen;
