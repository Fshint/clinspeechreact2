import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronForward, IoDocumentTextOutline } from 'react-icons/io5';
import { consultationsAPI } from '../api/apiClient';
import '../css/ListScreen.css';

const statusColors = {
    ready: '#2ECC71', processing: '#F1C40F', pending: '#F1C40F',
    created: '#B0B0B0', transcribing: '#F1C40F', generating: '#F1C40F',
    error: '#E74C3C', draft: '#B0B0B0',
};

export default function ArchiveScreen() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const { data } = await consultationsAPI.getAll({ ordering: '-created_at', status: 'ready' });
            const list = Array.isArray(data) ? data : (data.results || []);
            setItems(list.filter(c => c.status === 'ready'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const getDiagnosis = (item) => {
        if (!item.final_report) return 'Диагноз не определён';
        try { return JSON.parse(item.final_report).diagnosis || 'Диагноз не определён'; }
        catch { return 'Диагноз не определён'; }
    };

    return (
        <div className="list-container">
            <h2 className="title">📂 Архив готовых отчётов</h2>

            {loading && <p style={{ textAlign: 'center', padding: 20, color: '#999' }}>Загрузка...</p>}

            {!loading && items.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    <IoDocumentTextOutline size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>Нет готовых отчётов</p>
                    <p style={{ fontSize: 14, opacity: 0.7 }}>Завершённые консультации появятся здесь</p>
                </div>
            )}

            <div className="scrollContainer">
                {items.map(item => (
                    <div key={item.id} className="card" onClick={() => navigate(`/detail/${item.id}`)}>
                        <div className="cardHeader">
                            <div className="statusRow">
                                <div className="statusDot" style={{ backgroundColor: '#2ECC71' }} />
                                <span className="statusText" style={{ color: '#2ECC71' }}>Готово</span>
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
                            </div>
                            <IoChevronForward size={22} color="#999" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
