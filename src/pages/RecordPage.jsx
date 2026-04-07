import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI, consultationsAPI } from '../api/apiClient';
import logoImg from '../assets/Main_Button.png';
import { useLocale } from '../context/LocaleContext';

export default function RecordPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [autoProcess, setAutoProcess] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const eqAnimRef = useRef(null);
  const eqCanvasRef = useRef(null);
  const waveCvsRef = useRef(null);
  const waveAnimRef = useRef(null);

  useEffect(() => {
    setLoadingPatients(true);
    patientsAPI.getAll().then(({ data }) => {
      setPatients(Array.isArray(data) ? data : (data?.results || []));
    }).finally(() => setLoadingPatients(false));
    const currentWaveAnim = waveAnimRef.current;
    const currentEqAnim = eqAnimRef.current;
    const currentAnim = animRef.current;
    const currentTimer = timerRef.current;
    return () => {
      cancelAnimationFrame(currentAnim);
      cancelAnimationFrame(currentEqAnim);
      cancelAnimationFrame(currentWaveAnim);
      clearInterval(currentTimer);
    };
  }, []);

  const filteredPatients = patients.filter(p =>
      `${p.last_name} ${p.first_name} ${p.middle_name || ''}`.toLowerCase().includes(patientSearch.toLowerCase())
  );

  /* ── NCS-style circular sphere visualizer ── */
  const drawWaves = useCallback(() => {
    const canvas = waveCvsRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const S = canvas.width;
    const cx = S / 2;
    const cy = S / 2;
    let t = 0;

    const layers = [
      { color: 'rgba(46,196,182,0.5)',  fill: 'rgba(46,196,182,0.05)', lw: 2.5, amp: 12, fm: 5,  sp: 1.4 },
      { color: 'rgba(94,234,212,0.4)',   fill: 'rgba(94,234,212,0.04)', lw: 2,   amp: 16, fm: 6,  sp: 1.1 },
      { color: 'rgba(167,139,250,0.3)',  fill: 'rgba(167,139,250,0.03)', lw: 1.5, amp: 9,  fm: 8,  sp: 1.7 },
      { color: 'rgba(45,212,191,0.4)',   fill: 'rgba(45,212,191,0.04)', lw: 2,   amp: 14, fm: 7,  sp: 0.9 },
    ];
    const baseR = 72;
    const pts = 220;

    const render = () => {
      waveAnimRef.current = requestAnimationFrame(render);
      t += 0.01;
      ctx.clearRect(0, 0, S, S);

      let freqData = null;
      if (analyserRef.current) {
        freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(freqData);
      }

      layers.forEach((l, w) => {
        const phase = t * l.sp + w * 1.2;
        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
          const a = (i / pts) * Math.PI * 2;
          let p = Math.sin(a * l.fm + phase) * l.amp
              + Math.sin(a * l.fm * 2.3 + phase * 1.4) * (l.amp * 0.4)
              + Math.cos(a * l.fm * 0.7 + phase * 0.6) * (l.amp * 0.3);
          if (freqData) {
            const fi = Math.floor((i / pts) * freqData.length) % freqData.length;
            p += (freqData[fi] / 255) * 35;
          }
          const x = cx + Math.cos(a) * (baseR + p);
          const y = cy + Math.sin(a) * (baseR + p);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = l.color;
        ctx.lineWidth = l.lw;
        ctx.stroke();
        ctx.fillStyle = l.fill;
        ctx.fill();
      });
    };
    render();
  }, []);

  useEffect(() => {
    if (step === 2 && !audioBlob) {
      drawWaves();
    }
    const currentWaveAnim = waveAnimRef.current;
    return () => cancelAnimationFrame(currentWaveAnim);
  }, [step, audioBlob, drawWaves]);

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      audioCtxRef.current = ctx;

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        ctx.close();
        cancelAnimationFrame(animRef.current);
      };
      mr.start(250);
      mediaRef.current = mr;
      setRecording(true);
      setPaused(false);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (err) {
      setError(t('record.microphoneError', 'Не удалось получить доступ к микрофону.'));
    }
  };

  const pauseRecording = () => {
    if (mediaRef.current && mediaRef.current.state === 'recording') {
      mediaRef.current.pause();
      setPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRef.current && mediaRef.current.state === 'paused') {
      mediaRef.current.resume();
      setPaused(false);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
    }
    setRecording(false);
    setPaused(false);
    clearInterval(timerRef.current);
    cancelAnimationFrame(waveAnimRef.current);
  };

  /* ── Equalizer animation for playback ── */
  const startEqualizer = useCallback(() => {
    const audio = audioRef.current;
    const canvas = eqCanvasRef.current;
    if (!audio || !canvas) return;

    if (!audioAnalyserRef.current) {
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      audioAnalyserRef.current = analyser;
    }
    const analyser = audioAnalyserRef.current;
    const bufLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);
    const cCtx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const barCount = bufLen;
    const barW = W / barCount - 2;

    const draw = () => {
      eqAnimRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      cCtx.clearRect(0, 0, W, H);

      for (let i = 0; i < barCount; i++) {
        const h = (data[i] / 255) * H * 0.9;
        const x = i * (barW + 2);
        const gradient = cCtx.createLinearGradient(x, H - h, x, H);
        gradient.addColorStop(0, '#2ec4b6');
        gradient.addColorStop(1, '#5eead4');
        cCtx.fillStyle = gradient;
        cCtx.beginPath();
        cCtx.roundRect(x, H - h, barW, h, 2);
        cCtx.fill();
      }
    };
    draw();
  }, []);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      startEqualizer();
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(eqAnimRef.current);
    }
  };

  const formatDuration = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmit = async () => {
    if (!audioBlob || !patientId) {
      setError(t('record.selectPatientRequired', 'Выберите пациента для начала'));
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('patient', patientId);
      const { data } = await consultationsAPI.create(formData);
      if (autoProcess) {
        try { await consultationsAPI.startProcessing(data.id); } catch {}
      }
      navigate(`/consultations/${data.id}`);
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? JSON.stringify(d) : t('record.errorCreate', 'Ошибка создания консультации'));
    } finally { setUploading(false); }
  };

  const reset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    cancelAnimationFrame(eqAnimRef.current);
    audioAnalyserRef.current = null;
  };

  return (
      <div className="shazam-page animate-fade">

        {/* ── Step 1: Patient select ── */}
        {step === 1 && (
            <div className="shazam-step1">
              <div className="page-header">
                <div><h1 className="page-title">{t('record.title', 'Новая запись')}</h1><p className="page-subtitle">{t('record.subtitle', 'Выберите пациента для начала')}</p></div>
              </div>
              {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
              <div className="shazam-patient-card">
                <div className="input-group" style={{ marginBottom: 16 }}>
                  <input className="input" placeholder={t('record.patientSearch', 'Поиск по ФИО...')} value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
                </div>
                <div style={{ maxHeight: 300, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {loadingPatients ? (
                      <div className="shazam-loading">{t('record.loadingPatients', 'Пожалуйста, подождите...')}</div>
                  ) : filteredPatients.length > 0 ? (
                      filteredPatients.map(p => (
                          <div key={p.id}
                               className={`shazam-patient-item ${patientId === String(p.id) ? 'selected' : ''}`}
                               onClick={() => setPatientId(String(p.id))}>
                            <div style={{ fontWeight: 500, fontSize: 14 }}>{p.last_name} {p.first_name} {p.middle_name || ''}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('patients.birthDate', 'Дата рождения')}: {p.birth_date || t('common.none', '—')}</div>
                          </div>
                      ))
                  ) : (
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', padding: 24 }}>{t('record.patientsNotFound', 'Пациенты не найдены')}</p>
                  )}
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" disabled={!patientId} onClick={() => setStep(2)}>{t('record.next', 'Далее →')}</button>
                </div>
              </div>
            </div>
        )}

        {/* ── Step 2: Recording ── */}
        {step === 2 && (
            <div className="shazam-record">
              {!audioBlob ? (
                  <>
                    {/* Timer */}
                    <div className="shazam-timer">{formatDuration(duration)}</div>

                    {/* Center logo button with sphere visualizer */}
                    <div className="shazam-center">
                      <canvas ref={waveCvsRef} width={400} height={400} className="shazam-sphere-canvas" />
                      {recording && (
                          <>
                            <span className="shazam-ring shazam-ring1"></span>
                            <span className="shazam-ring shazam-ring2"></span>
                            <span className="shazam-ring shazam-ring3"></span>
                          </>
                      )}
                      <button
                          className={`shazam-logo-btn ${recording ? 'recording' : ''}`}
                          onClick={!recording ? startRecording : undefined}
                          disabled={recording}
                      >
                        <img src={logoImg} alt={t('record.title', 'Новая запись')} />
                      </button>
                    </div>

                    <p className="shazam-hint">{recording ? (paused ? t('record.paused', 'На паузе') : t('record.recording', 'Идёт запись...')) : t('record.startRecordingHint', 'Нажмите для начала записи')}</p>

                    {/* Bottom controls */}
                    {recording && (
                        <div className="shazam-controls">
                          <button className="shazam-ctrl-btn" onClick={paused ? resumeRecording : pauseRecording}>
                            {paused ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            ) : (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                            )}
                            <span>{paused ? t('record.resume', 'Продолжить') : t('record.pause', 'Пауза')}</span>
                          </button>
                          <button className="shazam-ctrl-btn stop" onClick={stopRecording}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                            <span>{t('record.stop', 'Остановить')}</span>
                          </button>
                        </div>
                    )}
                  </>
              ) : (
                  /* ── After recording: playback + equalizer ── */
                  <div className="shazam-playback">
                    <div className="shazam-timer">{formatDuration(duration)}</div>

                    <canvas ref={eqCanvasRef} width={320} height={100} className="shazam-eq-canvas" />

                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => { setIsPlaying(false); cancelAnimationFrame(eqAnimRef.current); }}
                        style={{ display: 'none' }}
                    />

                    <div className="shazam-play-controls">
                      {!isPlaying ? (
                          <button className="shazam-play-btn" onClick={handlePlay}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          </button>
                      ) : (
                          <button className="shazam-play-btn" onClick={handlePause}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                          </button>
                      )}
                    </div>

                    <div className="shazam-controls">
                      <button className="shazam-ctrl-btn" onClick={reset}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        <span>{t('record.reRecord', 'Перезаписать')}</span>
                      </button>
                      <button className="shazam-ctrl-btn" style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }} onClick={() => setStep(3)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        <span>{t('record.nextStep', 'Далее')}</span>
                      </button>
                    </div>
                  </div>
              )}

              <button className="shazam-back-btn" onClick={() => { stopRecording(); reset(); setStep(1); }}>{t('record.back', '← Назад')}</button>
            </div>
        )}

        {/* ── Step 3: Submit ── */}
        {step === 3 && (
            <div className="shazam-step1">
              <div className="page-header">
                <div><h1 className="page-title">{t('record.confirmation', 'Подтверждение')}</h1></div>
              </div>
              {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
              <div className="shazam-patient-card">
                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                  <div style={{ padding: 12, background: 'var(--border-light)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('record.patient', 'Пациент')}</div>
                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{(() => { const p = patients.find(p => String(p.id) === patientId); return p ? `${p.last_name} ${p.first_name}` : '—'; })()}</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--border-light)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('record.duration', 'Длительность записи')}</div>
                    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{formatDuration(duration)}</div>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 14, cursor: 'pointer', marginBottom: 24, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={autoProcess} onChange={(e) => setAutoProcess(e.target.checked)} />
                  {t('record.autoProcess', 'Автоматически запустить ИИ-обработку')}
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>{t('record.back', '← Назад')}</button>
                  <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={uploading}>
                    {uploading ? t('record.createLoading', 'Создание...') : t('record.createConsultation', '🚀 Создать консультацию')}
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}