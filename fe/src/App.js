import React, { useContext } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import DefaultLayout from "./layouts/DefaultLayout";
import UserDetail from "./pages/users/UserDetail";
import UserList from "./pages/users/UserList";
import LoginPage from "./pages/login/LoginPage";
import { AuthProvider, AuthContext } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  
  if (isAuthenticated === null) {
    return null; // Đợi kiểm tra xong `localStorage` trước khi render
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <AuthProvider> {/* ✅ Đảm bảo `AuthProvider` bọc toàn bộ ứng dụng */}
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DefaultLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserList />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="admin/users" element={<UserList />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
