import React from 'react';
import { TouchableOpacity, View, Image, TextInput, FlatList, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyledText from '../components/texts/StyledText';
import styles from './styles';

export const OrderItem = ({ item, onPress, activeColors }) => (
  <TouchableOpacity onPress={() => onPress(item)} style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
    <View style={styles.orderDetails}>
      <StyledText style={styles.itemName}>{item.name}</StyledText>
      <StyledText style={styles.itemDescription}>{item.description}</StyledText>
      <StyledText style={styles.itemInfo}>
        {item.brand} {item.model} ({item.licensePlate})
      </StyledText>
      <StyledText style={styles.totalTime}>{item.totalServices}</StyledText>
      <StyledText style={styles.itemTimeAgo}>Создано: {item.timeAgo} назад</StyledText>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
      </View>
      <StyledText style={styles.progressText}>{item.progress}%</StyledText>
    </View>
  </TouchableOpacity>
);

export const ServiceItem = ({ service, onPress, activeColors, selectedOrder }) => {
  const serviceAdded = selectedOrder?.services.some(s => s.id === service.id);
  return (
    <View key={service.id} style={[styles.serviceItem, { backgroundColor: activeColors.secondary }]}>
      <StyledText style={styles.assignedServiceName} numberOfLines={2}>{service.name}</StyledText>
      <StyledText style={styles.assignedServicePrice}>{service.price}</StyledText>
      <TouchableOpacity
        onPress={() => onPress(service)}
        style={styles.addServiceButton}
      >
        <Ionicons name={serviceAdded ? "remove-circle-outline" : "add-circle-outline"} size={30} color={serviceAdded ? "red" : "#007bff"} />
      </TouchableOpacity>
    </View>
  );
};

// Другие компоненты...
