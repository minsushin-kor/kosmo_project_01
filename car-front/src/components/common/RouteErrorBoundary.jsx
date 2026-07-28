import { Component } from "react";

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "페이지 로딩 중 오류가 발생했습니다.",
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <main style={styles.page}>
          <section style={styles.card}>
            <div style={styles.code}>
              페이지 로딩 오류
            </div>

            <h1 style={styles.title}>
              페이지를 불러오지 못했습니다.
            </h1>

            <p style={styles.description}>
              일시적인 오류가 발생했거나
              최신 페이지 파일을 불러오지 못했습니다.
              <br />
              새로고침 후 다시 확인해주세요.
            </p>

            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={this.handleRetry}
              >
                다시 불러오기
              </button>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={this.handleHome}
              >
                홈으로 이동
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

const styles = {
  page: {
    minHeight: "calc(100vh - 140px)",
    display: "grid",
    placeItems: "center",
    padding: "40px 20px",
    boxSizing: "border-box",
    backgroundColor: "#f8fbff",
  },

  card: {
    width: "min(520px, 100%)",
    padding: "42px 32px",
    boxSizing: "border-box",
    textAlign: "center",
    border: "1px solid #dbe8f5",
    borderRadius: "22px",
    backgroundColor: "#ffffff",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
  },

  code: {
    marginBottom: "14px",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: 800,
  },

  title: {
    margin: "0 0 14px",
    color: "#0f172a",
    fontSize: "26px",
    lineHeight: 1.35,
  },

  description: {
    margin: 0,
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.8,
  },

  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "28px",
  },

  primaryButton: {
    minWidth: "130px",
    height: "44px",
    padding: "0 18px",
    border: "1px solid #2563eb",
    borderRadius: "12px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },

  secondaryButton: {
    minWidth: "130px",
    height: "44px",
    padding: "0 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
};

export default RouteErrorBoundary;