import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronForward } from 'react-icons/io5';
import '../css/ListScreen.css';

const DATA = [
    {
        id: '1',
        status: 'ready',
        statusText: 'Готово',
        date: '28.12.2025, 15:31',
        name: 'Аббасов Р. Ш.',
        diagnosis: 'Острый цистит',
        doctor: 'Семейный врач (ВОП)',
    },
    {
        id: '2',
        status: 'sending',
        statusText: 'Отправка',
        date: '28.12.2025, 15:31',
        name: 'Аббасов Р. Ш.',
        diagnosis: 'Острый цистит',
        doctor: 'Семейный врач (ВОП)',
    },
    {
        id: '3',
        status: 'error',
        statusText: 'Ошибка сети',
        date: '27.12.2025, 18:02',
        name: 'Ибраев А. К.',
        diagnosis: 'ОРВИ',
        doctor: 'Терапевт',
    },
];

const statusColors = {
    ready: '#2ECC71',
    sending: '#F1C40F',
    error: '#E74C3C',
    draft: '#B0B0B0',
};

export default function ListScreen() {
    const navigate = useNavigate();

    return (
        <div className="list-container">
            <h2 className="title">Последние записи</h2>

            <div className="scrollContainer">
                {DATA.map(item => (
                    <div
                        key={item.id}
                        className="card"
                        onClick={() => item.id === '1' && navigate('/detail')}
                    >
                        <div className="cardHeader">
                            <div className="statusRow">
                                <div
                                    className="statusDot"
                                    style={{ backgroundColor: statusColors[item.status] }}
                                />
                                <span
                                    className="statusText"
                                    style={{ color: statusColors[item.status] }}
                                >
                  {item.statusText}
                </span>
                            </div>
                            <span className="dateText">{item.date}</span>
                        </div>

                        <div className="cardBody">
                            <div className="cardInfo">
                                <p className="nameText">{item.name}</p>
                                <p className="infoText">{item.diagnosis}</p>
                                <p className="infoText">{item.doctor}</p>
                            </div>
                            <IoChevronForward size={26} color="#000" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
