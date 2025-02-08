import React, { useState, useRef, useEffect } from 'react';
import Layout from '../../components/shared/Layout';
import { api } from '../../services/api';
import { MessageCircle, Send, Bot, Loader2 } from 'lucide-react';

interface ChatMessage {
  type: 'bot' | 'user';
  text: string;
}

export default function ChatbotBuddy() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Try to load messages from localStorage
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [
      { type: 'bot', text: 'Hallo! Wie kann ich Ihnen beim Onboarding-Prozess helfen?' }
    ];
  });
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChatbot = async () => {
      try {
        setIsInitializing(true);
        await api.post('/chatbot/init');
        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to initialize chatbot:', error);
        setMessages(prev => [...prev, {
          type: 'bot',
          text: "Entschuldigung, ich konnte die Initialisierung nicht richtig durchführen. Bitte versuchen Sie, die Seite zu aktualisieren."
        }]);
        setIsInitializing(false);
      }
    };

    initializeChatbot();
  }, []);

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading || isInitializing) return;

    setMessages(prev => [...prev, { type: 'user', text: userInput }]);
    const message = userInput;
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/chat', { message });
      setMessages(prev => [...prev, { type: 'bot', text: response.data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Leider konnte ich Ihre Frage nicht bearbeiten. Versuchen Sie es bitte noch einmal."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col bg-white rounded-lg shadow-lg m-6 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 flex items-center gap-3">
          <Bot className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-semibold">Onboarding Assistant</h3>
            <p className="text-sm text-green-100">Ask me anything about the onboarding process</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.type === 'user'
                    ? 'bg-green-500 text-white rounded-br-none'
                    : 'bg-white shadow-md rounded-bl-none'
                }`}
              >
                <div className="flex items-start gap-3">
                  {msg.type === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                  <div className={msg.type === 'user' ? 'text-white' : 'text-gray-700'}>
                    {msg.text}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          
          {/* Loading indicator */}
          {(isLoading || isInitializing) && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md rounded-2xl rounded-bl-none p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                  </div>
                  <div className="text-gray-500">
                    {isInitializing ? 'Initializing...' : 'Thinking...'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t bg-white p-6">
          <div className="max-w-4xl mx-auto flex gap-4">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Geben Sie Ihre Frage ein ... (Zum Senden die Eingabetaste drücken)"
              disabled={isLoading || isInitializing}
              rows={1}
              className="flex-1 resize-none px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              style={{ minHeight: '2.5rem', maxHeight: '10rem' }}
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading || isInitializing || !userInput.trim()}
              className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-sm text-gray-500">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </Layout>
  );
} 