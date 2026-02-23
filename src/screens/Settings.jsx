import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack } from 'react-icons/io5';
import '../css/Settings.css';

export default function SettingsScreen() {
    const navigate = useNavigate();

    return (
        <div className="settings-container">
            <div className="safe-area">
                {/* Header */}
                <div className="header">
                    <button
                        className="backButton"
                        onClick={() => navigate(-1)}
                    >
                        <IoChevronBack size={30} color="#000" />
                    </button>

                    <h1 className="headerTitle">Настройки</h1>

                    <div style={{ width: 40 }} />
                </div>

                {/* Content */}
                <div className="content">
                    <p className="placeholderText">
                        Раздел настроек в разработке...
                    </p>
                </div>
            </div>
        </div>
    );
}
