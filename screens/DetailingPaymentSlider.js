import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Animated, PanResponder, ActivityIndicator, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const DetailingPaymentSlider = ({ onComplete, onSwipeLeft, onSwipeRight, selectedOrder }) => {
  const sliderWidth = useRef(new Animated.Value(0)).current;
  const [sliderActivated, setSliderActivated] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [comment, setComment] = useState('');
  const [cashAmountScreenVisible, setCashAmountScreenVisible] = useState(false);
  const [exceedsAmount, setExceedsAmount] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [totalToPay, setTotalToPay] = useState(0);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const navigation = useNavigation();
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token_avtosat');
        const SatApiURL = await AsyncStorage.getItem('SatApiURL');
        const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
        if (!token) {
          throw new Error('Authentication token is not available.');
        }

        const response = await fetch(`${cleanedSatApiURL}/api/payment/GetAllPaymentMethods`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch payment methods. HTTP status ${response.status}`);
        }

        const responseData = await response.json();
        setPaymentMethods(responseData.$values);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        Alert.alert('Error', `Failed to fetch payment methods: ${error.message}`);
      }
    };

    fetchPaymentMethods();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        if (gestureState.dx > 0) {
          sliderWidth.setValue(gestureState.dx);
        } else if (gestureState.dx < 0) {
          sliderWidth.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (event, gestureState) => {
        if (gestureState.dx > 100) {
          setSliderActivated(true);
          handleCompleteOrder();
        } else if (gestureState.dx < -100) {
          setSliderActivated(true);
          setDeleteConfirmationVisible(true);
        } else {
          Animated.spring(sliderWidth, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;



  const fetchOrderTotalWithPrepayment = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      
      const response = await fetch(`${cleanedSatApiURL}/api/DetailingOrder/GetSummOfDetailingWithPrepaymentServicesOnOrder?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const sum = await response.json();
      return sum;
    } catch (error) {
      console.error(error);
      return null;
    }
  };


  const fetchOrderTotal = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const SatApiURL = await AsyncStorage.getItem('SatApiURL');
      const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

      
      const response = await fetch(`${cleanedSatApiURL}/api/DetailingOrder/GetSummOfDetailingServicesOnOrder?id=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const sum = await response.json();
      return sum;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleCompleteOrder = async () => {
    try {
      const sum = await fetchOrderTotalWithPrepayment(selectedOrder.id);
      if (sum <= 0) {
        Alert.alert('Ошибка', 'Нельзя завершить заказ-наряд, если не назначены услуги');
        resetSlider();
      } else {
        setTotalToPay(sum);
        setPaymentModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching order total:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при получении суммы услуг');
      resetSlider();
    }
  };

  const confirmCompletion = async () => {
    const token = await AsyncStorage.getItem('access_token_avtosat');
    const SatApiURL = await AsyncStorage.getItem('SatApiURL');
     const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки
    try {
      const response = await fetch(`${cleanedSatApiURL}/api/DetailingOrder/CompleteDetailingOrder?id=${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log(response.message);
        throw new Error(`Failed to complete order. HTTP status ${response.status}`);
      }

      onComplete();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Завершено✅', 'Заказ-наряд успешно завершен');
      navigation.navigate('Заказы', { refresh: true });
    } catch (error) {
      console.error('Error completing order:', error);
      Alert.alert('Error', `Failed to complete order: ${error.message}`);
    }
  };

  const confirmDeletion = () => {
    Animated.timing(sliderWidth, {
      toValue: -300,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onSwipeLeft();
      resetSlider();
    });
  };

  const handleRightSwipe = () => {
    if (onSwipeRight) {
      onSwipeRight();
    }
    resetSlider();
  };

  const resetSlider = () => {
    setSliderActivated(false);
    sliderWidth.setValue(0);
  };

  const togglePaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
    if (method === 'Наличный') {
      setPaymentModalVisible(false);
      setCashAmountScreenVisible(true);
    } else if (method === 'Смешанная оплата') {
      setPaymentModalVisible(false);
      setCashAmountScreenVisible(true);
    }
  };
  const handleAmountChange = (method, amount) => {
    console.log(amount);
    const parsedAmount = amount || 0;  // Парсим введённое значение в число
  
    setPaymentAmounts((prevAmounts) => ({
      ...prevAmounts,
      [method]: parsedAmount,  // Используем парсенное значение
    }));
  
    // Проверяем, превышает ли сумма наличных общую сумму для смешанной оплаты
    if (selectedPaymentMethod === 'Смешанная оплата') {
      if (parsedAmount >= totalToPay) {
        setExceedsAmount(true);
      } else {
        setExceedsAmount(false);
      }
    }
  };

  const handleMixedPaymentValidation = () => {
    console.log(paymentAmounts['Наличный'])
    const cashAmount = paymentAmounts['Наличный'] || 0;  // Парсим сумму наличными
    if (cashAmount >= totalToPay) {
      Alert.alert(
        'Предупреждение',
        'Сумма наличными превышает или равна общей сумме услуг. Вся сумма будет учтена как наличная оплата.'
      );
      return true;
    }
    return false;
  };

  const handleConfirmPayment = async () => {
    if (isPaymentProcessing) {
      return; // предотвращаем множественные нажатия
    }
  
    setIsPaymentProcessing(true); // начинаем загрузку
  
    const token = await AsyncStorage.getItem('access_token_avtosat');
    const paymentMethodId = paymentMethods.find((method) => method.name === selectedPaymentMethod)?.id;
  
    // Логика для обработки суммы наличных
    console.log(paymentAmounts['Наличный'])
    const toPayAmount = totalToPay || 0;
    const cashAmount = paymentAmounts['Наличный'] || 0;  // Парсим сумму наличными
    const totalSummWithOutPrepayment = await fetchOrderTotal(selectedOrder.id);
  
    // Формируем тело запроса
    let body = {
      paymentMethodId,
      summ: totalSummWithOutPrepayment,  // Всегда передаем общую сумму услуг
      toPay: toPayAmount,  // Сумма, введенная наличными
    };

    
    const SatApiURL = await AsyncStorage.getItem('SatApiURL');
    const cleanedSatApiURL = SatApiURL.trim(); // Удаляем лишние пробелы и символы новой строки

    try {
      const response = await fetch(`${cleanedSatApiURL}/api/Transaction/CreateDetailingTransaction?detailingOrderId=${selectedOrder.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),  // Отправляем тело запроса
      });
  
      if (!response.ok) {
        // Проверка на ошибки с подробной информацией
        const errorData = await response.json();
        throw new Error(`Ошибка при создании транзакции: ${errorData.message || 'Неизвестная ошибка'}`);
      }
  
      await confirmCompletion();
      Alert.alert('Создано✅', 'Транзакция успешно создана');
      setPaymentModalVisible(false);
      handleRightSwipe();
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert('Ошибка', `Произошла ошибка: ${error.message}`);
    } finally {
      setIsPaymentProcessing(false); // Заканчиваем загрузку
    }
  };
  

  const handleCashAmountConfirm = async () => {
    const cashAmount = paymentAmounts['Наличный'] || 0;
  
    try {
      if (selectedPaymentMethod === 'Наличный' && cashAmount < totalToPay) {
        throw new Error('Сумма наличными не может быть меньше общей суммы услуг.');
      }
  
      if (selectedPaymentMethod === 'Смешанная оплата' && exceedsAmount) {
        // Вызов диалогового окна с подтверждением
        Alert.alert(
          'Предупреждение',
          'Сумма наличными превышает общую сумму услуг. Вся сумма будет учтена как наличная оплата. Вы уверены?',
          [
            {
              text: 'Отмена',
              onPress: () => {
                resetSlider();
              },
              style: 'cancel',
            },
            {
              text: 'Подтвердить',
              onPress: () => {
                setExceedsAmount(false);
                handleConfirmPayment();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        handleConfirmPayment();
      }
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    }
  };
  

  const closeModal = () => {
    setConfirmationVisible(false);
    setDeleteConfirmationVisible(false);
    setPaymentModalVisible(false);
    setCashAmountScreenVisible(false);
    resetSlider();
  };

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderText}>Свайп для завершения/удаления</Text>
      <View style={styles.track} />
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            transform: [{ translateX: sliderWidth }],
          },
        ]}
      >
        <Text style={styles.thumbText}>→</Text>
      </Animated.View>

      {/* Modal for Payment Methods */}
      <Modal
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={closeModal}
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Close Button in the top-right corner */}
                <TouchableOpacity onPress={closeModal} style={styles.closeIconContainer}>
                  <Ionicons name="close" size={30} color="#007aff" />
                </TouchableOpacity>

                <Text style={styles.modalTitle}>Выбор способа оплаты</Text>
                {selectedOrder && (
                  <>
                    <Text style={styles.totalAmountText}>К оплате: {totalToPay} тг</Text>
                  </>
                )}
                <View style={styles.paymentMethodsContainer}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethodCard,
                        selectedPaymentMethod === method.name && styles.paymentMethodCardSelected,
                      ]}
                      onPress={() => togglePaymentMethod(method.name)}
                    >
                      <Ionicons name={method.icon} size={28} color={selectedPaymentMethod === method.name ? '#fff' : '#007aff'} />
                      <Text style={[
                        styles.paymentMethodText,
                        selectedPaymentMethod === method.name && styles.paymentMethodTextSelected,
                      ]}>{method.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedPaymentMethod === 'Безналичный' && (
                  <>
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={handleConfirmPayment}
                      disabled={isPaymentProcessing} // блокируем кнопку, пока идет запрос
                    >
                      {isPaymentProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.payButtonText}>Оплатить {totalToPay} тг</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal for Cash Amount Entry */}
      <Modal
        transparent={true}
        visible={cashAmountScreenVisible}
        onRequestClose={closeModal}
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Введите сумму наличными</Text>
                <TextInput
                  style={styles.inputLarge}  // Изменён стиль для больших цифр
                  placeholder="Введите сумму наличными"
                  keyboardType="numeric"
                  value={paymentAmounts['Наличный']}
                  onChangeText={(value) => handleAmountChange('Наличный', value)}
                />
                {selectedPaymentMethod === 'Смешанная оплата' && (
                  <Text style={styles.infoText}>
                    Остальная сумма будет списана как безналичная.
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleCashAmountConfirm}
                >
                  <Text style={styles.confirmButtonText}>Подтвердить</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sliderText: {
    position: 'absolute',
    top: 10,
    fontSize: 16,
    color: '#007aff',
  },
  track: {
    width: '100%',
    height: 30,
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    position: 'absolute',
  },
  thumb: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: '#007aff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  closeIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  orderInfo: {
    width: '100%',
    marginBottom: 10,
  },
  totalAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007aff',
    marginBottom: 10,
  },
  paymentMethodsContainer: {
    width: '100%',
    marginBottom: 10,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007aff',
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  paymentMethodCardSelected: {
    backgroundColor: '#007aff',
  },
  paymentMethodText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007aff',
  },
  paymentMethodTextSelected: {
    color: '#fff',
  },
  payButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#007aff',
    borderRadius: 5,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#007aff',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#007aff',
    borderRadius: 5,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
  },
  inputLarge: {
    width: '100%',
    height: 60,  // Увеличиваем высоту поля ввода
    fontSize: 30,  // Увеличиваем шрифт для отображения крупных цифр
    borderColor: '#007aff',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    textAlign: 'center',
  }
});

export default DetailingPaymentSlider;
