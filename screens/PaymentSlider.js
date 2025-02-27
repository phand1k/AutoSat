import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getEnvVars from './config';

const PaymentSlider = ({ onComplete, onSwipeLeft, onSwipeRight, selectedOrder }) => {
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
  const { apiUrl } = getEnvVars();

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token_avtosat');
        if (!token) {
          throw new Error('Authentication token is not available.');
        }

        const response = await fetch(`${apiUrl}/api/payment/GetAllPaymentMethods`, {
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

  const fetchOrderTotal = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`${apiUrl}/api/WashOrder/GetSummOfWashServicesOnOrder?id=${orderId}`, {
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
      const sum = await fetchOrderTotal(selectedOrder.id);
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
    try {
      const response = await fetch(`${apiUrl}/api/WashOrder/CompleteWashOrder?id=${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to complete order. HTTP status ${response.status}`);
      }

      onComplete();
      Alert.alert('Завершено✅', 'Заказ-наряд успешно завершен');
      resetSlider();
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
    if (method === 'Наличный' || method === 'Смешанная оплата') {
      setPaymentModalVisible(false);
      setCashAmountScreenVisible(true);
    }
  };

  const handleAmountChange = (method, amount) => {
    setPaymentAmounts((prevAmounts) => ({
      ...prevAmounts,
      [method]: amount,
    }));
    if (selectedPaymentMethod === 'Смешанная оплата' && amount > totalToPay) {
      setExceedsAmount(true);
    } else {
      setExceedsAmount(false);
    }
  };

  const handleMixedPaymentValidation = () => {
    const cashAmount = paymentAmounts['Наличный'] || 0;
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
    const token = await AsyncStorage.getItem('access_token_avtosat');
    const paymentMethodId = paymentMethods.find((method) => method.name === selectedPaymentMethod)?.id;
    console.log(paymentAmounts[selectedPaymentMethod])
    const amount = paymentAmounts[selectedPaymentMethod] || totalToPay;

    try {
      const response = await fetch(`${apiUrl}/api/Transaction/CreateWashOrderTransactionAsync?washOrderId=${selectedOrder.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
          summ: amount,
          topay: totalToPay,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка при создании транзакции. Похоже, что заказ-наряд уже кто-то завершил 👀`);
        closeModal();
      }

      await confirmCompletion();

      Alert.alert('Создано✅', 'Транзакция успешно создана');
      setPaymentModalVisible(false);
      handleRightSwipe();
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert('Ошибка', ` ${error.message}`);
    }
  };

  const handleCashAmountConfirm = async () => {
    if (selectedPaymentMethod === 'Смешанная оплата' && exceedsAmount) {
      Alert.alert(
        'Предупреждение',
        'Сумма наличными превышает общую сумму услуг. Вы уверены?',
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
              console.log(paymentAmounts['Наличный'])
              const cashAmount = paymentAmounts['Наличный'] || 0;
              const change = cashAmount - totalToPay;
              Alert.alert('Сдача', `Ваша сдача: ${change} тг`);
              setCashAmountScreenVisible(false);
              handleConfirmPayment();
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      setCashAmountScreenVisible(false);
      handleConfirmPayment();
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

      <Modal
        transparent={true}
        visible={confirmationVisible}
        onRequestClose={closeModal}
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Подтверждение завершения</Text>
                <Text style={styles.modalMessage}>
                  Вы уверены, что хотите завершить заказ-наряд? Если на заказ-наряде есть незавершенные услуги, то эти услуги завершатся и зарплата мастерам начислится автоматически.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setConfirmationVisible(false);
                      confirmCompletion();
                    }}
                  >
                    <Text style={styles.buttonText}>Да</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeModal}
                  >
                    <Text style={styles.buttonText}>Нет</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <Text style={styles.closeButtonText}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        transparent={true}
        visible={deleteConfirmationVisible}
        onRequestClose={closeModal}
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Подтверждение удаления</Text>
                <Text style={styles.modalMessage}>
                  Вы уверены, что хотите удалить заказ-наряд? Все назначенные услуги на заказ-наряд будут удалены и зарплата мастеров так же будет удалена.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setDeleteConfirmationVisible(false);
                      confirmDeletion();
                    }}
                  >
                    <Text style={styles.buttonText}>Да</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeModal}
                  >
                    <Text style={styles.buttonText}>Нет</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <Text style={styles.closeButtonText}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
                <Text style={styles.modalTitle}>Выбор способа оплаты</Text>
                {selectedOrder && (
                  <>
                    <View style={styles.orderInfo}>
                      <Text style={styles.modalMessage}>Гос номер: {selectedOrder.licensePlate}</Text>
                      <Text style={styles.modalMessage}>Марка: {selectedOrder.brand} {selectedOrder.model}</Text>
                    </View>
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
                    >
                      <Text style={styles.payButtonText}>Оплатить {totalToPay} тг</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <Text style={styles.closeButtonText}>Отмена</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        transparent={true}
        visible={cashAmountScreenVisible}
        onRequestClose={closeModal}
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.cashModalContent}>
                <Text style={styles.modalTitleForPayment}>К оплате: {totalToPay} тг</Text>
                <Text style={styles.modalTitle}>Введите сумму наличными</Text>
                <TextInput
                  style={styles.cashInput}
                  keyboardType="numeric"
                  onChangeText={(amount) => handleAmountChange('Наличный', amount)}
                  value={paymentAmounts['Наличный'] || ''}
                />
                {selectedPaymentMethod === 'Смешанная оплата' && (
                  <Text style={styles.modalMessage}>
                    Остальная сумма будет оплачена безналичным способом.
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={handleCashAmountConfirm}
                >
                  <Text style={styles.payButtonText}>Подтвердить {paymentAmounts['Наличный']} тг</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <Text style={styles.closeButtonText}>Отмена</Text>
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
  cashModalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalTitleForPayment: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  modalComment: {
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
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
  cashInput: {
    width: '100%',
    height: 60,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    borderColor: '#007aff',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 20,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#007aff',
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007aff',
    borderRadius: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PaymentSlider;
