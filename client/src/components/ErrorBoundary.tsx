import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>오류가 발생했습니다.</h2>
          <p>페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 20px", marginTop: "10px", cursor: "pointer" }}
          >
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
