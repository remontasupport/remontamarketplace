'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import AdminChatbot from './AdminChatbot';
import Image from 'next/image';

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 overflow-hidden"
          aria-label="Open Pug AI Assistant"
        >
          <Image
            src="/images/pug-ai-assistant.jpg"
            alt="Pug AI Assistant"
            width={56}
            height={56}
            className="object-cover"
          />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] rounded-lg bg-white shadow-2xl">
          {/* Chat Header */}
          <div className="flex items-center justify-between rounded-t-lg bg-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-white flex-shrink-0">
                <Image
                  src="/images/pug-ai-assistant.jpg"
                  alt="Pug AI Assistant"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <h3 className="font-semibold">Pug Ai Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat Content */}
          <AdminChatbot />
        </div>
      )}
    </>
  );
}
