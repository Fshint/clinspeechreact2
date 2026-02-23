import React, { useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HomeScreen from '../screens/HomeScreen';
import ListScreen from '../screens/ListScreen';
import '../css/TabNavigator.css';

const Placeholder = ({ name }) => (
    <div className="placeholder">
        <p>Экран {name} в разработке</p>
    </div>
);

function CustomTabBar({ currentTab, setCurrentTab }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleSubMenuPress = (action) => {
        setIsMenuOpen(false);
        if (action === 'Записать') navigate('/home/record');
        else if (action === 'Список') navigate('/home/list');
        else alert(`Раздел ${action} в разработке`);
    };

    return (
        <div className="tabBarWrapper">
            {/* Оверлей */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Подменю */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="subMenuContainer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <div className="gradientBackground">
                            <button
                                className="subMenuItem"
                                onClick={() => handleSubMenuPress('Записать')}
                            >
                                <img src="/assets/record.png" alt="record" />
                                <span>Записать</span>
                            </button>

                            <button
                                className="subMenuItem"
                                onClick={() => handleSubMenuPress('Список')}
                            >
                                <img src="/assets/list.png" alt="list" />
                                <span>Список</span>
                            </button>

                            <button
                                className="subMenuItem"
                                onClick={() => handleSubMenuPress('Избранные')}
                            >
                                <img src="/assets/favorites.png" alt="favorites" />
                                <span>Избранные</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Основные вкладки */}
            <div className="mainTabBarContainer">
                <div className="tabsRow">
                    {['Главная', 'Архив', 'Пациенты', 'Профиль'].map((tab) => (
                        <button
                            key={tab}
                            className={`tabItem ${currentTab === tab ? 'active' : ''}`}
                            onClick={() => {
                                if (tab === 'Главная') {
                                    setIsMenuOpen(!isMenuOpen);
                                    setCurrentTab(tab);
                                } else {
                                    setIsMenuOpen(false);
                                    setCurrentTab(tab);
                                    navigate(`/${tab.toLowerCase()}`);
                                }
                            }}
                        >
                            <div className="iconContainer">
                                <img src={`/assets/${tab.toLowerCase()}.png`} alt={tab} />
                                <span>{tab}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function TabNavigator() {
    const [currentTab, setCurrentTab] = useState('Главная');

    return (
        <div className="tabNavigator">
            <Routes>
                <Route path="/home/record" element={<HomeScreen />} />
                <Route path="/home/list" element={<ListScreen />} />
                <Route path="/archive" element={<Placeholder name="Архив" />} />
                <Route path="/пациенты" element={<Placeholder name="Пациенты" />} />
                <Route path="/профиль" element={<Placeholder name="Профиль" />} />
            </Routes>

            <CustomTabBar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        </div>
    );
}
