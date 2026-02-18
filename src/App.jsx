import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Play, ChevronLeft, ChevronRight, Volume2, 
  Menu, X, Zap, Gauge, ArrowLeft, LogOut,
  GraduationCap, LayoutGrid, Lock, Sparkles,
  BookOpen, HelpCircle, Activity, Map, MessageCircle
} from 'lucide-react';

import rawData from './data.json';

// ==========================================
// [설정] 주소 및 보안 설정
// ==========================================
const ALLOWED_ORIGIN = "https://talkori.com";     
const SALES_PAGE_URL = "https://talkori.com/pricing";  
const BUNNY_CDN_HOST = "https://talkori.b-cdn.net"; 
const CDN_BASE_URL = `${BUNNY_CDN_HOST}/audio_tk`;

const App = () => {
  // 0. 데모 모드 및 가이드 상태 관리
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';
  const [showGuide, setShowGuide] = useState(true); // 앱 켜자마자 가이드 보이기 (true)

  // 1. 보안 장치
  const [isAuthorized, setIsAuthorized] = useState(true); 

  useEffect(() => {
    const referrer = document.referrer;
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isLocal && (!referrer || !referrer.startsWith(ALLOWED_ORIGIN))) {
      setIsAuthorized(false);
    }
  }, []);

  // 2. 데이터 가공
  const CURRICULUM = useMemo(() => {
    if (!Array.isArray(rawData)) return [];
    const groups = {};
    rawData.forEach(item => {
      const dayKey = String(item.day || "1");
      if (!groups[dayKey]) {
        groups[dayKey] = {
          chapterId: dayKey,
          title: `Day ${dayKey}: ${item.situation || "Learning"}`,
          words: []
        };
      }
      groups[dayKey].words.push({
        id: String(item.id),
        word: item.word,
        meaning: item.meaning,
        usage_note: item.usage_note,
        examples: item.examples || []
      });
    });
    const allChapters = Object.values(groups);
    if (isDemoMode) return allChapters.slice(0, 1);
    return allChapters;
  }, [isDemoMode]);

  const [activeChapter, setActiveChapter] = useState(null);
  const [activeWord, setActiveWord] = useState(null); 
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (CURRICULUM.length > 0 && !activeChapter) {
      setActiveChapter(CURRICULUM[0]);
    }
  }, [CURRICULUM]);

  useEffect(() => { stopCurrentAudio(); }, [activeWord, activeChapter, showGuide]);

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playAudio = (url) => {
    stopCurrentAudio();
    const audio = new Audio(url);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;
    audio.play().catch(e => console.error("Audio Play Error:", e));
  };

  const getAudioUrl = (wordId, exIndex = null) => {
    const cleanId = String(wordId).trim();
    // [중요] 모든 파일은 .mp3 (소문자) 기준입니다.
    if (exIndex === null) return `${CDN_BASE_URL}/w_${cleanId}.mp3`;
    const formattedNum = String(exIndex + 1).padStart(2, '0');
    return `${CDN_BASE_URL}/w_${cleanId}_ex_${formattedNum}.mp3`;
  };

  const toggleSpeed = () => {
    setPlaybackRate(prev => (prev === 1.0 ? 0.8 : prev === 0.8 ? 0.6 : 1.0));
  };

  const handleExit = () => {
    if (isDemoMode) {
        window.parent.location.href = SALES_PAGE_URL;
    } else {
        window.parent.postMessage('exit_talkori', '*');
    }
  };

  // --- 가이드 컴포넌트 (Carousel) ---
  const GuideOverlay = () => {
    const [slide, setSlide] = useState(0);
    const slides = [
      {
        title: "You know the words... so why can't you speak?",
        desc: "We’ve all been there. Memorizing lists like 'Delicious = 맛있다' until your eyes hurt, but freezing in real life. That’s because words only come to life inside sentences.",
        icon: <HelpCircle size={80} className="text-[#3713ec] mb-4" />,
        sub: "Stop collecting 'frozen' words."
      },
      {
        title: "1 Word x 10 Faces",
        desc: "Instead of just a definition, we give you 10 different 'expressions' for every single word. Past, future, questions, and even 'Banmal'.",
        icon: <div className="relative mb-4">
                <MessageCircle size={80} className="text-[#3713ec]" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xl">x10</span>
              </div>,
        sub: "Master questions, past tense, and casual talk all at once."
      },
      {
        title: "Waveform Shadowing",
        desc: "Don't just look—listen and overlap. Match your voice to the native speaker’s rhythm. When your waves align, you’re officially speaking like a local.",
        icon: <Activity size={80} className="text-[#3713ec] mb-4" />,
        sub: "Visualize your voice and match the native waveform."
      },
      {
        title: "Your 45-Day Roadmap",
        desc: "Every word comes with 10 magic sentences. From convenience stores to blind dates, learn words where they actually happen.",
        icon: <Map size={80} className="text-[#3713ec] mb-4" />,
        sub: "Ready to step into your first situation?",
        isLast: true
      }
    ];

    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="max-w-md w-full text-center flex flex-col items-center">
          <div className="mb-6 transform transition-all duration-500 hover:scale-110">
            {slides[slide].icon}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 leading-tight">
            {slides[slide].title}
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            {slides[slide].desc}
          </p>
          <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 text-xs font-bold text-[#3713ec] mb-10">
            {slides[slide].sub}
          </div>

          <div className="flex gap-2 mb-8">
            {slides.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-[#3713ec]' : 'w-2 bg-slate-200'}`}></div>
            ))}
          </div>

          <div className="w-full flex gap-4">
            {slide > 0 && (
              <button onClick={() => setSlide(slide - 1)} className="flex-1 py-4 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">
                Back
              </button>
            )}
            <button 
              onClick={() => {
                if (slides[slide].isLast) {
                  setShowGuide(false);
                } else {
                  setSlide(slide + 1);
                }
              }}
              className="flex-1 py-4 bg-[#3713ec] text-white rounded-xl font-bold shadow-lg shadow-[#3713ec]/30 hover:scale-105 transition-transform"
            >
              {slides[slide].isLast ? "Start Learning 🚀" : "Next"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- 메인 렌더링 ---
  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-10 text-center">
        <div>
          <h1 className="text-4xl font-black text-[#3713ec] mb-4 tracking-tighter">ACCESS DENIED</h1>
          <p className="text-slate-500 mb-8 font-medium">Talkori는 공식 웹사이트 내에서만 이용 가능합니다.</p>
          <button onClick={() => window.location.href = ALLOWED_ORIGIN} className="px-8 py-3 bg-[#3713ec] text-white rounded-xl font-bold shadow-lg shadow-[#3713ec]/20 hover:scale-105 transition-all">홈페이지로 이동</button>
        </div>
      </div>
    );
  }

  if (!activeChapter) return <div className="flex h-screen items-center justify-center text-[#3713ec] font-bold">Loading Talkori...</div>;

  return (
    <div className="flex h-screen bg-[#f6f6f8] font-sans text-slate-800 overflow-hidden relative">
      
      {/* 가이드 오버레이 (showGuide가 true일 때만 보임) */}
      {showGuide && <GuideOverlay />}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-slate-200 shadow-xl md:shadow-none`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-50">
            <div onClick={handleExit} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 bg-[#3713ec] rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                <GraduationCap className="text-white" size={24} />
              </div>
              <div>
                <h1 className="font-bold text-xl text-slate-800 tracking-tight">Talkori</h1>
                <p className="text-[10px] text-[#3713ec] font-bold uppercase tracking-widest">
                  {isDemoMode ? "Free Trial" : "Exit to Class"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* [NEW] 가이드 열기 버튼 추가 */}
            <div 
              onClick={() => { setShowGuide(true); setIsSidebarOpen(false); }}
              className="flex items-center gap-4 p-3 mb-4 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-600">
                <BookOpen size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-blue-800">How to Study?</h3>
                <p className="text-[10px] text-blue-500 font-bold uppercase">Guide Book</p>
              </div>
            </div>

            <div className="h-px bg-slate-100 mb-4 mx-2"></div>

            {/* 커리큘럼 리스트 */}
            {CURRICULUM.map((chapter, idx) => (
              <div key={idx} onClick={() => { setActiveChapter(chapter); setActiveWord(null); setIsSidebarOpen(false); }}
                className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all mb-2 ${activeChapter.chapterId === chapter.chapterId ? 'bg-[#3713ec]/5 border border-[#3713ec]/10' : 'hover:bg-slate-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${activeChapter.chapterId === chapter.chapterId ? 'bg-[#3713ec] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {chapter.chapterId}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className={`font-bold text-sm truncate ${activeChapter.chapterId === chapter.chapterId ? 'text-[#3713ec]' : 'text-slate-600'}`}>{chapter.title}</h3>
                </div>
              </div>
            ))}
            
            {isDemoMode && (
              <div className="opacity-50 mt-4 space-y-2 select-none cursor-not-allowed" onClick={handleExit}>
                 <div className="p-3 flex items-center gap-4 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                     <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400"><Lock size={14}/></div>
                     <div className="text-xs font-bold text-slate-400">Day 2 (Locked)</div>
                 </div>
                 <div className="text-center text-[10px] text-slate-400 font-bold mt-2">+ More Chapters Locked</div>
              </div>
            )}
          </div>
          
          {isDemoMode && (
             <div className="p-4 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50">
                <button onClick={handleExit} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-black hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2">
                    <Sparkles size={16} className="text-yellow-400 fill-current"/> Unlock All Content
                </button>
             </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {!activeWord ? (
          /* DASHBOARD VIEW */
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            <header className="mb-8 flex items-center justify-between">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white rounded-lg shadow-sm mr-4"><Menu size={20}/></button>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[#3713ec] font-bold text-xs mb-1 uppercase tracking-wider">
                  <Zap size={14} /> Matrix Learning System
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{activeChapter.title}</h2>
              </div>
              <button onClick={handleExit} className="hidden md:flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-[#3713ec] font-bold transition-colors">
                {isDemoMode ? <><Sparkles size={18}/> Full Version</> : <><LogOut size={18}/> EXIT</>}
              </button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
              {activeChapter.words.map((word, idx) => (
                <div key={idx} onClick={() => { setActiveWord(word); setCurrentExIdx(0); }}
                  className="bg-white p-6 rounded-2xl border-b-4 border-slate-100 hover:border-[#3713ec] hover:-translate-y-1 transition-all cursor-pointer shadow-sm group">
                  <h4 className="text-2xl font-bold text-slate-800 my-1 group-hover:text-[#3713ec] transition-colors korean-text">{word.word}</h4>
                  <p className="text-sm font-medium text-slate-500">{word.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* MATRIX VIEW */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#f6f6f8]">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <button onClick={() => setActiveWord(null)} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-[#3713ec] transition-all">
                <ArrowLeft size={18} /> Back to List
              </button>
              <div className="flex items-center gap-4">
                <button onClick={toggleSpeed} className="flex items-center gap-1 bg-[#3713ec]/10 px-3 py-1.5 rounded-full text-xs font-bold text-[#3713ec]">
                  <Gauge size={14} /> {playbackRate}x
                </button>
                <button onClick={handleExit} className="p-2 text-slate-300 hover:text-[#3713ec] transition-colors">
                  {isDemoMode ? <Sparkles size={20}/> : <LogOut size={20}/>}
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <h2 className="text-5xl font-black text-slate-900 mb-2 korean-text">{activeWord.word}</h2>
                    <p className="text-xl text-slate-500 font-medium mb-6">{activeWord.meaning}</p>
                    <button onClick={() => playAudio(getAudioUrl(activeWord.id))} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-[#3713ec] hover:text-white transition-all shadow-inner">
                      <Volume2 size={20} />
                    </button>
                    {activeWord.usage_note && (
                      <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 text-[11px] text-blue-800 leading-relaxed korean-text font-medium">
                        <span className="font-bold underline">Note:</span> {activeWord.usage_note}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#3713ec] rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-[#3713ec]/20 min-h-[300px] flex flex-col justify-center relative overflow-hidden group">
                    <div className="relative z-10">
                      <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest block mb-4">Pattern {currentExIdx + 1}: {activeWord.examples[currentExIdx]?.type}</span>
                      <h3 className="text-3xl md:text-4xl font-bold mb-4 korean-text break-keep leading-snug">
                        {activeWord.examples[currentExIdx]?.ko}
                      </h3>
                      <p className="text-white/70 text-lg mb-10 font-medium italic">{activeWord.examples[currentExIdx]?.en}</p>
                      <button onClick={() => playAudio(getAudioUrl(activeWord.id, currentExIdx))}
                        className="w-16 h-16 bg-white text-[#3713ec] rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform">
                        <Volume2 size={32} className="fill-current" />
                      </button>
                    </div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full lg:max-h-[650px] overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-tight">
                    <LayoutGrid size={18} className="text-[#3713ec]" /> Variation Matrix
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                      {activeWord.examples.map((ex, idx) => (
                        <button key={idx} onClick={() => { setCurrentExIdx(idx); playAudio(getAudioUrl(activeWord.id, idx)); }}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${currentExIdx === idx ? 'border-[#3713ec] bg-[#3713ec] text-white shadow-lg' : 'border-slate-50 bg-slate-50/50 hover:border-[#3713ec]/30 text-slate-600'}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${currentExIdx === idx ? 'bg-white/20 text-white' : 'bg-white text-slate-300'}`}>{idx + 1}</div>
                          <div className="flex-1 overflow-hidden">
                            <p className={`text-[10px] font-bold uppercase mb-0.5 tracking-tighter ${currentExIdx === idx ? 'text-white/60' : 'text-slate-400'}`}>{ex.type}</p>
                            <p className="font-bold korean-text truncate">{ex.ko}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </main>

            <footer className="bg-white border-t border-slate-100 p-4 flex justify-between items-center shrink-0">
              <button onClick={() => {
                const idx = activeChapter.words.findIndex(w => w.id === activeWord.id);
                if(idx > 0) { setActiveWord(activeChapter.words[idx-1]); setCurrentExIdx(0); }
              }} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all">
                <ChevronLeft /> PREV
              </button>
              <button onClick={() => {
                const idx = activeChapter.words.findIndex(w => w.id === activeWord.id);
                if(idx < activeChapter.words.length - 1) { setActiveWord(activeChapter.words[idx+1]); setCurrentExIdx(0); }
              }} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all">
                NEXT WORD <ChevronRight />
              </button>
            </footer>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;800&family=Noto+Sans+KR:wght@400;700;900&display=swap');
        body { font-family: 'Lexend', sans-serif; overflow: hidden; }
        .korean-text { font-family: 'Noto Sans KR', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
