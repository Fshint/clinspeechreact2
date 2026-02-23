import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBack } from 'react-icons/io5';
import { motion } from 'framer-motion';
import '../css/ConfirmScreen.css';

export default function RecordPage() {
    const navigate = useNavigate();
    const WAVES = 8;
    const MAX_OFFSET = 40;

    const micLevel = useRef(0);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const rafRef = useRef(null);

    const SENSITIVITY = 40;

    useEffect(() => {
        startWebMic();
        return () => stopWebMic();
    }, []);

    const startWebMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
                micLevel.current = Math.min(1, rms * SENSITIVITY);
                rafRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch (e) {
            console.log('Web mic error', e);
        }
    };

    const stopWebMic = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close();
    };

    return (
        <div className="record-master">
            {/* Градиентный фон */}
            <div className="gradient-bg"></div>

            {/* Кнопка назад */}
            <button className="back" onClick={() => navigate(-1)}>
                <IoChevronBack size={32} color="white" />
            </button>

            {/* Заголовок */}
            <h1 className="title">Слушаю</h1>

            {/* Центр с волнами и кнопкой */}
            <div className="center">
                {[...Array(WAVES)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="wave"
                        animate={{
                            opacity: [0.3, 0.7, 0.3],
                            scale: [0.4, 1.2, 0.4],
                            x: [(Math.random() * 2 - 1) * MAX_OFFSET, 0],
                            y: [(Math.random() * 2 - 1) * MAX_OFFSET, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                <img src="/assets/Main_Button.png" alt="Main Button" className="button" />
            </div>
        </div>
    );
}
