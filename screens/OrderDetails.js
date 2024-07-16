const OrderDetails = ({ order }) => {
    const { theme } = useContext(ThemeContext);
    const activeColors = colors[theme.mode];
  
    if (!order) {
      return (
        <View style={styles.noSelectionContainer}>
          <StyledText style={styles.noSelectionText}>Выберите заказ-наряд для просмотра подробностей</StyledText>
        </View>
      );
    }
  
    return (
      <ScrollView contentContainerStyle={styles.orderDetailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="car" size={24} color={activeColors.tint} />
          <StyledText style={styles.detailText}>Гос. номер: {order.licensePlate}</StyledText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="car-sport" size={24} color={activeColors.tint} />
          <StyledText style={styles.detailText}>Марка: {order.brand}</StyledText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={24} color={activeColors.tint} />
          <StyledText style={styles.detailText}>Модель: {order.model}</StyledText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={24} color={activeColors.tint} />
          <StyledText style={styles.detailText}>Дата создания: {order.createdAt}</StyledText>
        </View>
        {/* Add more details as needed */}
      </ScrollView>
    );
  };
  
  const styles = StyleSheet.create({
    orderDetailsContainer: {
      padding: 20,
      backgroundColor: '#fff',
      borderRadius: 10,
      marginVertical: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    detailText: {
      fontSize: 16,
      marginLeft: 10,
      color: '#333',
    },
    noSelectionContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    noSelectionText: {
      fontSize: 16,
      color: '#aaa',
    },
  });
  