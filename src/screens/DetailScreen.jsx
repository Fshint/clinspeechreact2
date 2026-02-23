import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IoChevronBack,
    IoChevronDown,
    IoChevronUp,
    IoStarOutline,
    IoTrashOutline,
    IoChevronForward
} from 'react-icons/io5';
import { MdMic } from 'react-icons/md';
import '../css/DetailScreen.css';

const PRIMARY_COLOR = '#00BFFF';

const Accordion = ({ title, children, isOpenDefault = false }) => {
    const [isOpen, setIsOpen] = useState(isOpenDefault);

    return (
        <div className="accordionContainer">
            <button
                className={`accordionHeader ${!isOpen ? 'accordionHeaderClosed' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="accordionTitle">{title}</span>
                {isOpen ? (
                    <IoChevronUp size={20} color="#FFF" />
                ) : (
                    <IoChevronDown size={20} color="#FFF" />
                )}
            </button>
            {isOpen && <div className="accordionBody">{children}</div>}
        </div>
    );
};

export default function DetailScreen() {
    const navigate = useNavigate();
    const waveHeights = [
        10, 20, 15, 30, 40, 25, 50, 70, 45, 80, 50, 90, 60, 40, 75, 50, 30, 45, 20, 15, 10
    ];

    return (
        <div className="mainWrapper">
            <div className="safeArea">
                <div className="scrollView">
                    {/* HEADER */}
                    <header className="header">
                        <button onClick={() => navigate(-1)}>
                            <IoChevronBack size={28} color="#000" />
                        </button>
                        <h2 className="headerTitle">Чета там чета там</h2>
                        <div className="headerIcons">
                            <button className="iconButton">
                                <IoStarOutline size={24} color="#FFD700" />
                            </button>
                            <button className="iconButton">
                                <IoTrashOutline size={24} color="#FF4D4D" />
                            </button>
                        </div>
                    </header>

                    {/* PLAYER */}
                    <section className="playerSection">
                        <div className="statusRow">
                            <div className="statusDot" />
                            <span className="statusText">Готово</span>
                        </div>

                        <p className="timeText">10:15:25</p>

                        <div className="waveContainer">
                            {waveHeights.map((h, i) => (
                                <div key={i} className="waveBar" style={{ height: h }} />
                            ))}
                        </div>

                        <p className="fileName">consult_16-10-2024_12-30.mp3</p>

                        <div className="progressBarBackground">
                            <div className="progressBarFill" />
                            <div className="progressThumb" />
                        </div>

                        <div className="playerControls">
                            <button>
                                <IoChevronBack size={24} color={PRIMARY_COLOR} />
                            </button>
                            <button>
                                <MdMic size={40} color={PRIMARY_COLOR} />
                            </button>
                            <button>
                                <IoChevronForward size={24} color={PRIMARY_COLOR} />
                            </button>
                        </div>
                    </section>

                    {/* ACCORDIONS */}
                    <Accordion title="Общие данные" isOpenDefault={true}>
                        <p className="bodyText">ФИО: Чето там чета там чета таааам</p>
                        <p className="bodyText">ИИН: 130311504603</p>
                        <p className="bodyText">Возраст: ** лет</p>
                        <p className="bodyText">Дата: 19.11.2024 (Время: 09:56)</p>
                        <p className="bodyText">Врач: Семейный врач – организация ТОО "блаблабла"</p>
                    </Accordion>

                    <Accordion title="Юридическая информация">
                        <p className="bodyText">Организация: ТОО "блаблабла"</p>
                        <p className="bodyText">БСН (БИН): 2526262682682</p>
                        <p className="bodyText">
                            Форма: №052/у (Утв. приказом МЗ РК № ҚР ДСМ-175/2020 от 30.10.2020)
                        </p>
                    </Accordion>

                    <Accordion title="Клиническая картина">
                        <p className="bodyText">
                            <strong>ЖАЛОБЫ ПАЦИЕНТА:</strong>
                            <br />
                            На жжение и/или болезненное мочеиспускание...
                        </p>
                    </Accordion>

                    <Accordion title="Диагноз (МКБ-10)">
                        <p className="bodyText">Диагноз: Острый цистит</p>
                    </Accordion>

                    <Accordion title="Лечение и назначение">
                        <p className="bodyText">1. АНТИБАКТЕРИАЛЬНАЯ ТЕРАПИЯ (Основная):</p>
                        <p className="bodyText">• Цефтриаксон: по 1.0 мл х 1 раз в день...</p>
                    </Accordion>

                    <Accordion title="Рекомендации и физиолечение">
                        <p className="bodyText">• Физиолечение показано.</p>
                        <p className="bodyText">• Обильное питье, соблюдение диеты.</p>
                    </Accordion>

                    <Accordion title="Подпись">
                        <p className="bodyText">Врач: Шахмуханбетов Ханкелді Ерболулы</p>
                    </Accordion>

                    {/* ACTIONS */}
                    <div className="actionRow">
                        <button className="actionButton">ПОДРОБНЕЕ</button>
                        <button className="actionButton">ЭКСПОРТ PDF</button>
                    </div>

                    <button className="createNewButton">
                        <span className="createNewText">Создать новый на основе этого</span>
                    </button>

                    <div className="fabContainer">
                        <div className="fabOuterRing">
                            <div className="fabInnerRing">
                                <button className="fabButton">
                                    <MdMic size={45} color="#FFF" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
