import React, { useContext } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS

import DefaultLayout from "./layouts/DefaultLayout";
import UserDetail from "./pages/users/UserDetail";
import UserList from "./pages/users/UserList";
import StockList from "./pages/stock/StockList";
import LoginPage from "./pages/login/LoginPage";
import HomePage from "./pages/home/HomePage";
import Dashboard from "./pages/dashboard/Dashboard";
import ImportOrderList from "./pages/import-orders/ImportOrderList";
import ImportOrderListApprove from "./pages/import-orders/ImportOrderListApprove";
import ImportOrderListWMS from "./pages/import-orders/ImportOrderListWMS";
import ImportOrderListCheck from "./pages/import-orders/ImportOrderListCheck";
import ViewImportOrder from "./pages/import-orders/ViewImportOrder";
import ChangePassword from "./pages/auth/ChangePassword"; // Thêm trang đổi mật khẩu
import { AuthProvider, AuthContext } from "./context/AuthContext";
import CategoryList from "./pages/category/CategoryList";
import BookList from './pages/book/BookList';
import ExportOrderList from "./pages/export-orders/ExportOrderList";
import ViewExportOrder from "./pages/export-orders/ViewExportOrder";
import ExportOrderApprove from "./pages/export-orders/ExportOrderApprove";
import ExportOrderPacking from "./pages/export-orders/ExportOrderPacking";
import ExportOrderWMS from "./pages/export-orders/ExportOrderWMS";

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
            <Route path="change-password" element={<ChangePassword />} />

            {/* Mặc định vào trang home */}
            <Route index element={<HomePage />} />
            <Route path="/" element={<HomePage />} />

            {/* User common */}
            <Route path="users/:id" element={<UserDetail />} />

            <Route path="orders-import" exact element={<ImportOrderList />} />
            <Route path="orders-import/:id" element={<ViewImportOrder />} />
            {/* <Route path="orders-import" element={<ImportOrderList />} /> */}
            <Route path="orders-import/approve/wms" element={<ImportOrderListWMS />} />
            <Route path="orders-import/approve" element={<ImportOrderListApprove />} />
            <Route path="orders-import/check" element={<ImportOrderListCheck />} />
            <Route path="orders-export" element={<ExportOrderList />} />
            <Route path="/orders-export/:id" element={<ViewExportOrder />} />
            <Route path="/orders-export/approve" element={<ExportOrderApprove />} />
            <Route path="/orders-export/packing" element={<ExportOrderPacking />} />
            <Route path="/orders-export/approve/wms" element={<ExportOrderWMS />} />

            {/* stock */}
            <Route path="stock" element={<StockList />} />

            {/* admin */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin/users" element={<UserList />} />
            <Route path="admin/categories" element={<CategoryList />} />
            <Route path="admin/books" element={<BookList />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>

      {/* Thông báo */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

    </AuthProvider>
  );
};

export default App;
