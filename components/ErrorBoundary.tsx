import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, Radius, Shadow } from '../constants/theme';
import { captureException, track } from '../lib/telemetry';

interface ErrorBoundaryState {
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, {
      componentStack: info.componentStack,
      source: 'ErrorBoundary',
    });
    track('error_boundary', {
      message: error.message,
      name: error.name,
    });
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🦆💥</Text>
          <Text style={styles.title}>Algo se rompio</Text>
          <Text style={styles.body}>
            Hubo un error inesperado. Ya lo reportamos. Toca abajo para volver al inicio.
          </Text>
          <Text style={styles.errorText} numberOfLines={3}>
            {error.message}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={this.reset}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnText}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.card,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Fonts.h2,
    fontWeight: '800',
    color: Colors.blackPremium,
    marginBottom: Spacing.sm,
  },
  body: {
    fontSize: Fonts.body,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  errorText: {
    fontSize: Fonts.xs,
    color: Colors.error,
    fontFamily: Fonts.family,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  btn: {
    backgroundColor: Colors.yellow,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    minWidth: 200,
    alignItems: 'center',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: Colors.ink,
    fontWeight: '800',
    fontSize: Fonts.body,
  },
});
