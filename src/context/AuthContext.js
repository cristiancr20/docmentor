// AuthContext.js
/* import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../core/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Llamada al backend para verificar si la cookie de autenticación es válida
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/check`, { withCredentials: true });
        if (response.status === 200) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); */
