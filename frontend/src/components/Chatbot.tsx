import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! How can I help you with the onboarding process?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    setMessages(prev => [...prev, { type: 'user', text: userInput }]);
    const question = userInput;
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', { question });
      setMessages(prev => [...prev, { type: 'bot', text: response.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "Sorry, I couldn't process your question. Please try again."
      }]);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button 
        className="w-14 h-14 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-all duration-300 flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-comments'} text-xl`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="bg-green-500 text-white p-4">
            <h3 className="text-lg font-semibold">Onboarding Assistant</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-blue-100 ml-auto rounded-br-sm'
                    : 'bg-gray-100 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4 flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-green-500"
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading || !userInput.trim()}
              className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center disabled:bg-gray-300 hover:bg-green-600 transition-colors"
            >
              <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot; 