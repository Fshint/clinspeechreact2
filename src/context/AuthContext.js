import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // При монтировании — проверяем есть ли сохранённый токен
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const { data } = await userAPI.getMe();
            setUser(data);
        } catch {
            // Токен невалиден — очищаем
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    /** Вход по username + password */
    const login = useCallback(async (username, password) => {
        const { data } = await authAPI.login(username, password);
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        // Загружаем профиль
        const me = await userAPI.getMe();
        setUser(me.data);
        return data;
    }, []);

    /** Вход по OTP */
    const loginWithCode = useCallback(async (email, code) => {
        const { data } = await authAPI.loginWithCode(email, code);
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        const me = await userAPI.getMe();
        setUser(me.data);
        return data;
    }, []);

    /** Регистрация */
    const register = useCallback(async (userData) => {
        const { data } = await authAPI.register(userData);
        return data;
    }, []);

    /** Выход */
    const logout = useCallback(() => {
        authAPI.logout().catch(() => {}); // необязательно ждать ответ
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    }, []);

    const value = {
        user,
        loading,
        login,
        loginWithCode,
        register,
        logout,
        fetchUser,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
