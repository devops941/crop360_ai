'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Globe,
  Sprout,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Bell,
  ArrowRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const SAMPLE_QUERIES = {
  en: [
    'How do I control rice blast using bio-pesticides?',
    'What is the recommended split fertilizer schedule for paddy?',
    'Explain AWD irrigation water management.',
    'What is the current MSP for Grade A paddy?',
  ],
  ta: [
    'நெல் பயிரில் இலைக்கருகல் நோயை எவ்வாறு கட்டுப்படுத்துவது?',
    'அடி உரம் மற்றும் தூர் கட்டும் பருவத்தில் என்ன உரம் இட வேண்டும்?',
    'காய்ச்சலும் பாய்ச்சலும் பாசன முறை பற்றி விளக்குங்கள்.',
    'நெல் கொள்முதல் விலை மற்றும் MSP விபரம் என்ன?',
  ],
  hi: [
    'धान में ब्लास्ट रोग का जैविक नियंत्रण कैसे करें?',
    'धान के लिए खाद और उर्वरक की अनुशंसित मात्रा क्या है?',
    'AWD सिंचाई प्रबंधन की जानकारी दें।',
  ],
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Vanakkam & Welcome! I am your Crop360 AI Agronomy Specialist. Ask me any questions about crop nutrition, pest & disease identification, irrigation schedules, or mandi marketing.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [language, setLanguage] = useState<'en' | 'ta' | 'hi'>('en');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          language,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          sender: 'assistant',
          text: json.data?.answer || 'Response generated successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Failed to fetch response');
      }
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an issue connecting to the agronomy knowledge engine. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate speech recognition result after 2.5 seconds
      setTimeout(() => {
        setIsRecording(false);
        const sampleVoiceQuery =
          language === 'ta'
            ? 'நெல் பயிரில் இலைக்கருகல் நோயை எவ்வாறு கட்டுப்படுத்துவது?'
            : 'How do I control rice blast using bio-pesticides?';
        setInputMessage(sampleVoiceQuery);
      }, 2500);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Bot className="h-3.5 w-3.5" /> Multilingual Agronomic Advisory AI
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            AI Agricultural Assistant
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Conversational agronomist trained on ICAR, TNAU, and Agmarknet protocols. Supports voice and text input in English, Tamil, and Hindi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
            <Globe className="h-3.5 w-3.5 text-stone-400 ml-2" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                language === 'en'
                  ? 'bg-[#245C3A] text-white'
                  : 'text-stone-600 dark:text-[#CFDEC9] hover:bg-stone-100 dark:hover:bg-[#193D2A]'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                language === 'ta'
                  ? 'bg-[#245C3A] text-white'
                  : 'text-stone-600 dark:text-[#CFDEC9] hover:bg-stone-100 dark:hover:bg-[#193D2A]'
              }`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                language === 'hi'
                  ? 'bg-[#245C3A] text-white'
                  : 'text-stone-600 dark:text-[#CFDEC9] hover:bg-stone-100 dark:hover:bg-[#193D2A]'
              }`}
            >
              हिंदी
            </button>
          </div>

          <Link
            href="/alerts"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            <Bell className="h-4 w-4" />
            Module 27: Alerts &rarr;
          </Link>
        </div>
      </div>

      {/* Main Chat Console Card */}
      <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/40 bg-white dark:bg-[#162218] shadow-xs flex flex-col h-[650px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-stone-100 dark:border-[#245C3A]/30 flex items-center justify-between bg-stone-50/50 dark:bg-[#121c14]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#245C3A] flex items-center justify-center text-white shadow-xs">
              <Bot className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                Crop360 Agronomist AI
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-[#a0b5a3]">
                Knowledge: ICAR & TNAU &bull; Language: {language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिंदी' : 'English'}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setMessages([
                {
                  id: 'reset',
                  sender: 'assistant',
                  text: 'Chat history cleared. How can I assist you with your farm operations today?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#193D2A] transition-colors text-xs flex items-center gap-1"
            title="Reset conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#245C3A] text-white rounded-tr-none'
                      : 'bg-stone-100 dark:bg-[#121c14] border border-stone-200/60 dark:border-[#245C3A]/30 text-stone-800 dark:text-stone-200 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {m.text}
                  <div
                    className={`mt-1.5 text-[10px] text-right ${
                      isUser ? 'text-emerald-200' : 'text-stone-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="h-8 w-8 rounded-lg bg-[#245C3A] flex items-center justify-center text-white shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3 rounded-2xl rounded-tl-none bg-stone-100 dark:bg-[#121c14] border border-stone-200/60 dark:border-[#245C3A]/30 flex items-center gap-2 text-xs text-stone-500 dark:text-[#a0b5a3]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#245C3A] dark:text-emerald-400" />
                <span>Consulting ICAR/TNAU agronomy database...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries Pills */}
        <div className="px-4 py-2 border-t border-stone-100 dark:border-[#245C3A]/20 bg-stone-50/50 dark:bg-[#121c14]/40 overflow-x-auto flex gap-2">
          {SAMPLE_QUERIES[language].map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs bg-white dark:bg-[#162218] border border-[#E3E8DF] dark:border-[#245C3A]/40 text-stone-700 dark:text-[#CFDEC9] hover:border-[#245C3A] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-stone-200 dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2.5 rounded-xl border transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : 'border-stone-200 dark:border-[#245C3A]/40 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#193D2A]'
              }`}
              title={isRecording ? 'Listening...' : 'Voice Input'}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'விவசாயக் கேள்விகளை தட்டச்சு செய்யவும் அல்லது பேசவும்...'
                  : language === 'hi'
                  ? 'अपनी खेती से संबंधित प्रश्न यहाँ लिखें...'
                  : 'Ask about fertilizer dosage, pest control, weather, or mandi prices...'
              }
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-[#245C3A]/40 bg-stone-50 dark:bg-[#121c14] text-stone-900 dark:text-white outline-none focus:ring-1 focus:ring-[#245C3A]"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white disabled:opacity-40 transition-colors shadow-xs"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
