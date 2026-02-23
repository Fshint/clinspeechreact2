import React from 'react';
import '../css/LoginScreen.css';

export default function LoginScreen() {
    return (
        <div className="login-container">
            {/* HEADER */}
            <div className="headerContainer">
                <div className="headerBackground">
                    <div className="logoWrapper">
                        <img src="/assets/App_logo.png" alt="logo" className="miniLogo" />
                        <h1 className="headerTitle">ClinSpeech</h1>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="content">
                <div className="topSection">
                    <h2 className="selectionTitle">Вход</h2>
                </div>

                <div className="buttonContainer">
                    <button className="loginButton">Войти через Email</button>
                    <button className="loginButton">Войти через Google</button>
                </div>
            </div>
        </div>
    );
}
