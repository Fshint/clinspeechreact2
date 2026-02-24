import React, { useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoHomeOutline, IoHome,
    IoArchiveOutline, IoArchive,
    IoPeopleOutline, IoPeople,
    IoPersonOutline, IoPerson,
} from 'react-icons/io5';
import HomeScreen from '../screens/HomeScreen';
import ListScreen from '../screens/ListScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import PatientsScreen from '../screens/PatientsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { iconRecord, iconList, iconFavorites } from '../assets';
import '../css/TabNavigator.css';

const Placeholder = ({ name }) => (
    <div className="placeholder">
        <p>Экран {name} в разработке</p>
    </div>
);

const TAB_CONFIG = [
    { label: 'Главная',   route: '/main/home',     icon: IoHomeOutline,    iconActive: IoHome },
    { label: 'Архив',     route: '/main/archive',   icon: IoArchiveOutline, iconActive: IoArchive },
    { label: 'Пациенты',  route: '/main/patients',  icon: IoPeopleOutline,  iconActive: IoPeople },
    { label: 'Профиль',   route: '/main/profile',   icon: IoPersonOutline,  iconActive: IoPerson },
];

function CustomTabBar({ currentTab, setCurrentTab }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleSubMenuPress = (action) => {
        setIsMenuOpen(false);
        if (action === 'Записать') navigate('/record');
        else if (action === 'Список') navigate('/main/list');
        else if (action === 'Избранные') navigate('/main/list?favorites=1');
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
                                <img src={iconRecord} alt="record" />
                                <span>Записать</span>
                            </button>

                            <button
                                className="subMenuItem"
                                onClick={() => handleSubMenuPress('Список')}
                            >
                                <img src={iconList} alt="list" />
                                <span>Список</span>
                            </button>

                            <button
                                className="subMenuItem"
                                onClick={() => handleSubMenuPress('Избранные')}
                            >
                                <img src={iconFavorites} alt="favorites" />
                                <span>Избранные</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Основные вкладки */}
            <div className="mainTabBarContainer">
                <div className="tabsRow">
                    {TAB_CONFIG.map((tab) => {
                        const isActive = currentTab === tab.label;
                        const Icon = isActive ? tab.iconActive : tab.icon;

                        return (
                            <button
                                key={tab.label}
                                className={`tabItem ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    if (tab.label === 'Главная') {
                                        setIsMenuOpen(!isMenuOpen);
                                        setCurrentTab(tab.label);
                                    } else {
                                        setIsMenuOpen(false);
                                        setCurrentTab(tab.label);
                                        navigate(tab.route);
                                    }
                                }}
                            >
                                <div className="iconContainer">
                                    <Icon size={22} color="#fff" />
                                    <span>{tab.label}</span>
                                </div>
                            </button>
                        );
                    })}
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
                <Route index element={<HomeScreen />} />
                <Route path="home" element={<HomeScreen />} />
                <Route path="list" element={<ListScreen />} />
                <Route path="archive" element={<ArchiveScreen />} />
                <Route path="patients" element={<PatientsScreen />} />
                <Route path="profile" element={<ProfileScreen />} />
            </Routes>

            <CustomTabBar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        </div>
    );
}
