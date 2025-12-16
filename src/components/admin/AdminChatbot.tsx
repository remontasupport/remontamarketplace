'use client';

import { useState, useCallback, FormEvent } from 'react';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  Avatar,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { Send } from 'lucide-react';

interface ChatMessage {
  message: string;
  sentTime: string;
  sender: string;
  direction: 'incoming' | 'outgoing';
  position: 'single' | 'first' | 'normal' | 'last';
  avatar?: string;
}

export default function AdminChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      message: "Hello! I'm your Pug AI assistant—here to save the day. How can I help you?",
      sentTime: new Date().toLocaleTimeString(),
      sender: 'AI Assistant',
      direction: 'incoming',
      position: 'single',
      avatar: '/images/pug-ai-assistant.jpg',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSend = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    const cleanMessage = inputValue.trim();

    if (!cleanMessage) {
      return; // Don't send empty messages
    }

    // Clear input immediately
    setInputValue('');

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      message: cleanMessage,
      sentTime: new Date().toLocaleTimeString(),
      sender: 'Admin',
      direction: 'outgoing',
      position: 'single',
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsTyping(true);

    try {
      // Send message to API
      const response = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: cleanMessage }),
      });

      const data = await response.json();

      if (data.success) {
        // Add AI response to chat
        const aiResponse: ChatMessage = {
          message: data.response,
          sentTime: new Date().toLocaleTimeString(),
          sender: 'AI Assistant',
          direction: 'incoming',
          position: 'single',
          avatar: '/images/pug-ai-assistant.jpg',
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      // Add error message to chat
      const errorMessage: ChatMessage = {
        message: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        sentTime: new Date().toLocaleTimeString(),
        sender: 'System',
        direction: 'incoming',
        position: 'single',
        avatar: '/images/pug-ai-assistant.jpg',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue]);

  return (
    <div className="h-[600px] flex flex-col rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div className="flex-1 overflow-hidden">
        <MainContainer>
          <ChatContainer>
            <MessageList
              scrollBehavior="smooth"
              typingIndicator={isTyping ? <TypingIndicator content="AI Assistant is typing..." /> : null}
            >
              {messages.map((msg, index) => (
                <Message
                  key={index}
                  model={{
                    message: msg.message,
                    sentTime: msg.sentTime,
                    sender: msg.sender,
                    direction: msg.direction,
                    position: msg.position,
                  }}
                >
                  {msg.avatar && (
                    <Avatar src={msg.avatar} name={msg.sender} />
                  )}
                </Message>
              ))}
            </MessageList>
          </ChatContainer>
        </MainContainer>
      </div>

      {/* Custom Input Form */}
      <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping || !inputValue.trim()}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
