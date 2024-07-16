import React, { useState, useContext } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Button } from 'react-native';
import { CalendarList } from 'react-native-calendars';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ThemeContext } from '../context/ThemeContext';
import { colors } from '../config/theme';

const DateRangePicker = ({ onSave, onCancel }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  const [selectedDates, setSelectedDates] = useState({});
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const onDayPress = (day) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
      setSelectedDates({
        [day.dateString]: {
          selected: true,
          startingDay: true,
          color: 'purple',
          textColor: activeColors.text,
        },
      });
    } else if (startDate && !endDate) {
      const newEndDate = day.dateString;
      setEndDate(newEndDate);
      const range = getDatesInRange(startDate, newEndDate);
      const newSelectedDates = {};
      range.forEach((date, index) => {
        newSelectedDates[date] = {
          selected: true,
          color: 'purple',
          startingDay: index === 0,
          endingDay: index === range.length - 1,
          textColor: activeColors.text,
        };
      });
      setSelectedDates(newSelectedDates);
    }
  };

  const getDatesInRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const date = new Date(start.getTime());

    const dates = [];

    while (date <= end) {
      dates.push(format(new Date(date), 'yyyy-MM-dd'));
      date.setDate(date.getDate() + 1);
    }

    return dates;
  };

  const handleSave = () => {
    onSave({ startDate, endDate, selectedDates });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeColors.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: activeColors.text }]}>Выберите период</Text>
        <Button title="Сохранить" onPress={handleSave} />
      </View>
      <CalendarList
        onDayPress={onDayPress}
        markedDates={selectedDates}
        markingType={'period'}
        pastScrollRange={12}
        futureScrollRange={12}
        scrollEnabled
        showScrollIndicator
        theme={{
          calendarBackground: activeColors.primary,
          textSectionTitleColor: activeColors.text,
          dayTextColor: activeColors.text,
          todayTextColor: activeColors.accent,
          selectedDayTextColor: activeColors.text,
          monthTextColor: activeColors.text,
          selectedDayBackgroundColor: activeColors.accent,
          arrowColor: activeColors.text,
          textDisabledColor: 'grey',
        }}
      />
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="datetime"
        onConfirm={(date) => {
          setStartDate(format(date, 'yyyy-MM-dd HH:mm'));
          setStartDatePickerVisibility(false);
        }}
        onCancel={() => setStartDatePickerVisibility(false)}
      />
      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="datetime"
        onConfirm={(date) => {
          setEndDate(format(date, 'yyyy-MM-dd HH:mm'));
          setEndDatePickerVisibility(false);
        }}
        onCancel={() => setEndDatePickerVisibility(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 18,
  },
});

export default DateRangePicker;
