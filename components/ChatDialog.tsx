import React, { useState, useEffect, useRef } from 'react';
import type { Translation, ExchangeRateData } from '../types';
import { useChat } from '../hooks/useChat';
import { SendIcon } from './icons/SendIcon';

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rate: ExchangeRateData | null;
  t: Translation;
}

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const BotIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        د.ع
    </div>
);

const UserIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    </div>
);

export const ChatDialog: React.FC<ChatDialogProps> = ({ isOpen, onClose, rate, t }) => {
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, sendMessage } = useChat(rate, t);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => textAreaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" aria-modal="true" role="dialog">
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto bg-gray-100 dark:bg-black shadow-2xl animate-slide-up">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t.chatTitle}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors" aria-label={t.closeButton}>
            <CloseIcon />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <BotIcon />
              <p className="mt-2 text-sm">{t.chatWelcomeMessage}</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && <BotIcon />}
                <div className={`max-w-md p-3 rounded-2xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-br-lg' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-lg'}`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && <UserIcon />}
              </div>
            ))
          )}
          {isLoading && messages[messages.length-1]?.role === 'user' && (
            <div className="flex items-start gap-3">
                <BotIcon />
                <div className="max-w-md p-3 rounded-2xl bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-bl-lg">
                    <span className="animate-pulse">{t.assistantTyping}</span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <footer className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 flex-shrink-0">
            <div className="flex items-center gap-2">
                <textarea
                    ref={textAreaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.chatInputPlaceholder}
                    rows={1}
                    className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !inputValue.trim()}
                    className="p-3 rounded-full bg-sky-600 text-white hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed transition-colors"
                    aria-label={t.sendButton}
                >
                    <SendIcon />
                </button>
            </div>
        </footer>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
      `}</style>
    </div>
  );
};