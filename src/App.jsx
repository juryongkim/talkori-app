import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Play, ChevronLeft, ChevronRight, Volume2,
  Menu, X, Zap, Gauge, ArrowLeft, LogOut,
  GraduationCap, LayoutGrid, Lock, Sparkles,
  BookOpen, HelpCircle, Activity, Map, MessageCircle, Lightbulb, Waves, Target
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
  // 0. 상태 관리
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';
  // 앱 처음 실행 시 true로 설정하여 가이드가 메인 화면에 보이게 함
  const [showGuideMain, setShowGuideMain] = useState(true);

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

  useEffect(() => { stopCurrentAudio(); }, [activeWord, activeChapter, showGuideMain]);

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

// --- [UPDATE] 커리큘럼 로드맵이 추가된 최종 가이드북 ---
  const GuideBook = () => {
    return (
      <div className="flex-1 overflow-y-auto bg-white">
        {/* 모바일 헤더 */}
        <header className="flex items-center justify-between p-6 md:hidden sticky top-0 bg-white/90 backdrop-blur-sm z-10 border-b border-slate-100">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-50 rounded-lg shadow-sm mr-4"><Menu size={20}/></button>
          <h2 className="text-lg font-bold text-slate-900">Start Guide</h2>
          <div className="w-10"></div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-10 md:py-16 space-y-20">
          
          {/* 1. Hero Section */}
          <section className="text-center animate-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-6">
              <HelpCircle size={14} /> Why can't I speak?
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              You know the words.<br/>
              <span className="text-[#3713ec]">So why do you freeze?</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Stop memorizing lists like <span className="font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">Delicious = 맛있다</span>.
              <br className="hidden md:block"/> Real conversations don't happen in single words.
            </p>
          </section>

          {/* 2. Visual Contrast */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            {/* Old Way */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center opacity-70 grayscale transition-all hover:grayscale-0 hover:opacity-100 group">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">The Old Way</div>
              <div className="text-3xl font-bold text-slate-400 mb-2 line-through decoration-red-400 decoration-4 group-hover:text-slate-600 transition-colors">Delicious</div>
              <p className="text-sm text-slate-400">Just a frozen word. <br/>You can't use this in real life.</p>
            </div>

            {/* New Way */}
            <div className="bg-[#3713ec] p-8 rounded-3xl shadow-xl shadow-[#3713ec]/20 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">The Matrix Way</div>
              <div className="space-y-2 mb-4 relative z-10">
                <div className="bg-white/10 px-4 py-2 rounded-lg text-white font-bold text-lg">"Is this delicious?" <span className="text-xs font-normal opacity-70 ml-2">(Question)</span></div>
                <div className="bg-white/10 px-4 py-2 rounded-lg text-white font-bold text-lg">"It wasn't delicious." <span className="text-xs font-normal opacity-70 ml-2">(Past)</span></div>
              </div>
              <p className="text-sm text-white/80">We give you <span className="font-bold text-white border-b border-white/40">10 real sentences</span> for every word.</p>
            </div>
          </section>

          {/* [NEW] 3. Curriculum Roadmap (추가된 부분) */}
          <section className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
             <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Your 45-Day Journey</h2>
                <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
                  "Talkori guides you from your room (Day 1) to the heart of Korean society (Day 45). <br className="hidden md:block"/>Expand your world one word at a time."
                </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* 연결선 (데스크탑용) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 -z-10"></div>

                {/* Phase 1 */}
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm relative hover:-translate-y-1 transition-transform">
                   <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm mb-4 border-4 border-white">01</div>
                   <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Day 1 ~ 15</div>
                   <h3 className="font-bold text-lg text-slate-900 mb-2">Survival & Intuition</h3>
                   <p className="text-sm text-slate-500 leading-relaxed">
                     <span className="font-bold text-slate-700">"Me & My Home"</span><br/>
                     Focus on concrete nouns you can see and touch. Basic survival words like family, body, and food.
                   </p>
                </div>

                {/* Phase 2 */}
                <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm relative hover:-translate-y-1 transition-transform">
                   <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm mb-4 border-4 border-white">02</div>
                   <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Day 16 ~ 30</div>
                   <h3 className="font-bold text-lg text-slate-900 mb-2">Society & Action</h3>
                   <p className="text-sm text-slate-500 leading-relaxed">
                     <span className="font-bold text-slate-700">"The City"</span><br/>
                     Step outside. Use transport, banks, and shops. Start using verbs and expressing emotions.
                   </p>
                </div>

                {/* Phase 3 */}
                <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm relative hover:-translate-y-1 transition-transform">
                   <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm mb-4 border-4 border-white">03</div>
                   <div className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-1">Day 31 ~ 45</div>
                   <h3 className="font-bold text-lg text-slate-900 mb-2">Connection & Mastery</h3>
                   <p className="text-sm text-slate-500 leading-relaxed">
                     <span className="font-bold text-slate-700">"Deep Talk"</span><br/>
                     Master logic, abstract ideas, and polite manners (Honorifics). Complete your Korean nuance.
                   </p>
                </div>
             </div>
          </section>

          {/* 4. The 3 Steps Method */}
          <section className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
             <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">
               How to Study?
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="p-6 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-lg transition-all group">
                  <div className="w-10 h-10 bg-white text-[#3713ec] rounded-lg shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Map size={20} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">1. The Context</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Imagine the situation first.
                  </p>
                </div>
                
                {/* Step 2 */}
                <div className="p-6 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-lg transition-all group">
                  <div className="w-10 h-10 bg-white text-purple-600 rounded-lg shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <LayoutGrid size={20} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">2. The Matrix</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Practice 10 sentence patterns.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-6 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-lg transition-all group">
                  <div className="w-10 h-10 bg-white text-pink-600 rounded-lg shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Waves size={20} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">3. The Waveform</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Shadow the native rhythm.
                  </p>
                </div>
             </div>
          </section>

          {/* 5. Action */}
          <div className="text-center pb-10 animate-in slide-in-from-bottom-4 duration-700 delay-500">
            <button 
              onClick={() => setShowGuideMain(false)} 
              className="w-full md:w-auto px-12 py-5 bg-[#3713ec] text-white text-lg font-bold rounded-2xl shadow-xl shadow-[#3713ec]/30 hover:scale-105 hover:bg-[#2a0eb5] transition-all flex items-center justify-center gap-3"
            >
              Start Day 1 Now <ArrowLeft className="rotate-180" size={20}/>
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
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-slate-200 shadow-xl md:shadow-none flex flex-col h-full`}>
          <div className="p-6 border-b border-slate-50 shrink-0">
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
            {/* 가이드 열기 버튼 (언제든 다시 보기) */}
            <div 
              onClick={() => { setShowGuideMain(true); setActiveWord(null); setIsSidebarOpen(false); }}
              className={`flex items-center gap-4 p-3 mb-4 rounded-xl border cursor-pointer transition-colors ${showGuideMain ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${showGuideMain ? 'bg-blue-200 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <BookOpen size={16} />
              </div>
              <div>
                <h3 className={`font-bold text-sm ${showGuideMain ? 'text-blue-800' : 'text-slate-700'}`}>How to Study?</h3>
                <p className={`text-[10px] font-bold uppercase ${showGuideMain ? 'text-blue-500' : 'text-slate-400'}`}>Guide Book</p>
              </div>
            </div>

            <div className="h-px bg-slate-100 mb-4 mx-2"></div>

            {/* 커리큘럼 리스트 */}
            {CURRICULUM.map((chapter, idx) => (
              <div key={idx} onClick={() => { setActiveChapter(chapter); setActiveWord(null); setShowGuideMain(false); setIsSidebarOpen(false); }}
                className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all mb-2 ${!showGuideMain && activeChapter.chapterId === chapter.chapterId ? 'bg-[#3713ec]/5 border border-[#3713ec]/10' : 'hover:bg-slate-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${!showGuideMain && activeChapter.chapterId === chapter.chapterId ? 'bg-[#3713ec] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {chapter.chapterId}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className={`font-bold text-sm truncate ${!showGuideMain && activeChapter.chapterId === chapter.chapterId ? 'text-[#3713ec]' : 'text-slate-600'}`}>{chapter.title}</h3>
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
             <div className="p-4 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50 shrink-0">
                <button onClick={handleExit} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-black hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2">
                    <Sparkles size={16} className="text-yellow-400 fill-current"/> Unlock All Content
                </button>
             </div>
          )}
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {showGuideMain ? (
          /* [NEW] 가이드북 화면 (앱 실행 시 최초 표시) */
          <GuideBook />
        ) : !activeWord ? (
          /* DASHBOARD VIEW (단어 목록) */
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar animate-in fade-in duration-300">
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
          /* MATRIX VIEW (학습 화면) */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#f6f6f8] animate-in fade-in duration-300">
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
