import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI, consultationsAPI } from '../api/apiClient';

export default function RecordPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [autoProcess, setAutoProcess] = useState(true);
  const mediaRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    patientsAPI.getAll().then(({ data }) => {
      setPatients(Array.isArray(data) ? data : (data?.results || []));
    });
    return () => { cancelAnimationFrame(animRef.current); clearInterval(timerRef.current); };
  }, []);

  const filteredPatients = patients.filter(p =>
    `${p.last_name} ${p.first_name} ${p.middle_name || ''}`.toLowerCase().includes(patientSearch.toLowerCase())
  );

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

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        ctx.close();
        cancelAnimationFrame(animRef.current);
      };
      mr.start(250);
      mediaRef.current = mr;
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      drawWaveform();
    } catch (err) {
      setError('Не удалось получить доступ к микрофону. Проверьте разрешения.');
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
    }
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    if (!analyser) return;
    const bufLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      ctx.fillStyle = 'rgba(248,250,252,1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const barW = (canvas.width / bufLen) * 2.5;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const h = (data[i] / 255) * canvas.height * 0.8;
        const gradient = ctx.createLinearGradient(0, canvas.height - h, 0, canvas.height);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#a78bfa');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - h, barW - 1, h);
        x += barW;
      }
    };
    draw();
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmit = async () => {
    if (!audioBlob || !patientId) return;
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
      setError(typeof d === 'object' ? JSON.stringify(d) : 'Ошибка создания консультации');
    } finally { setUploading(false); }
  };

  const reset = () => { setAudioBlob(null); setDuration(0); };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">Новая запись</h1><p className="page-subtitle">Запишите приём и создайте ИИ-отчёт</p></div>
      </div>



      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      {step === 1 && (
        <div className="card" style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Выберите пациента</h3>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <input className="input" placeholder="Поиск по ФИО..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredPatients.map(p => (
              <div key={p.id}
                className={`card ${patientId === String(p.id) ? 'selected' : ''}`}
                style={{ padding: '10px 14px', cursor: 'pointer', border: patientId === String(p.id) ? '2px solid var(--primary)' : '1px solid var(--border)', transition: 'all .2s' }}
                onClick={() => setPatientId(String(p.id))}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{p.last_name} {p.first_name} {p.middle_name || ''}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Дата рождения: {p.birth_date || '—'}</div>
              </div>
            ))}
            {filteredPatients.length === 0 && <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', padding: 24 }}>Пациенты не найдены</p>}
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" disabled={!patientId} onClick={() => setStep(2)}>Далее →</button>
          </div>
        </div>
      )}

      {/* Step 2: Recording */}
      {step === 2 && (
        <div className="card record-card" style={{ padding: 32, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Запись приёма</h3>

          <canvas ref={canvasRef} width={500} height={120} style={{ width: '100%', height: 120, borderRadius: 'var(--radius)', marginBottom: 24, background: 'var(--bg)' }} />

          <div style={{ fontSize: 48, fontWeight: 300, fontFamily: 'monospace', color: recording ? 'var(--danger)' : 'var(--text)', marginBottom: 24 }}>
            {formatTime(duration)}
          </div>

          {!audioBlob ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              {!recording ? (
                <button className="btn btn-danger btn-lg" onClick={startRecording} style={{ borderRadius: 999, width: 80, height: 80 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="12" x2="12" y1="19" y2="22" stroke="currentColor" strokeWidth="2"/></svg>
                </button>
              ) : (
                <button className="btn btn-secondary btn-lg" onClick={stopRecording} style={{ borderRadius: 999, width: 80, height: 80 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                </button>
              )}
            </div>
          ) : (
            <div>
              <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: '100%', marginBottom: 16 }} />
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button className="btn btn-secondary" onClick={reset}>Перезаписать</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>Далее →</button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Назад</button>
          </div>
        </div>
      )}

      {/* Step 3: Submit */}
      {step === 3 && (
        <div className="card" style={{ padding: 32, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Подтверждение</h3>

          <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
            <div className="card" style={{ padding: 12, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Пациент</div>
              <div style={{ fontWeight: 500 }}>{(() => { const p = patients.find(p => String(p.id) === patientId); return p ? `${p.last_name} ${p.first_name}` : '—'; })()}</div>
            </div>
            <div className="card" style={{ padding: 12, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Длительность записи</div>
              <div style={{ fontWeight: 500 }}>{formatTime(duration)}</div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 14, cursor: 'pointer', marginBottom: 24 }}>
            <input type="checkbox" checked={autoProcess} onChange={(e) => setAutoProcess(e.target.checked)} />
            Автоматически запустить ИИ-обработку
          </label>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>← Назад</button>
            <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={uploading}>
              {uploading ? 'Создание...' : '🚀 Создать консультацию'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
