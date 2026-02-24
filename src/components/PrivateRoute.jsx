import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Оборачивает защищённые маршруты.
 * Если пользователь не авторизован — редирект на /login.
 */
export default function PrivateRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Загрузка...
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}
