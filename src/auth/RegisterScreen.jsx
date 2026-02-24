import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../css/RegisterScreen.css';
import AppLogo from '../assets/App_logo.png';
import { authAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const TOTAL_STEPS = 7;

const SPECIALIZATIONS = [
    'Кардиолог',
    'Невролог',
    'Педиатр',
    'Терапевт',
    'Хирург',
    'Офтальмолог'
];

export default function RegisterScreen() {
    const navigate = useNavigate();
    const { loginWithCode } = useAuth();
    const [role, setRole] = useState(null);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const codeRefs = useRef([]);
    const [form, setForm] = useState({
        lastName: '',
        firstName: '',
        middleName: '',
        iin: '',
        birthDate: '',
        city: '',
        specialization: '',
        documentType: '',
        documentFile: null,
        email: '',
        code: ['', '', '', '', '', ''],
        password: '',
        confirmPassword: ''
    });

    const formatDate = (value) => {
        const cleaned = value.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
        if (cleaned.length > 4) formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2, 4) + '-' + cleaned.slice(4, 8);
        return formatted;
    };

    const isValidDate = /^\d{2}-\d{2}-\d{4}$/.test(form.birthDate);
    const isPasswordValid = () => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(form.password);
    const isCodeValid = () => form.code.every(d => d.length === 1);

    const canProceed = () => {
        switch (step) {
            case 1:
                return form.lastName && form.firstName && form.iin.length === 12 && isValidDate && form.city;
            case 2:
                return !!form.specialization;
            case 3:
                return !!form.documentType && !!form.documentFile;
            case 4:
                return form.email.includes('@');
            case 5:
                return isCodeValid();
            case 6:
                return isPasswordValid() && form.password === form.confirmPassword;
            default:
                return true;
        }
    };

    const nextStep = async () => {
        if (step >= TOTAL_STEPS) return;
        setApiError('');
        setIsLoading(true);

        try {
            // Шаг 4 → 5: отправить OTP код на email
            if (step === 4) {
                await authAPI.sendCode(form.email);
            }

            // Шаг 6 → 7: регистрируем + автоматически логинимся через OTP
            if (step === 6) {
                // 1. Регистрируем пользователя
                await authAPI.register({
                    username: form.email.split('@')[0],
                    email: form.email,
                    password: form.password,
                    first_name: form.firstName,
                    last_name: form.lastName,
                    middle_name: form.middleName,
                    role: 'doctor',
                    phone: '',
                });

                // 2. Верифицируем OTP код + автоматический вход
                const otpCode = form.code.join('');
                try {
                    await loginWithCode(form.email, otpCode);
                    // Успешно вошли — переходим на главную
                    navigate('/main', { replace: true });
                    return;
                } catch (loginErr) {
                    // OTP мог истечь — не критично, пользователь может войти через логин
                    console.warn('Auto-login failed, user can login manually', loginErr);
                }
            }

            setStep(prev => prev + 1);
        } catch (err) {
            const msg = err.response?.data;
            if (typeof msg === 'object') {
                const errors = Object.values(msg).flat().join('. ');
                setApiError(errors || 'Ошибка запроса');
            } else {
                setApiError(msg?.error || msg?.detail || 'Ошибка подключения к серверу');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (index, value) => {
        if (value.length > 1) value = value.slice(-1);
        const newCode = [...form.code];
        newCode[index] = value;
        setForm(prev => ({ ...prev, code: newCode }));
        // Автофокус на следующее поле
        if (value && index < 5) {
            codeRefs.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !form.code[index] && index > 0) {
            codeRefs.current[index - 1]?.focus();
        }
    };

    const renderCodeInputs = () => (
        <div className="codeContainer">
            {form.code.map((digit, index) => (
                <input
                    key={index}
                    ref={el => codeRefs.current[index] = el}
                    className="codeInput"
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(index, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(index, e)}
                />
            ))}
        </div>
    );

    const renderWizard = () => {
        if (!role) {
            return (
                <>
                    <h2 className="selectionTitle">Выберите роль</h2>
                    <div className="buttonContainer">
                        <button className="roleButton" onClick={() => setRole('doctor')}>ВРАЧ</button>
                    </div>
                </>
            );
        }

        return (
            <div className="scrollContent">
                {step <= 6 && (
                    <div className="progressWrapper">
                        <div className="progressBackground">
                            <div className="progressFill" style={{ width: `${(step / 6) * 100}%` }} />
                        </div>
                        <p className="progressText">Шаг {step} из 6</p>
                    </div>
                )}

                {/* STEP 1 */}
                {step === 1 && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <h2 className="selectionTitle">Регистрация врача</h2>
                        <input className="input" placeholder="Фамилия" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                        <input className="input" placeholder="Имя" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                        <input className="input" placeholder="Отчество" value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} />
                        <input className="input" placeholder="ИИН" maxLength={12} value={form.iin} onChange={e => setForm({ ...form, iin: e.target.value.replace(/[^0-9]/g, '') })} />
                        <input className="input" placeholder="ДД-ММ-ГГГГ" maxLength={10} value={form.birthDate} onChange={e => setForm({ ...form, birthDate: formatDate(e.target.value) })} />
                        <select className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                            <option value="">Выберите город</option>
                            <option value="Алматы">Алматы</option>
                            <option value="Астана">Астана</option>
                            <option value="Шымкент">Шымкент</option>
                        </select>
                    </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="selectionTitle">Выбор специализации</h2>
                        <select className="input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })}>
                            <option value="">Выберите специализацию</option>
                            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </motion.div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="selectionTitle">Тип документа</h2>
                        <button className={`selectBtn ${form.documentType === 'passport' ? 'active' : ''}`} onClick={() => setForm({ ...form, documentType: 'passport' })}>Паспорт</button>
                        <button className={`selectBtn ${form.documentType === 'id' ? 'active' : ''}`} onClick={() => setForm({ ...form, documentType: 'id' })}>Удостоверение личности</button>
                        {form.documentType && (
                            <input type="file" accept="application/pdf" onChange={e => setForm({ ...form, documentFile: e.target.files[0] })} />
                        )}
                    </motion.div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="selectionTitle">Электронная почта</h2>
                        <p style={{ color: '#aaa', fontSize: 14, marginBottom: 10 }}>
                            На указанную почту будет отправлен 6-значный код подтверждения
                        </p>
                        <input className="input" placeholder="example@mail.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </motion.div>
                )}

                {/* STEP 5 */}
                {step === 5 && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="selectionTitle">Код подтверждения</h2>
                        <p style={{ color: '#aaa', fontSize: 14, marginBottom: 10 }}>
                            Введите 6-значный код, отправленный на {form.email}
                        </p>
                        {renderCodeInputs()}
                    </motion.div>
                )}

                {/* STEP 6 */}
                {step === 6 && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="selectionTitle">Создать пароль</h2>
                        <p className="passwordInfo">
                            Пароль должен содержать минимум 8 символов,
                            1 латинскую букву, 1 цифру и 1 спецсимвол.
                        </p>
                        <input
                            className="input"
                            type="password"
                            placeholder="Введите пароль"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                        <input
                            className="input"
                            type="password"
                            placeholder="Подтвердите пароль"
                            value={form.confirmPassword}
                            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                        />
                    </motion.div>
                )}

                {/* STEP 7 — показывается только если auto-login не сработал */}
                {step === 7 && (
                    <div style={{ textAlign: 'center', marginTop: 50 }}>
                        <h2 className="selectionTitle">Регистрация успешна!</h2>
                        <p className="finalText">
                            Ваш аккаунт создан. Войдите с вашим email и паролем.
                        </p>
                    </div>
                )}

                {/* Кнопка "ДАЛЕЕ" */}
                {step <= 6 && canProceed() && (
                    <div className="buttonContainer">
                        {apiError && <p style={{ color: '#E74C3C', textAlign: 'center', marginBottom: 10 }}>{apiError}</p>}
                        <button className="roleButton" onClick={nextStep} disabled={isLoading}>
                            {isLoading ? 'ЗАГРУЗКА...' : (step === 6 ? 'ЗАРЕГИСТРИРОВАТЬСЯ' : 'ДАЛЕЕ')}
                        </button>
                    </div>
                )}

                {/* Шаг 7: кнопка "Войти" */}
                {step === 7 && (
                    <div className="buttonContainer">
                        <button className="roleButton" onClick={() => navigate('/login')}>
                            ВОЙТИ
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="register-container">
            {/* HEADER */}
            <div className="headerContainer">
                <div className="headerBackground">
                    <div className="logoWrapper">
                        <img src={AppLogo} alt="logo" className="miniLogo" />
                        <h1 className="headerTitle">ClinSpeech</h1>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="content">
                {renderWizard()}
            </div>
        </div>
    );
}
