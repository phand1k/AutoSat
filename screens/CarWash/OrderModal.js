// OrderModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, ScrollView, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import PaymentSlider from '../PaymentSlider';
import styles from './OrderModalStyles'; // Импорт стилей, если они в отдельном файле

const OrderModal = ({
  modalVisible,
  closeModal,
  selectedOrder,
  activeColors,
  onModalRefresh,
  modalRefreshing,
  isLoadingModal,
  routes,
  renderScene,
  initialLayout,
  index,
  setIndex,
  completeWashOrder,
  deleteWashOrder,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={[styles.modalView, { backgroundColor: activeColors.primary }]}>
        {isLoadingModal ? (
          <ActivityIndicator size="large" color={activeColors.tint} />
        ) : (
          <>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedOrder.licensePlate}</Text>
              <Text style={styles.modalSubtitle}>{selectedOrder.brand} {selectedOrder.model}</Text>
            </View>
            <TabView
              navigationState={{ index, routes }}
              renderScene={renderScene}
              onIndexChange={setIndex}
              initialLayout={initialLayout}
              renderTabBar={props => (
                <TabBar
                  {...props}
                  indicatorStyle={{ backgroundColor: activeColors.tint }}
                  style={{ backgroundColor: activeColors.secondary }}
                  labelStyle={{ color: activeColors.tint }}
                />
              )}
            />
            <PaymentSlider
              onComplete={() => {
                completeWashOrder(selectedOrder.id);
                closeModal(); // Закрыть модальное окно после завершения заказ-наряда
              }}
              onSwipeLeft={() => {
                deleteWashOrder(selectedOrder.id);
                closeModal(); // Закрыть модальное окно после удаления заказ-наряда
              }}
              selectedOrder={selectedOrder}
            />
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
              onPress={closeModal}
            >
              <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
};

export default OrderModal;
