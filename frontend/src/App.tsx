import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import ShopList from './pages/ShopList';
import ShopDetail from './pages/ShopDetail';
import BlogDetail from './pages/BlogDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="shops/:typeId" element={<ShopList />} />
        <Route path="shop/:id" element={<ShopDetail />} />
        <Route path="blog/:id" element={<BlogDetail />} />
      </Route>
    </Routes>
  );
}
