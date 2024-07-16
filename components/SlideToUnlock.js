import React, { useRef, useState } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet } from 'react-native';

const SlideToUnlock = ({ onComplete }) => {
  const sliderWidth = useRef(new Animated.Value(0)).current;
  const [sliderActivated, setSliderActivated] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx < 260) { // Adjust the value to set the swipe threshold
          sliderWidth.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (event, gestureState) => {
        if (gestureState.dx > 200) { // Adjust the value to set the swipe threshold
          setSliderActivated(true);
          Animated.timing(sliderWidth, {
            toValue: 260, // Complete the slide
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            onComplete();
            setSliderActivated(false);
            sliderWidth.setValue(0);
          });
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
        <Text style={styles.thumbText}>→</Text>
      </Animated.View>
      <Text style={styles.sliderText}>slide to unlock</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: 300,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  track: {
    width: '100%',
    height: 50,
    backgroundColor: '#000',
    borderRadius: 25,
    opacity: 0.5,
  },
  thumb: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  thumbText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sliderText: {
    position: 'absolute',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SlideToUnlock;
