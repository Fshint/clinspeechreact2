import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/HomeScreen.css';

export default function HomeScreen() {
    const [language, setLanguage] = useState('RUS');
    const navigate = useNavigate();

    return (
        <div className="home-container">
            {/* HEADER */}
            <div className="header">
                <button className="settings-btn" onClick={() => navigate('/settings')}>
                    <img src="/assets/settings.png" alt="settings" className="settingsIcon" />
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
                <h1 className="title">Добро пожаловать,<br/>Доктор [Имя]!</h1>
                <p className="subtitle">
                    Начните свой первый<br/>прием, чтобы создать отчет
                </p>

                <div className="micContainer">
                    <button className="micButton" onClick={() => navigate('/record')}>
                        <img src="/assets/Main_Button.png" alt="mic" className="micImage" />
                    </button>
                </div>

                <p className="hintText">Нажмите, чтобы<br/>начать новый прием!</p>
            </div>
        </div>
    );
}
