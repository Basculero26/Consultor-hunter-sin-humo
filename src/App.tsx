/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Briefcase, TrendingUp, Paperclip, FileText, Upload, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { chatWithConsultant } from './services/geminiService';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async (customMessage?: string) => {
    const userMessage = customMessage || input.trim();
    if (!userMessage || isLoading) return;

    if (!customMessage) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: customMessage ? "[CV Adjunto]" : userMessage }]);
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

  const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } else if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else {
      // Assume text file
      return await file.text();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    setIsParsing(true);
    try {
      const text = await extractTextFromFile(file);
      if (text.trim()) {
        await handleSend(text);
      } else {
        alert("No se pudo extraer texto del archivo. Por favor intenta pegarlo manualmente.");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Error al procesar el archivo. Asegúrate de que sea un PDF, DOCX o TXT válido.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e);
  };

  return (
    <div 
      className="min-h-screen bg-[#F5F5F4] text-[#1C1917] font-sans flex flex-col relative"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#1C1917]/40 backdrop-blur-sm flex items-center justify-center p-8"
          >
            <div className="bg-white border-4 border-dashed border-[#1C1917] rounded-3xl p-12 flex flex-col items-center gap-4 shadow-2xl">
              <Upload className="w-16 h-16 text-[#1C1917] animate-bounce" />
              <p className="text-2xl font-bold">Soltá tu CV acá</p>
              <p className="text-[#78716C] font-medium">PDF, DOCX o TXT</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          {(isLoading || isParsing) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 items-center bg-white border border-[#E7E5E4] p-4 rounded-2xl shadow-sm">
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin text-[#1C1917]" /> : (
                  <>
                    <div className="w-2 h-2 bg-[#A8A29E] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#A8A29E] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-[#A8A29E] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </>
                )}
                <span className="text-xs font-medium text-[#78716C] ml-2">
                  {isParsing ? "Extrayendo texto del CV..." : "Analizando mercado..."}
                </span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#F5F5F4]/80 backdrop-blur-md p-4 border-t border-[#E7E5E4]">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2">
          <div className="relative flex-1">
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
              onClick={() => handleSend()}
              disabled={isLoading || isParsing || !input.trim()}
              className="absolute right-3 bottom-3 p-3 bg-[#1C1917] text-white rounded-xl hover:bg-[#44403C] disabled:bg-[#A8A29E] disabled:cursor-not-allowed transition-colors shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isParsing}
            className="p-4 bg-white border border-[#D6D3D1] text-[#1C1917] rounded-2xl hover:bg-[#E7E5E4] disabled:opacity-50 transition-all shadow-lg flex items-center justify-center"
            title="Subir CV (PDF, DOCX, TXT)"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".pdf,.docx,.txt" 
            className="hidden" 
          />
        </div>
        <p className="text-[10px] text-center mt-2 text-[#A8A29E] font-medium uppercase tracking-widest">
          Consultoría Profesional • Datos Actualizados 2026
        </p>
      </div>
    </div>
  );
}
