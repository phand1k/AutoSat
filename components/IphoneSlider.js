import React, { useRef, useState } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, Modal, TouchableOpacity } from 'react-native';

const IphoneSlider = ({ onComplete, onSwipeLeft, onSwipeRight }) => {
  const sliderWidth = useRef(new Animated.Value(0)).current;
  const [sliderActivated, setSliderActivated] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);

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
          setConfirmationVisible(true);
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

  const confirmCompletion = () => {
    Animated.timing(sliderWidth, {
      toValue: 300,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onComplete();
      resetSlider();
    });
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
        onRequestClose={() => setConfirmationVisible(false)}
      >
        <View style={styles.modalContainer}>
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
                style={styles.modalButton}
                onPress={() => setConfirmationVisible(false)}
              >
                <Text style={styles.buttonText}>Нет</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={deleteConfirmationVisible}
        onRequestClose={() => setDeleteConfirmationVisible(false)}
      >
        <View style={styles.modalContainer}>
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
                style={styles.modalButton}
                onPress={() => setDeleteConfirmationVisible(false)}
              >
                <Text style={styles.buttonText}>Нет</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 10,
    backgroundColor: '#007aff',
    borderRadius: 5,
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default IphoneSlider;
