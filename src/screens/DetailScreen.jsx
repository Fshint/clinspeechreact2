import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    IoChevronBack,
    IoChevronDown,
    IoChevronUp,
    IoStar,
    IoStarOutline,
    IoTrashOutline,
    IoPlayCircle,
    IoPauseCircle,
    IoPlaySkipBack,
    IoPlaySkipForward,
    IoCloudUploadOutline,
    IoCloseCircle,
    IoImageOutline,
    IoExpandOutline,
} from 'react-icons/io5';
import { MdMic } from 'react-icons/md';
import { consultationsAPI, imagesAPI } from '../api/apiClient';
import '../css/DetailScreen.css';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api$/, '');

const Accordion = ({ title, children, isOpen, onToggle }) => (
    <div className="accordionContainer">
        <button
            className={`accordionHeader ${!isOpen ? 'accordionHeaderClosed' : ''}`}
            onClick={onToggle}
        >
            <span className="accordionTitle">{title}</span>
            {isOpen ? <IoChevronUp size={20} color="#FFF" /> : <IoChevronDown size={20} color="#FFF" />}
        </button>
        {isOpen && <div className="accordionBody">{children}</div>}
    </div>
);

const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function DetailScreen() {
    const navigate = useNavigate();
    const { id } = useParams();
    const audioRef = useRef(null);
    const fileInputRef = useRef(null);

    const [consultation, setConsultation] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingLoading, setProcessingLoading] = useState(false);

    // Audio player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Accordions
    const [openAccordions, setOpenAccordions] = useState({ general: true });

    // Analysis images
    const [analysisImages, setAnalysisImages] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageDescription, setImageDescription] = useState('');
    const [lightboxImg, setLightboxImg] = useState(null);

    // Favorites (localStorage)
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        loadConsultation();
        loadImages();
        const favs = JSON.parse(localStorage.getItem('clinspeech_favorites') || '[]');
        setIsFavorite(favs.includes(Number(id)));
    }, [id]);

    useEffect(() => {
        if (!consultation) return;
        if (['processing', 'generating', 'transcribing'].includes(consultation.status)) {
            const interval = setInterval(() => loadConsultation(true), 5000);
            return () => clearInterval(interval);
        }
    }, [consultation?.status]);

    const loadConsultation = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const { data } = await consultationsAPI.getById(id);
            setConsultation(data);
            if (data.final_report) {
                try { setReport(JSON.parse(data.final_report)); } catch { setReport(null); }
            }
        } catch (err) {
            if (!silent) setError('Не удалось загрузить консультацию');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const loadImages = async () => {
        try {
            const { data } = await imagesAPI.getByConsultation(id);
            setAnalysisImages(Array.isArray(data) ? data : (data.results || []));
        } catch (err) { console.error('Images load error', err); }
    };

    const handleStartProcessing = async () => {
        try {
            setProcessingLoading(true);
            await consultationsAPI.startProcessing(id);
            await loadConsultation();
        } catch (err) {
            alert('Ошибка запуска обработки: ' + (err.response?.data?.error || 'Попробуйте снова'));
        } finally {
            setProcessingLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Удалить консультацию?')) return;
        try {
            await consultationsAPI.delete(id);
            navigate(-1);
        } catch { alert('Ошибка при удалении'); }
    };

    const handleExportPDF = () => {
        if (consultation?.report_file) {
            const url = consultation.report_file.startsWith('http')
                ? consultation.report_file
                : `${API_BASE}${consultation.report_file}`;
            window.open(url, '_blank');
        } else {
            alert('PDF отчёт ещё не сгенерирован');
        }
    };

    // Toggle favorite in localStorage
    const toggleFavorite = () => {
        const favs = JSON.parse(localStorage.getItem('clinspeech_favorites') || '[]');
        const numId = Number(id);
        const next = isFavorite ? favs.filter(f => f !== numId) : [...favs, numId];
        localStorage.setItem('clinspeech_favorites', JSON.stringify(next));
        setIsFavorite(!isFavorite);
    };

    // Accordion toggling
    const toggleAccordion = useCallback((key) => {
        setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const expandAll = () => {
        setOpenAccordions({
            general: true, legal: true, clinical: true,
            diagnosis: true, treatment: true, recommendations: true, signature: true,
        });
    };

    // Audio player
    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) { audioRef.current.pause(); }
        else { audioRef.current.play().catch(() => {}); }
        setIsPlaying(!isPlaying);
    };

    const seekBy = (seconds) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
    };

    const handleSeek = (e) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audioRef.current.currentTime = pct * duration;
    };

    const audioUrl = consultation?.audio_file
        ? (consultation.audio_file.startsWith('http') ? consultation.audio_file : `${API_BASE}${consultation.audio_file}`)
        : null;

    // Image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploadingImage(true);
            await imagesAPI.upload(id, file, imageDescription);
            setImageDescription('');
            await loadImages();
        } catch (err) {
            alert('Ошибка загрузки изображения: ' + (err.response?.data?.detail || 'Попробуйте снова'));
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleImageDelete = async (imgId) => {
        if (!window.confirm('Удалить изображение?')) return;
        try {
            await imagesAPI.delete(imgId);
            setAnalysisImages(prev => prev.filter(img => img.id !== imgId));
        } catch { alert('Ошибка удаления'); }
    };

    const getImageUrl = (img) => {
        const src = img.image || img.file;
        if (!src) return '';
        return src.startsWith('http') ? src : `${API_BASE}${src}`;
    };

    // Create new consultation based on this one
    const handleCreateNew = () => {
        const patientId = consultation?.patient || consultation?.patient_info?.id;
        navigate('/record', { state: { preselectedPatient: patientId } });
    };

    if (loading) return <div className="detailLoading">Загрузка...</div>;
    if (error) return <div className="detailError">{error}</div>;
    if (!consultation) return null;

    const patient = consultation.patient_info;
    const patientName = patient
        ? `${patient.last_name} ${patient.first_name} ${patient.middle_name || ''}`.trim()
        : 'Пациент не указан';

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const statusMap = {
        ready: { label: 'Готово', color: '#2ECC71' },
        processing: { label: 'Обработка...', color: '#F1C40F' },
        transcribing: { label: 'Транскрипция...', color: '#F1C40F' },
        generating: { label: 'Генерация отчёта...', color: '#F1C40F' },
        error: { label: 'Ошибка', color: '#E74C3C' },
        created: { label: 'Создано', color: '#B0B0B0' },
        draft: { label: 'Черновик', color: '#95A5A6' },
    };
    const st = statusMap[consultation.status] || { label: consultation.status, color: '#B0B0B0' };

    return (
        <div className="mainWrapper">
            <div className="safeArea">
                <div className="scrollView">
                    {/* HEADER */}
                    <header className="header">
                        <button onClick={() => navigate(-1)}>
                            <IoChevronBack size={28} color="#000" />
                        </button>
                        <h2 className="headerTitle">{patientName}</h2>
                        <div className="headerIcons">
                            <button className="iconButton" onClick={toggleFavorite} title="Избранное">
                                {isFavorite
                                    ? <IoStar size={24} color="#FFD700" />
                                    : <IoStarOutline size={24} color="#FFD700" />}
                            </button>
                            <button className="iconButton" onClick={handleDelete} title="Удалить">
                                <IoTrashOutline size={24} color="#FF4D4D" />
                            </button>
                        </div>
                    </header>

                    {/* PLAYER SECTION */}
                    <section className="playerSection">
                        <div className="statusRow">
                            <div className="statusDot" style={{ backgroundColor: st.color }} />
                            <span className="statusText" style={{ color: st.color }}>{st.label}</span>
                        </div>

                        {(consultation.status === 'created' || consultation.status === 'error') && (
                            <button
                                className="processingButton"
                                onClick={handleStartProcessing}
                                disabled={processingLoading}
                            >
                                {processingLoading ? '⏳ Запуск...' : '🤖 Запустить ИИ-обработку'}
                            </button>
                        )}

                        {['processing', 'generating', 'transcribing'].includes(consultation.status) && (
                            <p className="processingHint">
                                ⏳ Обработка идёт, страница обновится автоматически...
                            </p>
                        )}

                        {audioUrl ? (
                            <>
                                <audio
                                    ref={audioRef}
                                    src={audioUrl}
                                    onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                                    onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                                    onEnded={() => setIsPlaying(false)}
                                />
                                <p className="fileName">{consultation.audio_file.split('/').pop()}</p>

                                <div className="progressBarBackground" onClick={handleSeek}>
                                    <div className="progressBarFill" style={{ width: `${progress}%` }} />
                                    <div className="progressThumb" style={{ left: `${progress}%` }} />
                                </div>

                                <div className="timeRow">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>

                                <div className="playerControls">
                                    <button onClick={() => seekBy(-10)} title="-10 сек">
                                        <IoPlaySkipBack size={28} color="var(--primary)" />
                                    </button>
                                    <button onClick={togglePlay} className="playBtn">
                                        {isPlaying
                                            ? <IoPauseCircle size={56} color="var(--primary)" />
                                            : <IoPlayCircle size={56} color="var(--primary)" />}
                                    </button>
                                    <button onClick={() => seekBy(10)} title="+10 сек">
                                        <IoPlaySkipForward size={28} color="var(--primary)" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="noAudio">Аудио не загружено</p>
                        )}
                    </section>

                    {/* ANALYSIS IMAGES */}
                    <section className="imagesSection">
                        <div className="imagesSectionHeader">
                            <h3 className="imagesSectionTitle">
                                <IoImageOutline size={20} /> Анализы и снимки
                                {analysisImages.length > 0 && (
                                    <span className="imagesBadge">{analysisImages.length}</span>
                                )}
                            </h3>
                        </div>

                        {analysisImages.length > 0 && (
                            <div className="imagesGrid">
                                {analysisImages.map(img => (
                                    <div key={img.id} className="imageCard">
                                        <img
                                            src={getImageUrl(img)}
                                            alt={img.description || 'Анализ'}
                                            className="imageThumb"
                                            onClick={() => setLightboxImg(getImageUrl(img))}
                                        />
                                        <div className="imageCardOverlay">
                                            {img.description && (
                                                <span className="imageDesc">{img.description}</span>
                                            )}
                                            <button
                                                className="imageDeleteBtn"
                                                onClick={() => handleImageDelete(img.id)}
                                                title="Удалить"
                                            >
                                                <IoTrashOutline size={16} color="#fff" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="imageUploadArea">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                                id="analysis-upload"
                            />
                            <input
                                type="text"
                                className="imageDescInput"
                                placeholder="Описание (необязательно)"
                                value={imageDescription}
                                onChange={e => setImageDescription(e.target.value)}
                            />
                            <button
                                className="imageUploadBtn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                            >
                                <IoCloudUploadOutline size={20} />
                                {uploadingImage ? 'Загрузка...' : 'Прикрепить снимок'}
                            </button>
                        </div>
                    </section>

                    {/* ACCORDIONS */}
                    <Accordion
                        title="Общие данные"
                        isOpen={!!openAccordions.general}
                        onToggle={() => toggleAccordion('general')}
                    >
                        <p className="bodyText">ФИО: {patientName}</p>
                        {patient?.birth_date && <p className="bodyText">Дата рождения: {patient.birth_date}</p>}
                        <p className="bodyText">Дата: {new Date(consultation.created_at).toLocaleString('ru-RU')}</p>
                        <p className="bodyText">Врач: {consultation.doctor_name || '—'}</p>
                    </Accordion>

                    {report?.legal_info && (
                        <Accordion
                            title="Юридическая информация"
                            isOpen={!!openAccordions.legal}
                            onToggle={() => toggleAccordion('legal')}
                        >
                            <p className="bodyText">{report.legal_info}</p>
                        </Accordion>
                    )}

                    <Accordion
                        title="Клиническая картина"
                        isOpen={!!openAccordions.clinical}
                        onToggle={() => toggleAccordion('clinical')}
                    >
                        <p className="bodyText">
                            {report?.complaints
                                ? <><strong>ЖАЛОБЫ ПАЦИЕНТА:</strong><br />{report.complaints}</>
                                : (consultation.raw_transcription || 'Данные отсутствуют')}
                        </p>
                    </Accordion>

                    <Accordion
                        title="Диагноз (МКБ-10)"
                        isOpen={!!openAccordions.diagnosis}
                        onToggle={() => toggleAccordion('diagnosis')}
                    >
                        <p className="bodyText">Диагноз: {report?.diagnosis || 'Не определён'}</p>
                    </Accordion>

                    {report?.treatment && (
                        <Accordion
                            title="Лечение и назначение"
                            isOpen={!!openAccordions.treatment}
                            onToggle={() => toggleAccordion('treatment')}
                        >
                            <p className="bodyText">{report.treatment}</p>
                        </Accordion>
                    )}

                    {report?.recommendations && (
                        <Accordion
                            title="Рекомендации и физиолечение"
                            isOpen={!!openAccordions.recommendations}
                            onToggle={() => toggleAccordion('recommendations')}
                        >
                            <p className="bodyText">{report.recommendations}</p>
                        </Accordion>
                    )}

                    <Accordion
                        title="Подпись"
                        isOpen={!!openAccordions.signature}
                        onToggle={() => toggleAccordion('signature')}
                    >
                        <p className="bodyText">Врач: {consultation.doctor_name || '—'}</p>
                    </Accordion>

                    {/* ACTION BUTTONS */}
                    <div className="actionRow">
                        <button className="actionButton" onClick={expandAll}>
                            <IoExpandOutline size={16} style={{ marginRight: 6 }} />
                            ПОДРОБНЕЕ
                        </button>
                        <button className="actionButton" onClick={handleExportPDF}>
                            ЭКСПОРТ PDF
                        </button>
                    </div>

                    <button className="createNewButton" onClick={handleCreateNew}>
                        <span className="createNewText">Создать новый на основе этого</span>
                    </button>

                    <div className="fabContainer">
                        <div className="fabOuterRing">
                            <div className="fabInnerRing">
                                <button className="fabButton" onClick={() => navigate('/record')}>
                                    <MdMic size={45} color="#FFF" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX */}
            {lightboxImg && (
                <div className="lightboxOverlay" onClick={() => setLightboxImg(null)}>
                    <button className="lightboxClose" onClick={() => setLightboxImg(null)}>
                        <IoCloseCircle size={36} color="#fff" />
                    </button>
                    <img src={lightboxImg} alt="Просмотр" className="lightboxImage" />
                </div>
            )}
        </div>
    );
}
