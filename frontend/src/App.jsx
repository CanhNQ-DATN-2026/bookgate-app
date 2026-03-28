import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// User pages
import BookList from "./pages/user/BookList";
import BookDetail from "./pages/user/BookDetail";
import Profile from "./pages/user/Profile";
import MyRequests from "./pages/user/MyRequests";
import MyDownloadHistory from "./pages/user/MyDownloadHistory";
import RequestUpload from "./pages/user/RequestUpload";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import BookManagement from "./pages/admin/BookManagement";
import UploadBook from "./pages/admin/UploadBook";
import UserList from "./pages/admin/UserList";
import RequestReview from "./pages/admin/RequestReview";
import DownloadHistory from "./pages/admin/DownloadHistory";
import UploadRequestReview from "./pages/admin/UploadRequestReview";

function UserLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="USER">
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function AdminLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User routes */}
          <Route path="/books" element={<UserLayout><BookList /></UserLayout>} />
          <Route path="/books/:id" element={<UserLayout><BookDetail /></UserLayout>} />
          <Route path="/profile" element={<UserLayout><Profile /></UserLayout>} />
          <Route path="/my-requests" element={<UserLayout><MyRequests /></UserLayout>} />
          <Route path="/my-downloads" element={<UserLayout><MyDownloadHistory /></UserLayout>} />
          <Route path="/request-upload" element={<UserLayout><RequestUpload /></UserLayout>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
          <Route path="/admin/books" element={<AdminLayout><BookManagement /></AdminLayout>} />
          <Route path="/admin/books/new" element={<AdminLayout><UploadBook /></AdminLayout>} />
          <Route path="/admin/books/:id/edit" element={<AdminLayout><UploadBook /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><UserList /></AdminLayout>} />
          <Route path="/admin/requests" element={<AdminLayout><RequestReview /></AdminLayout>} />
          <Route path="/admin/upload-requests" element={<AdminLayout><UploadRequestReview /></AdminLayout>} />
          <Route path="/admin/downloads" element={<AdminLayout><DownloadHistory /></AdminLayout>} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/books" replace />} />
          <Route path="*" element={<Navigate to="/books" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
