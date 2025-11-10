import React from 'react';
import { ChatIcon } from './icons/ChatIcon';

interface ChatFabProps {
  onClick: () => void;
}

export const ChatFab: React.FC<ChatFabProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-sky-600 text-white shadow-lg hover:bg-sky-700 active:bg-sky-800 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 animate-fade-in"
      aria-label="Open chat assistant"
    >
      <ChatIcon />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s 1s ease-out forwards; opacity: 0; }
      `}</style>
    </button>
  );
};
