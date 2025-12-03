import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Loader2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { streamChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

export const TerminalChat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: 'System initialized. Neural interface active.\nHello! I am the AI representation of Nikhilesh. Ask me about my projects, skills, or experience.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      text: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, modelMessage]);

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    
    let fullText = "";

    await streamChatResponse(
        history, 
        userMessage.text,
        (chunk) => {
            fullText += chunk;
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === modelMessageId ? { ...msg, text: fullText } : msg
                )
            );
        }
    );

    setMessages((prev) =>
        prev.map((msg) =>
            msg.id === modelMessageId ? { ...msg, isStreaming: false } : msg
        )
    );
    setIsLoading(false);
    
    // Refocus input after response
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto glass-card border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[600px]"
    >
      {/* Header */}
      <div className="bg-slate-900/90 p-3 border-b border-slate-700/50 flex items-center gap-3">
        <div className="p-1.5 bg-slate-800 rounded-md">
            <Terminal className="w-4 h-4 text-cyber" />
        </div>
        <div className="flex flex-col">
            <span className="text-sm font-mono font-bold text-slate-200">nikhilesh_ai_agent.exe</span>
            <span className="text-[10px] text-cyber animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber"></span>
                ONLINE
            </span>
        </div>
        <div className="flex-1" />
        <div className="flex gap-1.5 opacity-50">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 font-mono text-sm scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
            {messages.map((msg) => (
            <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
                <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-lg ${
                    msg.role === 'user' 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                    : 'bg-cyber/10 border-cyber/30 text-cyber'
                }`}
                >
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                
                <div className={`flex-1 max-w-[85%] space-y-1`}>
                    <div className={`text-xs opacity-40 mb-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.role === 'user' ? 'YOU' : 'AI ASSISTANT'}
                    </div>
                    <div
                        className={`p-4 rounded-2xl leading-relaxed shadow-sm ${
                            msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                            : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tl-sm'
                        }`}
                    >
                        {msg.text}
                        {msg.isStreaming && (
                            <motion.span 
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="inline-block w-2 h-4 ml-1 bg-cyber align-middle" 
                            />
                        )}
                    </div>
                </div>
            </motion.div>
            ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-slate-900/50 border-t border-slate-700/50 flex gap-3 relative">
        <div className="relative flex-1 group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber/20 to-purple-500/20 rounded-lg opacity-0 group-focus-within:opacity-100 transition duration-500 blur"></div>
            <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about my ML stack..."
            className="relative w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 font-mono text-sm focus:outline-none focus:border-cyber/50 transition-all placeholder:text-slate-600"
            disabled={isLoading}
            />
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="relative px-4 py-2 bg-cyber/10 hover:bg-cyber/20 text-cyber border border-cyber/30 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-95"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </motion.div>
  );
};