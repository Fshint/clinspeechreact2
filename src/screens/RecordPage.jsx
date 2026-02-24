import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoChevronBack } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { consultationsAPI, patientsAPI } from '../api/apiClient';
import { MainButton as Main_Button } from '../assets';
import '../css/RecordPage.css';
import '../css/ConfirmScreen.css';

export default function RecordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const WAVES = 8;
    const MAX_OFFSET = 40;
    const [micLevel, setMicLevel] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Выбор пациента
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingPatients, setLoadingPatients] = useState(true);

    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const rafRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    useEffect(() => {
        loadPatients();
    }, []);

    // Handle preselected patient from navigation state (e.g., "Create new based on this")
    useEffect(() => {
        const preselectedId = location.state?.preselectedPatient;
        if (preselectedId && patients.length > 0 && !selectedPatient) {
            const found = patients.find(p => p.id === preselectedId);
            if (found) setSelectedPatient(found);
        }
    }, [patients, location.state]);

    const loadPatients = async () => {
        try {
            setLoadingPatients(true);
            const { data } = await patientsAPI.getAll();
            const items = Array.isArray(data) ? data : (data.results || []);
            setPatients(items);
        } catch (err) {
            console.error('Failed to load patients', err);
        } finally {
            setLoadingPatients(false);
        }
    };

    const filteredPatients = patients.filter(p => {
        const fullName = `${p.last_name} ${p.first_name} ${p.middle_name || ''}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
    });

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        startRecording();
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setIsRecording(true);

            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            const data = new Uint8Array(analyser.frequencyBinCount);
            const src = ctx.createMediaStreamSource(stream);
            src.connect(analyser);
            audioCtxRef.current = ctx;
            analyserRef.current = analyser;

            const tick = () => {
                analyser.getByteTimeDomainData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) {
                    const v = (data[i] - 128) / 128;
                    sum += v * v;
                }
                const rms = Math.sqrt(sum / data.length);
                setMicLevel(Math.min(1, rms * 40));
                rafRef.current = requestAnimationFrame(tick);
            };
            tick();

            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
        } catch (e) {
            console.log('Mic error', e);
            alert('Не удалось получить доступ к микрофону');
        }
    };

    const stopAll = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
    };

    useEffect(() => {
        return () => stopAll();
    }, []);

    const handleStopAndSend = async () => {
        if (!mediaRecorderRef.current || isSending || !selectedPatient) return;

        setIsRecording(false);
        setIsSending(true);

        await new Promise((resolve) => {
            mediaRecorderRef.current.onstop = resolve;
            mediaRecorderRef.current.stop();
        });

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close();
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `consult_${timestamp}.webm`;

        const formData = new FormData();
        formData.append('audio_file', audioBlob, fileName);
        formData.append('patient', selectedPatient.id);

        try {
            const { data } = await consultationsAPI.create(formData);
            try {
                await consultationsAPI.startProcessing(data.id);
            } catch (procErr) {
                console.warn('Auto-processing failed, can be triggered manually', procErr);
            }
            navigate(`/detail/${data.id}`, { replace: true });
        } catch (err) {
            console.error('Upload error', err);
            const detail = err.response?.data?.detail
                || err.response?.data?.error
                || (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : '')
                || 'Проверьте подключение';
            alert('Ошибка при отправке записи: ' + detail);
            setIsSending(false);
            setIsRecording(true);
        }
    };

    // Экран выбора пациента
    if (!selectedPatient) {
        return (
            <div className="record-master" style={{ background: 'linear-gradient(160deg, #0a1628 0%, #1a2a4a 50%, #0d3251 100%)' }}>
                <button className="back" onClick={() => navigate(-1)}>
                    <IoChevronBack size={28} color="white" />
                </button>

                <h1 className="title" style={{ marginTop: 60 }}>Выберите пациента</h1>

                <div style={{ padding: '0 20px', width: '100%', maxWidth: 500 }}>
                    <input
                        type="text"
                        placeholder="Поиск по ФИО..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="patientSearchInput"
                    />
                </div>

                <div style={{
                    flex: 1, overflow: 'auto', padding: '12px 20px',
                    maxHeight: 'calc(100vh - 220px)', width: '100%', maxWidth: 500,
                }}>
                    {loadingPatients && (
                        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Загрузка...</p>
                    )}

                    {!loadingPatients && filteredPatients.length === 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 24 }}>
                            {patients.length === 0 ? 'Нет пациентов. Сначала добавьте пациента.' : 'Ничего не найдено'}
                        </p>
                    )}

                    {filteredPatients.map(p => (
                        <button
                            key={p.id}
                            onClick={() => handleSelectPatient(p)}
                            className="patientCard"
                        >
                            <div className="patientCardName">
                                {p.last_name} {p.first_name} {p.middle_name || ''}
                            </div>
                            <div className="patientCardInfo">
                                Дата рождения: {p.birth_date || '—'}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Экран записи
    return (
        <div className="record-master">
            <div className="gradient-bg" />
            <button className="back" onClick={() => navigate(-1)}>
                <IoChevronBack size={28} color="white" />
            </button>

            <h1 className="title">{isSending ? 'Отправка...' : 'Слушаю'}</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 14, marginTop: -12 }}>
                Пациент: {selectedPatient.last_name} {selectedPatient.first_name}
            </p>

            <div className="center">
                {[...Array(WAVES)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="wave"
                        animate={{
                            opacity: [0.3, 0.7, 0.3],
                            scale: [0.4, 1 + micLevel, 0.4],
                            x: [(Math.random() * 2 - 1) * MAX_OFFSET * micLevel, 0],
                            y: [(Math.random() * 2 - 1) * MAX_OFFSET * micLevel, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                <img
                    src={Main_Button}
                    alt="mic"
                    className="button"
                    onClick={handleStopAndSend}
                    style={{ cursor: isSending ? 'wait' : 'pointer' }}
                />
            </div>
        </div>
    );
}
