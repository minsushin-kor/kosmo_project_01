import { Route, Routes } from "react-router-dom";

import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";

import {
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  NOT_FOUND_ROUTE,
} from "./data/routeData";

function App() {
  return (
    <>
      <Header />

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
              <ProtectedRoute allowedRoles={route.allowedRoles}>
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

      <Footer />
    </>
  );
}

export default App;