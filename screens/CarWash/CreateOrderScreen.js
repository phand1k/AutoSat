import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import { TextInputMask } from 'react-native-masked-text';

const CreateOrderScreen = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [filter, setFilter] = useState('');
  const [brands, setBrands] = useState([]);
  const [originalBrands, setOriginalBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [originalModels, setOriginalModels] = useState([]);
  const [carNumber, setCarNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCarBrands();
  }, []);

  const fetchCarBrands = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`${cleanedSatApiURL}/api/car/listcar`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch car brands. HTTP status ${response.status}`);
      }

      const responseData = await response.json();
      const brandData = responseData["$values"].map(brand => ({
        id: brand.id,
        name: brand.name,
        icon: 'car',
        models: brand.models || []
      }));

      setBrands(brandData);
      setOriginalBrands(brandData);

    } catch (error) {
      console.error('Error fetching car brands:', error);
      Alert.alert("Error", `Failed to fetch car brands: ${error.message}`);
    }
  };

  const fetchModelsByBrandId = async (id) => {
    try {
      setIsLoadingModels(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`${cleanedSatApiURL}/api/modelcar/listmodelcars?id=${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch car models');
      }

      const responseData = await response.json();
      const modelData = responseData["$values"].map(model => ({
        id: model.id,
        name: model.name,
      }));

      setModels(modelData);
      setOriginalModels(modelData);
      setIsLoadingModels(false);
    } catch (error) {
      console.error('Error fetching car models:', error);
      setIsLoadingModels(false);
      Alert.alert("Error", "Не удалось загрузить данные.");
    }
  };

  const createWashOrder = async () => {
    if (!selectedBrand || !selectedModel || !carNumber || !phoneNumber) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля.');
      return;
    }
  
    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      if (!token) {
        throw new Error('Authentication token is not available.');
      }
  
      const payload = {
        carId: selectedBrand.id,
        modelCarId: selectedModel.id,
        carNumber: carNumber,
        phoneNumber: phoneNumber.replace(/[^\d]/g, '')
      };
  
      const response = await fetch(`${cleanedSatApiURL}/api/WashOrder/createwashorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          console.error('Error data:', errorData);
          Alert.alert('Ошибка', 'Машина с таким номером уже на мойке');
          return;
        }
        if (response.status === 403) {
          Alert.alert('Истекла подписка', 'Истек срок действия подписки');
        }
        throw new Error(`Failed to create wash order. HTTP status ${response.status}`);
      }
  
      setOrderCreated(true);
      setSelectedBrand(null);
      setSelectedModel(null);
      setCarNumber('');
      setPhoneNumber('');
      setStep(1);
  
      Alert.alert('', 'Вы успешно приняли машину на мойку 🧼');
      navigation.navigate('Мойка', { refresh: true });
    } catch (error) {
      console.error('Error creating wash order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = text => {
    setFilter(text);
    if (text === '') {
      setBrands(originalBrands);
      setModels(originalModels);
    } else {
      if (selectedBrand === null) {
        const filteredData = originalBrands.filter(brand => {
          const brandMatches = brand.name.toLowerCase().includes(text.toLowerCase());
          return brandMatches;
        });
        setBrands(filteredData);
      } else {
        const filteredData = originalModels.filter(model => {
          const modelMatches = model.name.toLowerCase().includes(text.toLowerCase());
          return modelMatches;
        });
        setModels(filteredData);
      }
    }
  };

  const renderBrandItem = ({ item }) => (
    <TouchableOpacity style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]} onPress={() => {
      setSelectedBrand(item);
      fetchModelsByBrandId(item.id);
      setStep(2);
    }}>
      <Ionicons name={item.icon} size={24} color={activeColors.tint} />
      <Text style={[styles.text, { color: activeColors.tint }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderModelItem = ({ item }) => (
    <TouchableOpacity style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]} onPress={() => {
      setSelectedModel(item);
      setStep(3);
    }}>
      <Text style={[styles.text, { color: activeColors.tint }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
    if (selectedModel !== null) {
      setSelectedModel(null);
    } else if (selectedBrand !== null) {
      setSelectedBrand(null);
    }
  };

  const handleConfirmClose = () => {
    setConfirmCloseVisible(true);
  };

  const confirmCloseOrder = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setCarNumber('');
    setPhoneNumber('');
    setStep(1);
    setConfirmCloseVisible(false);
    navigation.goBack();
  };

  const renderConfirmationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={confirmCloseVisible}
      onRequestClose={() => setConfirmCloseVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
          <Text style={[styles.modalText, { color: activeColors.tint }]}>Вы уверены, что хотите закрыть без сохранения изменений?</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
              onPress={confirmCloseOrder}
            >
              <Text style={[styles.modalButtonText, { color: activeColors.primary }]}>Да</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
              onPress={() => setConfirmCloseVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: activeColors.primary }]}>Нет</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: activeColors.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {renderConfirmationModal()}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={activeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: activeColors.tint }]}>
          {selectedBrand === null
            ? 'Выберите марку'
            : selectedModel === null
            ? 'Выберите модель'
            : step === 3
            ? 'Введите гос. номер'
            : 'Номер телефона'}
        </Text>
        <TouchableOpacity onPress={handleConfirmClose}>
          <Text style={[styles.closeText, { color: activeColors.tint }]}>Закрыть</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.stepIndicator}>
        <View style={[styles.step, step >= 1 && styles.activeStep, { backgroundColor: activeColors.accent }]} />
        <View style={[styles.step, step >= 2 && styles.activeStep, { backgroundColor: activeColors.accent }]} />
        <View style={[styles.step, step >= 3 && styles.activeStep, { backgroundColor: activeColors.accent }]} />
        <View style={[styles.step, step >= 4 && styles.activeStep, { backgroundColor: activeColors.accent }]} />
      </View>
      <View style={[styles.selectionInfo, { backgroundColor: activeColors.secondary }]}>
        {selectedBrand && (
          <Text style={[styles.selectionText, { color: activeColors.tint }]}>
            Марка: {selectedBrand.name}
          </Text>
        )}
        {selectedModel && (
          <Text style={[styles.selectionText, { color: activeColors.tint }]}>
            Модель: {selectedModel.name}
          </Text>
        )}
        {carNumber && (
          <Text style={[styles.selectionText, { color: activeColors.tint }]}>
            Гос. номер: {carNumber}
          </Text>
        )}
        {phoneNumber && (
          <Text style={[styles.selectionText, { color: activeColors.tint }]}>
            Телефон: {phoneNumber}
          </Text>
        )}
      </View>
      {selectedModel === null && (
        <TextInput
          style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
          value={filter}
          onChangeText={handleSearch}
          placeholder={selectedBrand === null ? 'Поиск по марке' : 'Поиск по модели'}
          placeholderTextColor={activeColors.tint}
          clearButtonMode="while-editing"
        />
      )}
      {selectedBrand === null && (
        <FlatList
          data={brands}
          renderItem={renderBrandItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
        />
      )}
      {selectedBrand !== null && selectedModel === null && (
        isLoadingModels ? (
          <ActivityIndicator size="large" color={activeColors.tint} />
        ) : (
          <FlatList
            data={models}
            renderItem={renderModelItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
          />
        )
      )}
      {selectedModel !== null && step === 3 && (
        <>
          <TextInput
            style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
            value={carNumber}
            onChangeText={setCarNumber}
            placeholder="Гос. номер"
            placeholderTextColor={activeColors.tint}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: activeColors.accent }]} onPress={() => setStep(4)}>
            <Text style={styles.buttonText}>Далее</Text>
          </TouchableOpacity>
        </>
      )}
      {step === 4 && (
        <>
          <TextInputMask
            type={'custom'}
            options={{ mask: '+7 (999) 999-99-99' }}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
            keyboardType="numeric"
            placeholder="Номер телефона клиента"
            placeholderTextColor={activeColors.tint}
            maxLength={18}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity style={[styles.button, { backgroundColor: activeColors.accent }]} onPress={createWashOrder} disabled={isSubmitting}>
            <Text style={styles.buttonText}>{isSubmitting ? 'Создание...' : 'Создать заказ'}</Text>
          </TouchableOpacity>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeText: {
    fontSize: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  step: {
    width: 50,
    height: 5,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
    borderRadius: 2.5,
  },
  activeStep: {
    backgroundColor: '#000',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#cccccc',
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    fontSize: 18,
    marginLeft: 10,
  },
  searchBox: {
    fontSize: 20,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  successMessage: {
    padding: 10,
    textAlign: 'center',
    margin: 10,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
  },
  selectionInfo: {
    padding: 0.000001,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateOrderScreen;
