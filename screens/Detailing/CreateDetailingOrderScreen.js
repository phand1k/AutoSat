import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Keyboard, TouchableWithoutFeedback, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import { TextInputMask } from 'react-native-masked-text'; // Необходимо установить пакет react-native-masked-text
import * as Haptics from 'expo-haptics';
const CreateDetailingOrderScreen = () => {
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
  const [comment, setComment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState(1);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [priceList, setPriceList] = useState([]);
  const [customPrice, setCustomPrice] = useState('');
  const [detailingOrderId, setDetailingOrderId] = useState(null);

  useEffect(() => {
    fetchCarBrands();
  }, []);

  const fetchCarBrands = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/car/listcar', {
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
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/modelcar/listmodelcars?id=${id}`, {
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
  const assignServiceToOrder = async () => {
    if (!selectedService || (!selectedPrice && customPrice === '') || !comment) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля для назначения услуги.');
      return;
    }

    const finalPrice = selectedPrice ? selectedPrice.price : Number(customPrice);

    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const payload = {
        serviceId: selectedService.id,
        detailingOrderId: detailingOrderId,
        price: finalPrice,
        salary: finalPrice * 0.3, // Предположим, что зарплата - это 30% от цены
        comment: comment
      };

      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/DetailingService/CreateDetailingService', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        throw new Error(`Failed to assign service. HTTP status ${response.status}`);
      }

      Alert.alert('', 'Услуга успешно назначена');
      setIsServiceModalVisible(false);
      navigation.navigate('Список', { refresh: true });
    } catch (error) {
      console.error('Error assigning service to order:', error);
      Alert.alert('Ошибка', 'Не удалось назначить услугу.');
    }
  };
  const createDetailingOrder = async () => {
    if (!selectedBrand || !selectedModel || !carNumber || !phoneNumber || !comment) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля.');
      return;
    }
  
    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }
  
      const payload = {
        carId: selectedBrand.id,
        modelCarId: selectedModel.id,
        carNumber: carNumber,
        phoneNumber: phoneNumber.replace(/[^\d]/g, ''), // Убираем маску перед отправкой на сервер
        comment: comment,
      };
  
      const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/DetailingOrder/CreateDetailingOrder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        throw new Error(`Failed to create detailing order. HTTP status ${response.status}`);
      }
  
      const orderData = await response.json();
      setDetailingOrderId(orderData.id); // Получаем ID созданного заказ-наряда
  
      // Сброс состояния после успешного создания
      resetState();
  
      // Перенаправляем на AssignServiceScreen и передаем данные о заказе
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Создано✅', 'Заказ-наряд успешно создан, теперь назначьте услуги');
      navigation.navigate('AssignService', { selectedOrder: orderData });
    } catch (error) {
      console.error('Error creating detailing order:', error);
      Alert.alert('Ошибка', 'Не удалось создать заказ.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Функция для сброса состояния
  const resetState = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setCarNumber('');
    setPhoneNumber('');
    setComment('');
    setStep(1); // Возврат к первому шагу
  };
  

  const handleSearch = (text) => {
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
  <TouchableOpacity
    disabled={isLoadingModels} // Блокируем повторное нажатие, пока идет загрузка моделей
    style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}
    onPress={() => {
      setSelectedBrand(item);  // Сразу устанавливаем выбранный бренд
      fetchModelsByBrandId(item.id);  // Загружаем модели для выбранного бренда
      setStep(2);  // Переход на следующий шаг
    }}
  >
    <Ionicons name={item.icon} size={24} color={activeColors.tint} />
    <Text style={[styles.text, { color: activeColors.tint }]}>{item.name}</Text>
  </TouchableOpacity>
);

const renderModelItem = ({ item }) => (
  <TouchableOpacity
    disabled={isLoadingModels} // Блокируем повторное нажатие, пока идет загрузка
    style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}
    onPress={() => {
      setSelectedModel(item);  // Устанавливаем выбранную модель
      setStep(3);  // Переход на следующий шаг
    }}
  >
    <Text style={[styles.text, { color: activeColors.tint }]}>{item.name}</Text>
  </TouchableOpacity>
);


  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1); // Уменьшаем шаг
  
      // Очищаем значение, если возвращаемся на шаг с вводом этого значения
      if (step === 5) {
        setComment(''); // Очищаем комментарий, если возвращаемся на шаг с вводом комментария
      } else if (step === 4) {
        setPhoneNumber(''); // Очищаем номер телефона
      } else if (step === 3) {
        setCarNumber(''); // Очищаем гос. номер авто
      } else if (step === 2) {
        setSelectedModel(null); // Возвращаемся к выбору модели, очищаем модель
      }
    } else if (step === 1) {
      // Если мы на первом шаге (выбор марки), просто закрываем экран
      navigation.goBack();
    }
  };
  const goToNextStep = () => {
    if (step === 3 && !carNumber) {
      Alert.alert('Ошибка', 'Пожалуйста, введите гос. номер автомобиля.');
      return;
    }
  
    if (step === 4 && !phoneNumber) {
      Alert.alert('Ошибка', 'Пожалуйста, введите номер телефона.');
      return;
    }
  
    setStep(step + 1); // Переход на следующий шаг
  };
  

  const handleConfirmClose = () => {
    setConfirmCloseVisible(true);
  };

  const confirmCloseOrder = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setCarNumber('');
    setPhoneNumber('');
    setComment('');
    setStep(1);
    setConfirmCloseVisible(false);
    navigation.goBack();
  };

  const renderServiceModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isServiceModalVisible}
      onRequestClose={() => setIsServiceModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
          <Text style={[styles.modalText, { color: activeColors.tint }]}>Назначить услугу для заказ-наряда</Text>
          
          {services.length > 0 ? (
            <FlatList
              key={services.length}
              data={services}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}
                  onPress={() => {
                    setSelectedService(item);
                    fetchPriceListForService(item.id, selectedBrand.id, selectedModel.id);
                  }}
                >
                  <Text style={[styles.text, { color: activeColors.tint }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              style={[styles.list, { flex: 1 }]} // добавьте flex: 1 или фиксированную высоту
            />
          ) : (
            <Text style={[styles.modalText, { color: activeColors.tint }]}>Список услуг пуст</Text>
          )}

          {selectedService && (
            <>
              <Text style={[styles.modalText, { color: activeColors.tint }]}>Выберите цену или введите свою:</Text>
              <FlatList
                key={priceList.length}
                data={priceList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}
                    onPress={() => setSelectedPrice(item)}
                  >
                    <Text style={[styles.text, { color: activeColors.tint }]}>{item.price} KZT</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                style={styles.list}
              />
              <TextInput
                style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
                value={customPrice}
                onChangeText={setCustomPrice}
                placeholder="Своя цена"
                placeholderTextColor={activeColors.tint}
                keyboardType="numeric"
              />
            </>
          )}
  
          <TouchableOpacity
            style={[styles.button, { backgroundColor: activeColors.accent }]}
            onPress={assignServiceToOrder}
          >
            <Text style={styles.buttonText}>Назначить услугу</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: activeColors.secondary }]}
            onPress={() => setIsServiceModalVisible(false)}
          >
            <Text style={styles.buttonText}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderConfirmationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={confirmCloseVisible}
      onRequestClose={() => setConfirmCloseVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
          <Text style={[styles.modalText, { color: activeColors.tint }]}>Вы уверены, что хотите закрыть создание заказа?</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
              onPress={confirmCloseOrder}
            >
              <Text style={[styles.modalButtonText, { color: activeColors.tint }]}>Да</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: activeColors.secondary }]}
              onPress={() => setConfirmCloseVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: activeColors.tint }]}>Нет</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: activeColors.primary }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderServiceModal()}
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
              : step === 4
              ? 'Введите номер телефона'
              : 'Добавьте комментарий'}
          </Text>
          <TouchableOpacity onPress={handleConfirmClose}>
            <Text style={[styles.closeText, { color: activeColors.tint }]}>Закрыть</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.stepIndicator}>
  <View style={[styles.step, { backgroundColor: step >= 1 ? activeColors.accent : activeColors.secondary }]} />
  <View style={[styles.step, { backgroundColor: step >= 2 ? activeColors.accent : activeColors.secondary }]} />
  <View style={[styles.step, { backgroundColor: step >= 3 ? activeColors.accent : activeColors.secondary }]} />
  <View style={[styles.step, { backgroundColor: step >= 4 ? activeColors.accent : activeColors.secondary }]} />
  <View style={[styles.step, { backgroundColor: step >= 5 ? activeColors.accent : activeColors.secondary }]} />
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
        {step === 3 && (
  <>
    <TextInput
      style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
      value={carNumber}
      onChangeText={setCarNumber}
      placeholder="Гос. номер"
      placeholderTextColor={activeColors.tint}
      clearButtonMode="while-editing"
    />
    <TouchableOpacity style={[styles.button, { backgroundColor: activeColors.accent }]} onPress={goToNextStep}>
      <Text style={styles.buttonText}>Далее</Text>
    </TouchableOpacity>
  </>
)}

{step === 4 && (
  <>
    <TextInputMask
      style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
      type={'custom'}
      options={{
        mask: '+7(999)-999-99-99'
      }}
      value={phoneNumber}
      onChangeText={setPhoneNumber}
      placeholder="Номер телефона"
      placeholderTextColor={activeColors.tint}
      keyboardType="phone-pad"
      clearButtonMode="while-editing"
    />
    <TouchableOpacity style={[styles.button, { backgroundColor: activeColors.accent }]} onPress={goToNextStep}>
      <Text style={styles.buttonText}>Далее</Text>
    </TouchableOpacity>
  </>
)}

{step === 5 && (
  <>
    <TextInput
      style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
      value={comment}
      onChangeText={setComment}
      placeholder="Добавьте комментарий"
      placeholderTextColor={activeColors.tint}
      multiline
      numberOfLines={4}
      clearButtonMode="while-editing"
    />
    <TouchableOpacity style={[styles.button, { backgroundColor: activeColors.accent }]} onPress={createDetailingOrder} disabled={isSubmitting}>
      <Text style={styles.buttonText}>{isSubmitting ? 'Создание...' : 'Создать заказ'}</Text>
    </TouchableOpacity>
  </>
)}

      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
    flex: 1, // Убедитесь, что FlatList занимает все доступное пространство
    maxHeight: '100%', // Ограничьте высоту FlatList в пределах модального окна
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
      width: 0, height: 2,
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
    padding: 10,
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

export default CreateDetailingOrderScreen;
