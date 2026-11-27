import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, RADIUS, SPACING } from '../theme/colors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches unexpected JavaScript rendering errors and renders a dark-themed Arabic
 * fallback UI with error details and a retry action.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, info);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorMessage =
      this.state.error?.message?.trim() ||
      (this.state.error ? String(this.state.error) : 'خطأ غير معروف');

    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLORS.accent}
          />
        </View>

        <Text style={styles.title}>حدث خطأ غير متوقع</Text>
        <Text style={styles.subtitle}>
          حدثت مشكلة أثناء تشغيل التطبيق. يمكنك إعادة المحاولة لاستعادة الشاشة.
        </Text>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsLabel}>تفاصيل الخطأ:</Text>
          <ScrollView style={styles.detailsScroll}>
            <Text selectable style={styles.detailsText}>
              {errorMessage}
            </Text>
          </ScrollView>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={this.handleRetry}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="إعادة المحاولة"
        >
          <Ionicons name="refresh" size={18} color={COLORS.iconOnAccent} />
          <Text style={styles.retryText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.xl,
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  detailsScroll: {
    maxHeight: 140,
  },
  detailsText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    textAlign: 'left',
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.iconOnAccent,
  },
});
