/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Briefcase, FileText, AlertCircle, Star, TrendingUp, DollarSign, ShieldAlert, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { chatWithConsultant } from './services/geminiService';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const startChat = async () => {
      setIsLoading(true);
      try {
        const response = await chatWithConsultant([{ role: 'user', parts: [{ text: 'Hola' }] }]);
        setMessages([{ role: 'model', content: response || "¡Hola! Soy tu consultor de carrera. Para empezar, por favor adjuntá tu CV o pegá el texto de tu perfil profesional aquí mismo." }]);
      } catch (error) {
        console.error(error);
        setMessages([{ role: 'model', content: "Hubo un error al iniciar el chat. Por favor intenta de nuevo." }]);
      } finally {
        setIsLoading(false);
      }
    };
    startChat();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await chatWithConsultant(chatHistory);
      setMessages(prev => [...prev, { role: 'model', content: response || "No recibí respuesta del consultor." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Lo siento, ocurrió un error procesando tu solicitud." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#1C1917] font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E7E5E4] py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#1C1917] p-2 rounded-lg">
              <Briefcase className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Consultor de Carrera AI</h1>
              <p className="text-xs text-[#78716C] font-medium uppercase tracking-wider">Analista Experto en Mercado Laboral</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#A8A29E] bg-[#F5F5F4] px-3 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span>ESTIMACIONES 2026</span>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-[#D6D3D1]' : 'bg-[#1C1917]'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-[#44403C]" /> : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-[#1C1917] text-white' : 'bg-white border border-[#E7E5E4]'}`}>
                    <div className="prose prose-sm max-w-none prose-stone dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2 border-b border-[#E7E5E4] pb-1" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-md font-bold mt-3 mb-1 flex items-center gap-2" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-[#1C1917] bg-[#F5F5F4] px-1 rounded" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                          li: ({node, ...props}) => <li className="text-[#44403C]" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 items-center bg-white border border-[#E7E5E4] p-4 rounded-2xl shadow-sm">
                <div className="w-2 h-2 bg-[#A8A29E] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#A8A29E] rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-[#A8A29E] rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs font-medium text-[#78716C] ml-2">Analizando mercado...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#F5F5F4]/80 backdrop-blur-md p-4 border-t border-[#E7E5E4]">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe aquí tu CV o JD..."
            className="w-full bg-white border border-[#D6D3D1] rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-[#1C1917] focus:border-transparent transition-all resize-none shadow-lg"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 bottom-3 p-3 bg-[#1C1917] text-white rounded-xl hover:bg-[#44403C] disabled:bg-[#A8A29E] disabled:cursor-not-allowed transition-colors shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-2 text-[#A8A29E] font-medium uppercase tracking-widest">
          Consultoría Profesional • Datos Actualizados 2026
        </p>
      </div>
    </div>
  );
}
