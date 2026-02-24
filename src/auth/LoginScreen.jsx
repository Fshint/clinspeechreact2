import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/LoginScreen.css';
import AppLogo from '../assets/App_logo.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [locked, setLocked] = useState(false);
    const [timer, setTimer] = useState(30);
    const [isLoading, setIsLoading] = useState(false);

    const MAX_ATTEMPTS = 3;
    const LOCK_TIME = 30;

    // Если уже авторизован — перейти на главную
    useEffect(() => {
        if (isAuthenticated) navigate('/main', { replace: true });
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        let interval;

        if (locked && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }

        if (timer === 0) {
            setLocked(false);
            setAttempts(0);
            setTimer(LOCK_TIME);
        }

        return () => clearInterval(interval);
    }, [locked, timer]);

    const handleLogin = async () => {
        if (locked || isLoading) return;

        setIsLoading(true);
        setError(false);
        setErrorMessage('');

        try {
            // Backend ожидает username, но email тоже можно использовать как username
            await login(email, password);
            navigate('/main', { replace: true });
        } catch (err) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setError(true);

            if (err.response?.status === 401) {
                setErrorMessage('Неверный логин или пароль.');
            } else if (err.response?.data?.detail) {
                setErrorMessage(err.response.data.detail);
            } else {
                setErrorMessage('Ошибка подключения к серверу.');
            }

            if (newAttempts >= MAX_ATTEMPTS) {
                setLocked(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">

            <div className="headerContainer">
                <div className="headerBackground">
                    <div className="logoWrapper">
                        <img src={AppLogo} alt="logo" className="miniLogo" />
                        <h1 className="headerTitle">ClinSpeech</h1>
                    </div>
                </div>
            </div>

            <div className="content">
                <h2 className="selectionTitle">Вход</h2>

                <div className="loginForm">

                    <input
                        className="input"
                        type="email"
                        placeholder="Логин или email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={locked || isLoading}
                    />

                    <div className="passwordWrapper">
                        <input
                            className={`input ${error ? 'inputError' : ''}`}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Введите ваш пароль"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={locked || isLoading}
                        />

                        <span
                            className="eyeIcon"
                            onClick={() => setShowPassword(prev => !prev)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>

                    {!locked && error && (
                        <p className="errorText">
                            {errorMessage || 'Ошибка входа.'}
                            <br />
                            Осталось попыток: {MAX_ATTEMPTS - attempts}
                        </p>
                    )}

                    {locked && (
                        <p className="lockText">
                            Ваш аккаунт временно заблокирован. Мы разблокируем его в течение 24 часов.
                            Если вы не помните пароль, попробуйте его восстановить.
                            <br /><br />
                            Пожалуйста, попробуйте еще раз через: {timer} сек.
                        </p>
                    )}

                    <p className="forgotText">
                        Я не могу вспомнить свой пароль.
                    </p>
                </div>

                <div className="buttonContainer">
                    <button
                        className="roleButton"
                        onClick={handleLogin}
                        disabled={locked || isLoading}
                    >
                        {isLoading ? 'ВХОД...' : 'ВОЙТИ'}
                    </button>
                </div>
            </div>
        </div>
    );
}