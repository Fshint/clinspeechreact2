import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import WelcomeScreen from './auth/WelcomeScreen';
import TabNavigator from './navigation/TabNavigator';
import SettingsScreen from './screens/Settings';
import RecordPage from './screens/RecordPage';
import ConfirmScreen from "./screens/ConfirmScreen";
import DetailScreen from './screens/DetailScreen';
import RegisterScreen from './auth/RegisterScreen';
import LoginScreen from "./auth/LoginScreen";

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<WelcomeScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />

                <Route path="/main" element={<TabNavigator />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/record" element={<RecordPage />} />
                <Route path="/confirm" element={<ConfirmScreen />} />
                <Route path="/detail" element={<DetailScreen />} />
            </Routes>
        </Router>
    );
}
