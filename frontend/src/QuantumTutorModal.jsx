import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, X, Send, Sparkles, ChevronDown, ChevronUp, RotateCcw, 
  HelpCircle, Award, CheckCircle, ArrowRight, Lightbulb, MessageSquare,
  BookOpen, Terminal, Cpu, RefreshCw
} from 'lucide-react';
import { 
  TUTOR_TOPICS, TUTOR_CHALLENGES, analyzeCircuit, 
  checkOllamaBackend, queryOllamaTutor 
} from './tutorEngine';

/**
 * Format markdown text: handles **bold**, headers, inline `code`, and clean paragraphs
 */
function renderFormattedMarkdown(text) {
  if (!text) return null;
  const paragraphs = text.split('\n\n');

  return paragraphs.map((para, pIdx) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Headings (e.g. ### Heading or **Heading**)
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={pIdx} className="font-serif font-bold text-base text-[#2A2A2A] mt-2 mb-1">
          {trimmed.replace(/^###\s*/, '')}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={pIdx} className="font-serif font-bold text-lg text-[#2A2A2A] mt-3 mb-1">
          {trimmed.replace(/^##\s*/, '')}
        </h3>
      );
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').filter(line => line.trim().length > 0);
      return (
        <ul key={pIdx} className="space-y-1 my-1 list-disc list-inside">
          {items.map((item, iIdx) => (
            <li key={iIdx} className="text-xs leading-relaxed">
              {parseInlineMarkdown(item.replace(/^[-*]\s*/, ''))}
            </li>
          ))}
        </ul>
      );
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items = trimmed.split('\n').filter(line => line.trim().length > 0);
      return (
        <ol key={pIdx} className="space-y-1 my-1 list-decimal list-inside">
          {items.map((item, iIdx) => (
            <li key={iIdx} className="text-xs leading-relaxed">
              {parseInlineMarkdown(item.replace(/^\d+\.\s*/, ''))}
            </li>
          ))}
        </ol>
      );
    }

    // Standard paragraph with inline styling
    return (
      <p key={pIdx} className="text-xs sm:text-sm leading-relaxed">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  });
}

function parseInlineMarkdown(text) {
  if (!text) return null;
  // Match **bold**, `code`, or regular text
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-[#18181B]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="font-mono text-xs bg-black/5 text-[#B75D29] px-1.5 py-0.5 rounded-sm">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function QuantumTutorModal({
  isOpen,
  onClose,
  currentGates = [],
  onApplyTemplate
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'tutor',
      text: `👋 **Welcome to Seeing Quantum AI Tutor!**\n\nI am powered by **Ollama** (Local LLM) and aware of your active quantum circuit in real-time. I can explain principles, solve math questions, and verify your quantum state.\n\n*What would you like to explore today?*`,
      suggestions: [
        '🔍 Explain current circuit',
        '🌀 How does Hadamard (H) work?',
        '🔗 What is a Bell State?',
        '🏆 Give me a quantum challenge'
      ],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'topics' | 'challenges' | 'inspector'
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeStatus, setChallengeStatus] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState({ available: false, models: [] });
  const [selectedModel, setSelectedModel] = useState('llama3');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Check Ollama status on open
  useEffect(() => {
    if (isOpen) {
      checkOllamaBackend().then(res => {
        setOllamaStatus(res);
        if (res.models && res.models.length > 0) {
          setSelectedModel(res.models[0]);
        }
      });
    }
  }, [isOpen]);

  // Handle user sending a prompt
  const handleSend = async (textToSend = null) => {
    const text = textToSend || inputText;
    if (!text || !text.trim()) return;

    const userMsg = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Build chat history for LLM
    const history = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    // Query Ollama (with built-in offline engine fallback)
    const response = await queryOllamaTutor(text, currentGates, selectedModel, history);

    const tutorMsg = {
      id: 'tutor_' + Date.now(),
      sender: 'tutor',
      text: response.text,
      suggestions: response.suggestions,
      source: response.source,
      model: response.model,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, tutorMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Evaluate Active Challenge
  const checkChallenge = (challenge) => {
    const analysis = analyzeCircuit(currentGates);
    const result = challenge.verify(currentGates, { probabilities: analysis.probabilities });
    setChallengeStatus(result);
  };

  if (!isOpen) return null;

  const circuitSummary = analyzeCircuit(currentGates);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-[#E4E4E7] w-full max-w-3xl h-[88vh] max-h-[780px] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#2A2A2A]"
        style={{
          boxShadow: '0 24px 48px -12px rgba(183, 93, 41, 0.12), 0 12px 24px -4px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4E7] bg-[#FAFAFA]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F6EEE8] border border-[#B75D29]/20 flex items-center justify-center text-[#B75D29] shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-semibold text-lg text-[#2A2A2A]">Seeing Quantum Tutor</h3>
                
                {/* Ollama Status Tag */}
                {ollamaStatus.available ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
                    <Cpu className="w-3 h-3 text-emerald-600" />
                    Ollama Online
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1" title="Backend/Ollama not connected. Using local quantum physics engine.">
                    Local Quantum Engine
                  </span>
                )}

                {/* Books / Notes RAG indicator */}
                {ollamaStatus.books && ollamaStatus.books.length > 0 && (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1" title={`Loaded books: ${ollamaStatus.books.join(', ')}`}>
                    📚 {ollamaStatus.books.length} {ollamaStatus.books.length === 1 ? 'Book' : 'Books'} Loaded
                  </span>
                )}
              </div>
              <p className="text-xs text-[#71717A]">
                AI-guided quantum mechanics & real-time circuit tutor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector if Ollama models exist */}
            {ollamaStatus.models && ollamaStatus.models.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs font-mono bg-white border border-[#E4E4E7] text-[#2A2A2A] rounded-lg px-2.5 py-1 outline-hidden focus:border-[#B75D29]"
              >
                {ollamaStatus.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#71717A] hover:text-[#2A2A2A] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
              title="Close Tutor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-[#E4E4E7] bg-[#FAFAFA]/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'chat' 
                ? 'bg-[#B75D29] text-white shadow-xs' 
                : 'text-[#71717A] hover:text-[#2A2A2A] hover:bg-black/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Tutor Chat
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'topics' 
                ? 'bg-[#B75D29] text-white shadow-xs' 
                : 'text-[#71717A] hover:text-[#2A2A2A] hover:bg-black/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Core Concepts
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'challenges' 
                ? 'bg-[#B75D29] text-white shadow-xs' 
                : 'text-[#71717A] hover:text-[#2A2A2A] hover:bg-black/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Interactive Challenges
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'inspector' 
                ? 'bg-[#B75D29] text-white shadow-xs' 
                : 'text-[#71717A] hover:text-[#2A2A2A] hover:bg-black/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Live Circuit State ({currentGates.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
          
          {/* TAB 1: CHAT */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#A1A1AA]">
                    <span>{msg.sender === 'user' ? 'You' : 'Quantum Tutor'}</span>
                    <span>•</span>
                    <span>{msg.time}</span>
                  </div>
                  <div 
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#B75D29] text-white rounded-tr-none shadow-xs'
                        : 'bg-[#F9F9FB] border border-[#E4E4E7] text-[#2A2A2A] rounded-tl-none shadow-2xs'
                    }`}
                  >
                    <div className="text-sm leading-relaxed space-y-2">
                      {renderFormattedMarkdown(msg.text)}
                    </div>

                    {/* Interactive suggestions button list */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-black/10 flex flex-wrap gap-1.5">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSend(sug)}
                            className="text-xs bg-white text-[#B75D29] border border-[#B75D29]/20 hover:bg-[#F6EEE8] px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Sparkles className="w-3 h-3" />
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#71717A] bg-[#F9F9FB] border border-[#E4E4E7] w-fit px-3 py-2 rounded-xl animate-pulse">
                  <Bot className="w-3.5 h-3.5 text-[#B75D29]" />
                  Quantum Tutor is synthesizing quantum mechanics...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* TAB 2: TOPICS */}
          {activeTab === 'topics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TUTOR_TOPICS.map((topic) => (
                <div 
                  key={topic.id}
                  onClick={() => {
                    setActiveTab('chat');
                    handleSend(topic.prompt);
                  }}
                  className="p-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] hover:border-[#B75D29]/40 hover:bg-[#F6EEE8]/30 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="text-2xl mb-2">{topic.icon}</div>
                    <h4 className="font-serif font-semibold text-sm text-[#2A2A2A] group-hover:text-[#B75D29] transition-colors">
                      {topic.title}
                    </h4>
                    <p className="text-xs text-[#71717A] mt-1 line-clamp-2">
                      {topic.prompt}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#B75D29] font-medium mt-3">
                    <span>Ask Tutor</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: CHALLENGES */}
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F6EEE8] border border-[#B75D29]/20 rounded-xl text-xs text-[#B75D29] flex items-center gap-2">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>Build the circuit in your Workbench and click <b>Verify Circuit</b> to test your quantum state!</span>
              </div>

              {TUTOR_CHALLENGES.map((ch) => (
                <div 
                  key={ch.id}
                  className="p-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm text-[#2A2A2A] flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#B75D29]" />
                      {ch.title}
                    </h4>
                    <button
                      onClick={() => {
                        setActiveChallenge(ch);
                        checkChallenge(ch);
                      }}
                      className="px-3 py-1 bg-[#B75D29] hover:bg-[#A04D1F] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                    >
                      Verify Circuit
                    </button>
                  </div>

                  <p className="text-xs text-[#2A2A2A] font-medium">{ch.goal}</p>
                  <p className="text-[11px] text-[#71717A] italic bg-white p-2 rounded-lg border border-[#E4E4E7]">
                    💡 <b>Hint:</b> {ch.hint}
                  </p>

                  {activeChallenge?.id === ch.id && challengeStatus && (
                    <div className={`mt-2 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      challengeStatus.passed
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {challengeStatus.passed ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      ) : (
                        <HelpCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      )}
                      <span>{challengeStatus.message}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: LIVE CIRCUIT INSPECTOR */}
          {activeTab === 'inspector' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] space-y-3">
                <h4 className="font-serif font-semibold text-sm text-[#2A2A2A] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#B75D29]" />
                  Active Workbench Circuit State
                </h4>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-[#E4E4E7]">
                    <span className="text-[#71717A] block mb-1">Gate Count</span>
                    <span className="font-mono font-bold text-base text-[#2A2A2A]">{circuitSummary.gateCount} gates</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#E4E4E7]">
                    <span className="text-[#71717A] block mb-1">Statevector (Active)</span>
                    <span className="font-mono font-bold text-sm text-[#B75D29]">{circuitSummary.activeState || '|00⟩'}</span>
                  </div>
                </div>

                {circuitSummary.probabilities && (
                  <div className="bg-white p-3 rounded-lg border border-[#E4E4E7] space-y-2">
                    <span className="text-xs font-semibold text-[#71717A]">Measurement Probability Distribution</span>
                    <div className="grid grid-cols-4 gap-2">
                      {circuitSummary.probabilities.map(p => (
                        <div key={p.state} className="bg-[#FAFAFA] p-2 rounded text-center border border-[#E4E4E7]">
                          <div className="font-mono text-xs font-bold text-[#2A2A2A]">|{p.state}⟩</div>
                          <div className="text-xs text-[#B75D29] font-medium">{(p.probability * 100).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setActiveTab('chat');
                    handleSend('Explain my current circuit and what each gate contributes.');
                  }}
                  className="w-full py-2 bg-[#B75D29] hover:bg-[#A04D1F] text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask Tutor to Explain This Circuit Step-by-Step
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Input Bar */}
        <div className="p-4 border-t border-[#E4E4E7] bg-[#FAFAFA]">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-[#E4E4E7] px-3 py-2 focus-within:border-[#B75D29] focus-within:ring-2 focus-within:ring-[#B75D29]/10 transition-all shadow-2xs">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about quantum mechanics, gates, or your circuit..."
              className="flex-1 bg-transparent text-sm text-[#2A2A2A] placeholder-[#A1A1AA] outline-hidden"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className="p-2 rounded-lg bg-[#B75D29] text-white hover:bg-[#A04D1F] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#A1A1AA]">
            <span>💡 Tip: Ask "What happens if I add a Hadamard gate?" or "Show Bloch vector coordinates"</span>
            <span>Zero latency • Offline Ready</span>
          </div>
        </div>

      </div>
    </div>
  );
}
