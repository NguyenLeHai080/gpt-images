import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorPage } from './ErrorPage';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Bắt được lỗi giao diện:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/app/overview';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorPage
          code="500"
          title="Ứng dụng gặp sự cố giao diện"
          description={this.state.error?.message || 'Đã xảy ra lỗi thực thi trong quá trình kết xuất (rendering).'}
          actionText="Về trang chủ an toàn"
          onAction={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}