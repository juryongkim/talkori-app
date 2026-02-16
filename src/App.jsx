import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Play, ChevronLeft, ChevronRight, Volume2, 
  Menu, X, Zap, Gauge, ArrowLeft, LogOut,
  GraduationCap, LayoutGrid
} from 'lucide-react';

// 실제 데이터 파일을 불러옵니다.
import rawData from './data.json';

// ==========================================
// [설정] 보안 및 이동 주소 (반드시 확인!)
// ==========================================
const ALLOWED_ORIGIN = "https://talkori.com";     // 워드프레스 도메인
const EXIT_URL = "https://talkori.com/classroom"; // 종료 후 돌아갈 강의실 주소
const BUNNY_CDN_HOST = "https://talkori.b-cdn.net"; 
const CDN_BASE_URL = `${BUNNY_CDN_HOST}/audio_tk`;

const App = () => {
  // 1. 보안 장치: 인가된 도메인(워드프레스)을 통해서만 접속 허용
  const [isAuthorized, setIsAuthorized] = useState(true); 

  useEffect(() => {
    const referrer = document.referrer;
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    
    // 로컬 테스트 환경이 아니고 리퍼러가 일치하지 않으면 차단
    if (!isLocal && (!referrer || !referrer.startsWith(ALLOWED_ORIGIN))) {
      setIsAuthorized(false);
    }
  }, []);

  // 2. 데이터 가공: Nested JSON 구조 매핑
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
    return Object.values(groups);
  }, []);

  const [activeChapter, setActiveChapter] = useState(null);
  const [activeWord, setActiveWord] = useState(null); 
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // 🎵 오디오 제어를 위한 Ref
  const audioRef = useRef(null);

  useEffect(() => {
    if (CURRICULUM.length > 0 && !activeChapter) {
      setActiveChapter(CURRICULUM[0]);
    }
  }, [CURRICULUM]);

  // 단어가 바뀌면 재생 중이던 소리 즉시 정지
  useEffect(() => { stopCurrentAudio(); }, [activeWord, activeChapter]);

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playAudio = (url) => {
    stopCurrentAudio(); // 중첩 방지
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

  // 🚪 [종료 로직] 아이프레임을 빠져나가 부모 창(워드프레스)을 이동시킵니다.
  const handleExit = () => {
    if (window.confirm("학습을 종료하고 강의실로 돌아갈까요?")) {
      window.top.location.href = EXIT_URL;
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-10 text-center">
        <div>
          <h1 className="text-4xl font-black text-[#3713ec] mb-4 tracking-tighter">ACCESS DENIED</h1>
          <p className="text-slate-500 mb-8 font-medium">Talkori는 공식 강의실 내에서만 이용 가능합니다.</p>
          <button onClick={() => window.top.location.href = ALLOWED_ORIGIN} className="px-8 py-3 bg-[#3713ec] text-white rounded-xl font-bold shadow-lg shadow-[#3713ec]/20 hover:scale-105 transition-all">홈페이지로 이동</button>
        </div>
      </div>
    );
  }

  if (!activeChapter) return <div className="flex h-screen items-center justify-center text-[#3713ec] font-bold">Loading Talkori...</div>;

  return (
    <div className="flex h-screen bg-[#f6f6f8] font-sans text-slate-800 overflow-hidden">
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
                <p className="text-[10px] text-[#3713ec] font-bold uppercase tracking-widest">Exit to Class</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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
          </div>
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
              <button onClick={handleExit} className="hidden md:flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-500 font-bold transition-colors">
                <LogOut size={18} /> EXIT
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
                <button onClick={handleExit} className="p-2 text-slate-300 hover:text-red-400 transition-colors">
                  <LogOut size={20} />
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
