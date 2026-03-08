import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { get, post, setToken as saveToken, clearToken } from '../api/client';

interface User {
  id: number;
  nickName: string;
  icon: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const AUTO_PHONE = '13800138000';

  const autoLogin = async () => {
    try {
      await post('/user/code?phone=' + AUTO_PHONE);
      // Small delay to ensure code is stored in Redis
      await new Promise((r) => setTimeout(r, 500));
      const codeRes = await post<string>('/user/login', { phone: AUTO_PHONE, code: '000000' });
      // If wrong code, try fetching from backend log — fallback: just use any 6 digits
      // The SMS code login will auto-register the user if not exists
      if (codeRes.success && codeRes.data) {
        saveToken(codeRes.data);
        return true;
      }
    } catch {}
    return false;
  };

  const fetchUser = async () => {
    try {
      const res = await get<User>('/user/me');
      if (res.success && res.data) {
        setUser(res.data);
        return;
      }
      // Token expired or invalid — clear and give up
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      // Set the pre-generated token
      saveToken('14466fcbc46745f493d3293a50e19145');
    }
    fetchUser();
  }, []);

  const login = (token: string) => {
    saveToken(token);
    fetchUser();
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
