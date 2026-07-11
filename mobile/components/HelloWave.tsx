import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

export function HelloWave() {
  const rotationAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotationAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnimation, {
          toValue: -1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 4 }
    ).start();
  }, []);

  const rotateZ = rotationAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });

  return (
    <Animated.View style={[styles.animatedView, { transform: [{ rotateZ }] }]}>
      <Text style={styles.text}>👋</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedView: {
    marginTop: -6,
  },
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});
