import React, { useState, useRef } from 'react';
import { View, PanResponder, Animated, StyleSheet, Text } from 'react-native';

const SwipeSlider = ({ onComplete }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const sliderWidth = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: sliderWidth }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, { dx }) => {
        if (dx > 200) { // You can adjust this value to set the swipe threshold
          onComplete();
          Animated.timing(sliderWidth, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.spring(sliderWidth, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.sliderContainer}>
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
        <Text style={styles.thumbText}>Свайп</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  thumb: {
    position: 'absolute',
    width: 100,
    height: 40,
    backgroundColor: '#007bff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SwipeSlider;
