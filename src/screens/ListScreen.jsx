import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IoChevronForward, IoStar } from 'react-icons/io5';
import { consultationsAPI } from '../api/apiClient';
import '../css/ListScreen.css';

const statusColors = {
    ready: '#2ECC71',
    processing: '#F1C40F',
    pending: '#F1C40F',
    created: '#B0B0B0',
    transcribing: '#F1C40F',
    generating: '#F1C40F',
    error: '#E74C3C',
    draft: '#B0B0B0',
};

const statusLabels = {
    ready: 'Готово',
    processing: 'Обработка',
    pending: 'Ожидание',
    created: 'Создано',
    transcribing: 'Транскрибация',
    generating: 'Генерация',
    error: 'Ошибка',
    draft: 'Черновик',
};

export default function ListScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isFavoritesMode = searchParams.get('favorites') === '1';
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadConsultations();
    }, [isFavoritesMode]);

    const loadConsultations = async () => {
        try {
            setLoading(true);
            const { data } = await consultationsAPI.getAll({ ordering: '-created_at' });
            let items = Array.isArray(data) ? data : (data.results || []);
            if (isFavoritesMode) {
                const favs = JSON.parse(localStorage.getItem('clinspeech_favorites') || '[]');
                items = items.filter(c => favs.includes(c.id));
            }
            setConsultations(items);
        } catch (err) {
            setError('Не удалось загрузить консультации');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const getDiagnosis = (item) => {
        if (!item.final_report) return 'Диагноз не определён';
        try {
            const report = JSON.parse(item.final_report);
            return report.diagnosis || 'Диагноз не определён';
        } catch {
            return 'Диагноз не определён';
        }
    };

    return (
        <div className="list-container">
            <h2 className="title">
                {isFavoritesMode && <IoStar size={20} color="#FFD700" style={{ marginRight: 8 }} />}
                {isFavoritesMode ? 'Избранные записи' : 'Последние записи'}
            </h2>

            {loading && <p style={{ textAlign: 'center', padding: 20 }}>Загрузка...</p>}
            {error && <p style={{ textAlign: 'center', color: '#E74C3C', padding: 20 }}>{error}</p>}

            <div className="scrollContainer">
                {!loading && consultations.length === 0 && (
                    <p style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                        Нет консультаций. Начните новый приём!
                    </p>
                )}

                {consultations.map(item => (
                    <div
                        key={item.id}
                        className="card"
                        onClick={() => navigate(`/detail/${item.id}`)}
                    >
                        <div className="cardHeader">
                            <div className="statusRow">
                                <div
                                    className="statusDot"
                                    style={{ backgroundColor: statusColors[item.status] || '#B0B0B0' }}
                                />
                                <span
                                    className="statusText"
                                    style={{ color: statusColors[item.status] || '#B0B0B0' }}
                                >
                                    {statusLabels[item.status] || item.status}
                                </span>
                            </div>
                            <span className="dateText">{formatDate(item.created_at)}</span>
                        </div>

                        <div className="cardBody">
                            <div className="cardInfo">
                                <p className="nameText">
                                    {item.patient_info
                                        ? `${item.patient_info.last_name} ${item.patient_info.first_name?.charAt(0)}. ${item.patient_info.middle_name?.charAt(0) || ''}.`
                                        : 'Пациент не указан'}
                                </p>
                                <p className="infoText">{getDiagnosis(item)}</p>
                                <p className="infoText">{item.doctor_name || ''}</p>
                            </div>
                            <IoChevronForward size={26} color="#000" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
