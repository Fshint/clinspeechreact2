import React, { useState, useEffect } from 'react';
import '../css/LoginScreen.css';
import AppLogo from '../assets/App_logo.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LoginScreen() {

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [error, setError] = useState(false);
    const [locked, setLocked] = useState(false);
    const [timer, setTimer] = useState(30);

    const MAX_ATTEMPTS = 3;
    const LOCK_TIME = 30;

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

    const handleLogin = () => {
        if (locked) return;

        const correctPassword = "123456"; // временно для теста

        if (password !== correctPassword) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setError(true);

            if (newAttempts >= MAX_ATTEMPTS) {
                setLocked(true);
            }
        } else {
            setError(false);
            alert("Успешный вход");
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
                        placeholder="example@mail.com"
                        disabled={locked}
                    />

                    <div className="passwordWrapper">
                        <input
                            className={`input ${error ? 'inputError' : ''}`}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Введите ваш пароль"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={locked}
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
                            Пароль неверный. Аккаунт будет временно заблокирован после трёх неудачных попыток авторизации.
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
                        disabled={locked}
                    >
                        ВОЙТИ
                    </button>
                </div>
            </div>
        </div>
    );
}