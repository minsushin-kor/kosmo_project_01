import { Suspense } from "react";
import {
  Route,
  Routes,
} from "react-router-dom";

import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RouteErrorBoundary from "./components/common/RouteErrorBoundary";
import ScrollToTop from "./components/common/ScrollToTop";

import {
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  NOT_FOUND_ROUTE,
} from "./data/routeData";

function RouteLoading() {
  return (
    <main
      aria-live="polite"
      aria-busy="true"
      style={{
        minHeight: "calc(100vh - 140px)",
        display: "grid",
        placeItems: "center",
        padding: "40px 20px",
        boxSizing: "border-box",
        color: "#64748b",
        fontSize: "15px",
        fontWeight: 700,
      }}
    >
      페이지를 불러오는 중입니다.
    </main>
  );
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Header />

      <RouteErrorBoundary>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            {PUBLIC_ROUTES.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={route.element}
              />
            ))}

            {PROTECTED_ROUTES.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={
                  <ProtectedRoute
                    allowedRoles={route.allowedRoles}
                  >
                    {route.element}
                  </ProtectedRoute>
                }
              />
            ))}

            <Route
              path={NOT_FOUND_ROUTE.path}
              element={NOT_FOUND_ROUTE.element}
            />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>

      <Footer />
    </>
  );
}

export default App;