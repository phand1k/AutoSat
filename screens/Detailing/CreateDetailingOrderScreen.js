import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { colors } from '../../config/theme';
import { TextInputMask } from 'react-native-masked-text';
import * as Haptics from 'expo-haptics';

const CreateDetailingOrderScreen = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [originalBrands, setOriginalBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [originalModels, setOriginalModels] = useState([]);
  const [carNumber, setCarNumber] = useState('');
  const [comment, setComment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [prepayment, setPrepayment] = useState('');
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
  const stepAnimation = new Animated.Value(0);
  const [errors, setErrors] = useState({
    carNumber: false,
    phoneNumber: false,
  });

  useEffect(() => {
    fetchCarBrands();
  }, []);

  const animateStep = (toValue) => {
    Animated.timing(stepAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const fetchCarBrands = async () => {
    setIsLoading(true); // Включаем загрузку
    const SatApiURL = await AsyncStorage.getItem('SatApiURL');
    const cleanedSatApiURL = SatApiURL.trim();
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) {
        throw new Error('Authentication token is not available.');
      }

      const response = await fetch(`${cleanedSatApiURL}/api/car/listcar`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch car brands. HTTP status ${response.status}`);
      }

      const responseData = await response.json();
      const brandData = responseData['$values'].map((brand) => ({
        id: brand.id,
        name: brand.name,
        icon: 'car',
        models: brand.models || [],
      }));

      setBrands(brandData);
      setOriginalBrands(brandData);
    } catch (error) {
      console.error('Error fetching car brands:', error);
      Alert.alert('Error', `Failed to fetch car brands: ${error.message}`);
    }
    finally {
      setIsLoading(false); // Выключаем загрузку
    }
  };

  const fetchModelsByBrandId = async (id) => {
    setIsLoadingModels(true);
    setIsLoading(true); // Включаем загрузку
    try {
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim();
      const token = await AsyncStorage.getItem('access_token_avtosat');
      if (!token) throw new Error('Authentication token is not available.');

      const response = await fetch(`${cleanedSatApiURL}/api/modelcar/listmodelcars?id=${id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch car models');

      const responseData = await response.json();
      const modelData = responseData['$values'].map((model) => ({
        id: model.id,
        name: model.name,
      }));

      setModels(modelData);
      setOriginalModels(modelData);
    } catch (error) {
      console.error('Error fetching car models:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные.');
    } finally {
      setIsLoadingModels(false);
      setIsLoading(false); // Выключаем загрузку
    }
  };

  const createDetailingOrder = async () => {
    if (!selectedBrand || !selectedModel || !carNumber || !phoneNumber) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля.');
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
        phoneNumber: phoneNumber.replace(/[^\d]/g, ''),
        comment: comment,
        prepayment: Number(prepayment) || 0,
      };
  
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim();
      
      const response = await fetch(`${cleanedSatApiURL}/api/DetailingOrder/CreateDetailingOrder`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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
      setDetailingOrderId(orderData.id);
  
      resetState(); // Сбрасываем состояние
  
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

  const resetState = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
    setCarNumber('');
    setPhoneNumber('');
    setComment('');
    setPrepayment('');
    setStep(1);
    setFilter('');
    setBrands(originalBrands);
    setModels(originalModels);
    setIsLoading(false);
    setIsLoadingModels(false);
    setErrors({
      carNumber: false,
      phoneNumber: false,
    });
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      animateStep(step - 1);
  
      if (step === 6) {
        setPrepayment('');
      } else if (step === 5) {
        setComment('');
      } else if (step === 4) {
        setPhoneNumber('');
      } else if (step === 3) {
        setCarNumber('');
      } else if (step === 2) {
        setSelectedModel(null);
      }
    } else if (step === 1) {
      navigation.goBack();
    }
  };

  const goToNextStep = () => {
  if (step === 3 && !carNumber) {
    setErrors({ ...errors, carNumber: true });
    return;
  }
  if (step === 4 && !phoneNumber) {
    setErrors({ ...errors, phoneNumber: true });
    return;
  }
  setStep(step + 1);
  animateStep(step + 1);
};

  const handleSearch = (text) => {
    setFilter(text);
    if (text === '') {
      setBrands(originalBrands);
      setModels(originalModels);
    } else {
      if (selectedBrand === null) {
        const filteredData = originalBrands.filter((brand) =>
          brand.name.toLowerCase().includes(text.toLowerCase())
        );
        setBrands(filteredData);
      } else {
        const filteredData = originalModels.filter((model) =>
          model.name.toLowerCase().includes(text.toLowerCase())
        );
        setModels(filteredData);
      }
    }
  };

  const renderBrandItem = ({ item }) => (
    <TouchableOpacity
      disabled={isLoadingModels}
      style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}
      onPress={async () => {
        Keyboard.dismiss();
        setFilter('');
        setSelectedBrand(item);
        await fetchModelsByBrandId(item.id);
        setStep(2);
      }}
    >
      <Ionicons name={item.icon} size={24} color={activeColors.tint} />
      <Text style={[styles.text, { color: activeColors.tint }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderModelItem = ({ item }) => (
    <TouchableOpacity
      disabled={isLoadingModels}
      style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}
      onPress={() => {
        setSelectedModel(item);
        setStep(3);
      }}
    >
      <Text style={[styles.text, { color: activeColors.tint }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderStepContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color={activeColors.tint} />;
    }
    switch (step) {
      case 1:
        return (
          <>
            <TextInput
              style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
              value={filter}
              onChangeText={handleSearch}
              placeholder="Поиск по марке"
              placeholderTextColor={activeColors.tint}
              clearButtonMode="while-editing"
            />
            <FlatList
              data={brands}
              renderItem={renderBrandItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
            />
          </>
        );
      case 2:
        return isLoadingModels ? (
          <ActivityIndicator size="large" color={activeColors.tint} />
        ) : (
          <>
            <TextInput
              style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
              value={filter}
              onChangeText={handleSearch}
              placeholder="Поиск по модели"
              placeholderTextColor={activeColors.tint}
              clearButtonMode="while-editing"
            />
            <FlatList
              data={models}
              renderItem={renderModelItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
            />
          </>
        );
      case 3:
        return (
          <>
            <TextInput
              style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
              value={carNumber}
              onChangeText={setCarNumber}
              placeholder="Гос. номер"
              placeholderTextColor={activeColors.tint}
              clearButtonMode="while-editing"
              onSubmitEditing={goToNextStep}
            />
            {errors.carNumber && <Text style={styles.errorText}>Это поле обязательно для заполнения</Text>}
            <TouchableOpacity style={[styles.button, { backgroundColor: activeColors.accent }]} onPress={goToNextStep}>
              <Text style={styles.buttonText}>Далее</Text>
            </TouchableOpacity>
          </>
        );
      case 4:
        return (
          <>
            <TextInputMask
              style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
              type={'custom'}
              options={{
                mask: '+7(999)-999-99-99',
              }}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Номер телефона"
              placeholderTextColor={activeColors.tint}
              keyboardType="phone-pad"
              maxLength={17}
              clearButtonMode="while-editing"
              onSubmitEditing={goToNextStep}
            />
           {errors.phoneNumber && <Text style={styles.errorText}>Это поле обязательно для заполнения</Text>}
            <TouchableOpacity style={[styles.button, { backgroundColor: activeColors.accent }]} onPress={goToNextStep}>
              <Text style={styles.buttonText}>Далее</Text>
            </TouchableOpacity>
          </>
        );
        case 5:
          return (
            <>
              <TextInput
                style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
                value={comment}
                onChangeText={setComment}
                placeholder="Добавьте комментарий (необязательно)"
                placeholderTextColor={activeColors.tint}
                multiline
                numberOfLines={4}
                clearButtonMode="while-editing"
              />
              <TouchableOpacity style={[styles.button, { backgroundColor: activeColors.accent }]} onPress={goToNextStep}>
                <Text style={styles.buttonText}>Далее</Text>
              </TouchableOpacity>
            </>
          );
          case 6:
  return (
    <>
      <TextInput
        style={[styles.searchBox, { borderColor: activeColors.secondary, color: activeColors.tint }]}
        value={prepayment}
        onChangeText={setPrepayment}
        placeholder="Предоплата"
        placeholderTextColor={activeColors.tint}
        keyboardType="numeric"
        clearButtonMode="while-editing"
      />
      {!prepayment && <Text style={styles.infoText}>Если предоплата не указана, будет учтено как "0"</Text>}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: activeColors.accent }]}
        onPress={createDetailingOrder}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Создание...' : 'Создать заказ'}</Text>
      </TouchableOpacity>
    </>
  );
      default:
        return null;
    }
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
          <Text style={[styles.modalText, { color: activeColors.tint }]}>
            Вы уверены, что хотите закрыть создание заказа?
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: activeColors.accent }]}
              onPress={() => {
                resetState(); // Сбрасываем состояние
                setConfirmCloseVisible(false);
                navigation.goBack();
              }}
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
          <TouchableOpacity onPress={() => setConfirmCloseVisible(true)}>
            <Text style={[styles.closeText, { color: activeColors.tint }]}>Закрыть</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.stepIndicator}>
        {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
  <Animated.View
    key={stepNumber}
    style={[
      styles.step,
      {
        backgroundColor: step >= stepNumber ? activeColors.accent : activeColors.secondary,
        transform: [
          {
            scale: stepAnimation.interpolate({
              inputRange: [stepNumber - 1, stepNumber],
              outputRange: [1, 1.2],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
    ]}
  />
))}
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
        {renderStepContent()}
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
  errorText: {
    color: 'red',
    marginLeft: 10,
    marginBottom: 10,
  },
  infoText: {
    color: 'gray',
    marginLeft: 10,
    marginBottom: 10,
  },
});

export default CreateDetailingOrderScreen;