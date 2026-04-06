import React, { useEffect, useRef, useState, useCallback } from 'react';
import { chatAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

function AssistantIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2l1.6 5.4L20 9l-5.4 1.6L13 16l-1.6-5.4L6 9l5.4-1.6L13 2Z" />
      <path d="M5 14l.9 3.1L9 18l-3.1.9L5 22l-.9-3.1L1 18l3.1-.9L5 14Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" x2="11" y1="2" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const { t, formatTime } = useLocale();
  const isPatient = user?.role === 'patient';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [requestError, setRequestError] = useState('');
  const messagesEndRef = useRef(null);
  const quickPrompts = [
    t('chat.quick1', 'Расшифруй анализ крови'),
    t('chat.quick2', 'Что означают рекомендации врача?'),
    t('chat.quick3', 'Покажи мою историю консультаций'),
    t('chat.quick4', 'Есть ли противопоказания у лекарства?'),
  ];

  const fetchHistory = useCallback(async () => {
    try {
      setRequestError('');
      const { data } = await chatAPI.getHistory();
      const messageList = data.results || data;
      setMessages(Array.isArray(messageList) ? messageList : []);
    } catch (error) {
      console.error('Ошибка загрузки истории чата:', error);
      const status = error.response?.status;
      if (status === 401) {
        setRequestError(t('chat.historyLoadError401', 'Не удалось загрузить чат: сессия истекла или нет доступа к ассистенту.'));
      } else if (status >= 500) {
        setRequestError(t('chat.historyLoadError500', 'Сервер не смог загрузить историю чата. Попробуйте позже.'));
      } else {
        setRequestError(t('chat.historyLoadError', 'Не удалось загрузить историю чата. Проверьте подключение.'));
      }
    } finally {
      setInitialLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    setRequestError('');

    const tempMsg = {
      id: Date.now(),
      is_user: true,
      message: userMsg,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data } = await chatAPI.sendMessage(userMsg);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempMsg.id);
        return [...filtered, data.user_message, data.ai_message];
      });
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      const status = error.response?.status;
      if (status === 401) {
        setRequestError(t('chat.sendError401', 'Сообщение не отправлено: сессия истекла или нет доступа к чату.'));
      } else if (status >= 500) {
        setRequestError(t('chat.sendError500', 'Серверная ошибка при отправке сообщения. Это проблема backend, не интерфейса.'));
      } else {
        setRequestError(t('chat.sendError', 'Не удалось отправить сообщение. Проверьте подключение.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (loading || clearing || messages.length === 0) return;

    const confirmed = window.confirm(t('chat.clearConfirm', 'Очистить всю историю чата? Это действие нельзя отменить.'));
    if (!confirmed) return;

    setClearing(true);
    setRequestError('');

    try {
      await chatAPI.clearHistory();
      setMessages([]);
      setInput('');
    } catch (error) {
      console.error('Ошибка очистки истории чата:', error);
      const status = error.response?.status;
      if (status === 401) {
        setRequestError(t('chat.clearError401', 'Не удалось очистить чат: сессия истекла или нет доступа.'));
      } else if (status >= 500) {
        setRequestError(t('chat.clearError500', 'Серверная ошибка при очистке истории чата. Попробуйте позже.'));
      } else {
        setRequestError(t('chat.clearError', 'Не удалось очистить историю чата. Проверьте подключение.'));
      }
    } finally {
      setClearing(false);
    }
  };

  const handlePromptClick = (prompt) => {
    setInput(prompt);
  };

  const displayName = user?.first_name || user?.full_name || user?.username || t('common.user', 'пользователь');

  if (!isPatient) {
    return (
      <div className="card chat-access-denied animate-slideup">
        <div className="chat-loading-mark">
          <AssistantIcon />
        </div>
        <div className="chat-access-copy">
          <h1 className="page-title">{t('chat.accessDeniedTitle', 'AI Ассистент')}</h1>
          <p className="page-subtitle">
            {t('chat.accessDeniedSubtitle', 'Этот раздел доступен только пациентам. Для врачей и администраторов он скрыт в меню, чтобы не отправлять запросы в неподдерживаемый backend-режим.')}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.assign('/dashboard')}>
            {t('chat.backToDashboard', 'Вернуться на дашборд')}
          </button>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="chat-loading card animate-slideup">
        <div className="chat-loading-mark">
          <AssistantIcon />
        </div>
        <div>
          <div className="chat-loading-title">{t('chat.loadingHistory', 'Загружаем историю чата')}</div>
          <div className="chat-loading-subtitle">{t('chat.loadingSubtitle', 'Подготавливаем персональный медицинский ассистент')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade chat-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('chat.title', 'AI Ассистент')}</h1>
          <p className="page-subtitle">{t('chat.subtitle', 'Персональный диалог о здоровье, анализах и рекомендациях врача')}</p>
        </div>
        <div className="chat-badges">
          <span className="badge badge-primary">{t('chat.ai247', '24/7 AI')}</span>
        </div>
      </div>

      {requestError && (
        <div className="card auth-error chat-error-banner">
          {requestError}
        </div>
      )}

      <div className="chat-grid">
        <aside className="card chat-summary animate-slideup">
          <div className="chat-summary-hero">
            <div className="chat-summary-icon">
              <AssistantIcon />
            </div>
            <div className="chat-summary-copy">
              <div className="chat-summary-eyebrow">{t('chat.heroEyebrow', 'Медицинский ассистент')}</div>
              <h2>{t('chat.greeting', 'Здравствуйте, {{name}}!', { name: displayName })}</h2>
              <p>{t('chat.heroCopy', 'Спросите о результатах, рекомендациях или запишите вопрос для следующего приема.')}</p>
            </div>
          </div>

          <div className="chat-summary-stats">
            <div className="chat-stat">
              <div className="chat-stat-label">{t('chat.messages', 'Сообщений')}</div>
              <div className="chat-stat-value">{messages.length}</div>
            </div>
            <div className="chat-stat">
              <div className="chat-stat-label">{t('chat.state', 'Состояние')}</div>
              <div className="chat-stat-value">{t('chat.online', 'Онлайн')}</div>
            </div>
            <div className="chat-stat">
              <div className="chat-stat-label">{t('chat.focus', 'Фокус')}</div>
              <div className="chat-stat-value">{t('chat.history', 'История')}</div>
            </div>
          </div>

          <div className="chat-summary-section">
            <div className="chat-summary-title">{t('chat.quickPrompts', 'Быстрые запросы')}</div>
            <div className="chat-quick-list">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="chat-chip"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-summary-note">
            <ShieldIcon />
            <span>
              {t('chat.note', 'AI помогает ориентироваться, но не заменяет врача. Финальные решения должны приниматься с учетом очного осмотра.')}
            </span>
          </div>
        </aside>

        <section className="card chat-thread animate-slideup">
          <div className="chat-thread-header">
            <div>
              <div className="chat-thread-label">{t('chat.threadLabel', 'Диалог')}</div>
              <h3>{t('chat.threadTitle', 'Медицинская переписка')}</h3>
            </div>
            <div className="chat-thread-actions">
              <div className="chat-thread-status">
                <span className="chat-dot" />
                {t('chat.synced', 'Синхронизировано')}
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm chat-clear-btn"
                onClick={handleClearHistory}
                disabled={loading || clearing || messages.length === 0}
              >
                {clearing ? t('chat.clearChatLoading', 'Очистка...') : t('chat.clearChat', 'Очистить чат')}
              </button>
            </div>
          </div>

          <div className="chat-thread-body">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <div className="chat-empty-icon">
                  <SparkIcon />
                </div>
                <h3>{t('chat.startConversation', 'Начните разговор')}</h3>
                <p>{t('chat.emptyStateText', 'Напишите вопрос о здоровье, результатах анализов или рекомендациях врача — я помогу разобрать его понятным языком.')}</p>
                <div className="chat-empty-actions">
                  {quickPrompts.slice(0, 3).map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="chat-chip"
                      onClick={() => handlePromptClick(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = Boolean(msg.is_user);

                return (
                  <div
                    key={msg.id || idx}
                    className={`chat-row ${isUser ? 'is-user' : 'is-assistant'}`}
                  >
                    <div className={`chat-avatar ${isUser ? 'user' : 'bot'}`}>
                      {isUser ? <UserIcon /> : <AssistantIcon />}
                    </div>
                    <div className={`chat-bubble ${isUser ? 'user' : 'bot'}`}>
                      {msg.message}
                      <div className="chat-meta">
                        {isUser ? t('chat.user', 'Вы') : t('chat.assistant', 'Ассистент')}
                        {msg.timestamp ? ` · ${formatTime(msg.timestamp)}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="chat-row is-assistant">
                <div className="chat-avatar bot">
                  <AssistantIcon />
                </div>
                <div className="chat-bubble bot chat-typing-bubble">
                  <span className="chat-typing-label">{t('chat.typing', 'Печатает')}</span>
                  <span className="chat-typing-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-composer">
            <form onSubmit={handleSend} className="chat-form">
              <div className="chat-input-wrap">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('chat.placeholder', 'Напишите вопрос о здоровье...')}
                  className="chat-input"
                  disabled={loading}
                  rows={1}
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="chat-send"
                aria-label={t('chat.sendAria', 'Отправить сообщение')}
              >
                <SendIcon />
              </button>
            </form>
            <div className="chat-composer-note">
              <ShieldIcon />
              <span>{t('chat.composerNote', 'AI может ошибаться. Для лечения и назначения препаратов всегда консультируйтесь с врачом.')}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
