import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartbeat, faStethoscope, faBriefcaseMedical } from '@fortawesome/free-solid-svg-icons';
import { faDna, faPills, faMicroscope } from '@fortawesome/free-solid-svg-icons';
import '../css/WelcomeScreen.css';
import AppIcon from '../assets/App_icon.png';

const FloatingShape = ({ icon, index }) => {
    const angle = (index * 60) * (Math.PI / 180);
    const distance = 160;

    return (
        <motion.div
            className="shape"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
                opacity: [0, 0.7, 0.7, 0],
                x: [0, Math.cos(angle) * distance],
                y: [0, Math.sin(angle) * distance],
                scale: [0.5, 1.2],
            }}
            transition={{
                delay: index * 1,
                duration: 4.5,
                repeat: Infinity,
                ease: "easeOut"
            }}
        >
            {icon}
        </motion.div>
    );
};

export default function WelcomeScreen() {
    const navigate = useNavigate();

    const shapes = [
        <FontAwesomeIcon icon={faHeartbeat} size="lg" color="white" />,
        <FontAwesomeIcon icon={faPills} size="lg" color="white" />,
        <FontAwesomeIcon icon={faStethoscope} size="lg" color="white" />,
        <FontAwesomeIcon icon={faDna} size="lg" color="white" />,
        <FontAwesomeIcon icon={faBriefcaseMedical} size="lg" color="white" />,
        <FontAwesomeIcon icon={faMicroscope} size="lg" color="white" />,
    ];

    return (
        <div className="welcome-container">
            <div className="content">
                {/* Заголовок */}
                <h1 className="title">Добро пожаловать в<br/>ClinSpeech</h1>

                {/* Центральный блок */}
                <div className="logo-container">
                    {shapes.map((shape, index) => (
                        <FloatingShape key={index} icon={shape} index={index} />
                    ))}

                    <div className="image-wrapper">
                        <img src={AppIcon} alt="App Logo" className="logo" />
                    </div>
                </div>

                {/* Описание */}
                <div className="description-container">
                    <p className="description-text">
                        Интеллектуальная система преобразования<br/>
                        медицинской речи в структурированные<br/>
                        протоколы и отчеты.
                    </p>
                </div>

                {/* Кнопки */}
                <div className="button-container">
                    <button
                        className="regButton"
                        onClick={() => navigate('/register')}
                    >
                        РЕГИСТРАЦИЯ
                    </button>

                    <button
                        className="loginButton"
                        onClick={() => navigate('/login')}
                    >
                        ВХОД
                    </button>
                </div>
            </div>
        </div>
    );
}
