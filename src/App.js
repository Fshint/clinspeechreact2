import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import WelcomeScreen from './auth/WelcomeScreen';
import TabNavigator from './navigation/TabNavigator';
import SettingsScreen from './screens/Settings';
import RecordPage from './screens/RecordPage';
import ConfirmScreen from "./screens/ConfirmScreen";
import DetailScreen from './screens/DetailScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import RegisterScreen from './auth/RegisterScreen';
import LoginScreen from "./auth/LoginScreen";

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Публичные маршруты */}
                    <Route path="/" element={<WelcomeScreen />} />
                    <Route path="/login" element={<LoginScreen />} />
                    <Route path="/register" element={<RegisterScreen />} />

                    {/* Защищённые маршруты */}
                    <Route path="/main/*" element={<PrivateRoute><TabNavigator /></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute><SettingsScreen /></PrivateRoute>} />
                    <Route path="/record" element={<PrivateRoute><RecordPage /></PrivateRoute>} />
                    <Route path="/confirm" element={<PrivateRoute><ConfirmScreen /></PrivateRoute>} />
                    <Route path="/detail/:id" element={<PrivateRoute><DetailScreen /></PrivateRoute>} />
                    <Route path="/notifications" element={<PrivateRoute><NotificationsScreen /></PrivateRoute>} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}
