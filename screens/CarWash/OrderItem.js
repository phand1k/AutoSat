import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyledText from '../../components/texts/StyledText';
import * as Linking from 'expo-linking';

const OrderItem = ({ item, onPress, theme, recentlyClosedOrder }) => {
  const animation = {
    0: { scale: 1 },
    0.5: { scale: 1.2 },
    1: { scale: 1 },
  };

  return (
    <TouchableOpacity onPress={onPress} style={[styles.itemContainer, { backgroundColor: theme.secondary, borderColor: item.id === recentlyClosedOrder ? theme.accent : theme.secondary, borderWidth: item.id === recentlyClosedOrder ? 0.8 : 0 }]}>
      <Ionicons name="file-tray-stacked-outline" size={50} color={theme.accent} style={styles.itemIcon} />
      <View style={styles.orderDetails}>
        <StyledText style={styles.itemName}>{item.name}</StyledText>
        <StyledText style={styles.itemDescription}>{item.description}</StyledText>
        <StyledText style={styles.totalTime}>{item.totalServices}</StyledText>
        <View style={styles.createdInfo}>
          <StyledText style={styles.itemTimeAgo}>Создано: {item.timeAgo} назад</StyledText>
        </View>
      </View>
      <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${item.phoneNumber}`)}>
        <Ionicons name="chatbubbles-outline" size={26} color={"#1DA1F2"} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemIcon: {
    marginRight: 20,
  },
  orderDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
  },
  totalTime: {
    fontSize: 20,
    color: '#007bff',
  },
  createdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTimeAgo: {
    fontSize: 12,
    color: '#888',
  },
});

export default OrderItem;
