import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface to crash reporting here (e.g. Sentry) when available.
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.emoji}>😕</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app hit an unexpected error. You can try again without losing your data.
          </Text>
          {__DEV__ && this.state.error ? (
            <Text style={styles.debug}>{this.state.error.message}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
    backgroundColor: COLORS.surface,
  },
  emoji: {
    fontSize: 56,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  message: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    fontFamily: 'Inter-Regular',
  },
  debug: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: BORDER_RADIUS.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
