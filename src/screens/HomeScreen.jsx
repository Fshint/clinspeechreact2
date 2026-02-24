import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSettingsOutline } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { MainButton } from '../assets';
import '../css/HomeScreen.css';

export default function HomeScreen() {
    const [language, setLanguage] = useState('RUS');
    const navigate = useNavigate();
    const { user } = useAuth();

    const displayName = user
        ? (user.first_name || user.full_name || user.username)
        : 'Доктор';

    return (
        <div className="home-container">
            {/* HEADER */}
            <div className="header">
                <button className="settings-btn" onClick={() => navigate('/settings')}>
                    <IoSettingsOutline size={24} color="#fff" />
                </button>

                <div className="langSwitch">
                    <button
                        className={`langButton ${language === 'RUS' ? 'activeLangButton' : ''}`}
                        onClick={() => setLanguage('RUS')}
                    >
                        RUS
                    </button>
                    <button
                        className={`langButton ${language === 'KZ' ? 'activeLangButton' : ''}`}
                        onClick={() => setLanguage('KZ')}
                    >
                        KZ
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="content">
                <h1 className="title">Добро пожаловать,<br/>Доктор {displayName}!</h1>
                <p className="subtitle">
                    Начните свой первый<br/>прием, чтобы создать отчет
                </p>

                <div className="micContainer">
                    <button className="micButton" onClick={() => navigate('/record')}>
                        <img src={MainButton} alt="mic" className="micImage" />
                    </button>
                </div>

                <p className="hintText">Нажмите, чтобы<br/>начать новый прием!</p>
            </div>
        </div>
    );
}
