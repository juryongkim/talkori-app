import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, ChevronLeft, ChevronRight, Volume2, 
  Menu, X, Zap, Gauge, Lock, LayoutGrid, ArrowLeft, Lightbulb, Info,
  GraduationCap
} from 'lucide-react';

// [중요] 실제 데이터 파일을 불러옵니다.
import rawData from './data.json';

const BUNNY_CDN_HOST = "https://talkori.b-cdn.net"; 
const CDN_BASE_URL = `${BUNNY_CDN_HOST}/audio_tk`;

const App = () => {
  // 1. 데이터 가공: flat한 data.json을 Chapter(Day)별로 그룹화
  const CURRICULUM = useMemo(() => {
    const groups = {};
    rawData.forEach(item => {
      if (!groups[item.Day]) {
        groups[item.Day] = {
          chapterId: item.Day,
          title: `Day ${item.Day}: ${item.Situation}`,
          words: []
        };
      }
      
      // 엑셀의 Ex1_Ko ~ Ex10_Ko 구조를 배열로 변환
      const examples = [];
      for (let i = 1; i <= 10; i++) {
        if (item[`Ex${i}_Ko` mini]) { // 예문이 있는 경우만 추가
          examples.push({
            type: item[`Ex${i}_Type`] || 'Pattern',
            ko: item[`Ex${i}_Ko`],
            en: item[`Ex${i}_En`]
          });
        }
      }

      groups[item.Day].words.push({
        id: item.ID,
        word: item.Word,
        meaning: item.Meaning,
        type: item.Usage_Note ? "Word" : "Basic", // 간단한 타입 구분
        usage_note: item.Usage_Note,
        examples: examples
      });
    });
    return Object.values(groups);
  }, []);

  // State 관리
  const [activeChapter, setActiveChapter] = useState(CURRICULUM[0]);
  const [activeWord, setActiveWord] = useState(null); 
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showNote, setShowNote] = useState(false);

  // 오디오 URL 생성 (명세서 규칙 적용)
  const getAudioUrl = (wordId, exIndex = null) => {
    const formattedId = String(wordId); 
    if (exIndex === null) {
      return `${CDN_BASE_URL}/w_${formattedId}.mp3`;
    } else {
      const formattedEx = String(exIndex + 1).padStart(2, '0');
      return `${CDN_BASE_URL}/w_${formattedId}_ex_${formattedEx}.mp3`;
    }
  };

  const playAudio = (url) => {
    const audio = new Audio(url);
    audio.playbackRate = playbackRate;
    audio.play().catch(e => console.error("Audio Play Error:", e));
  };

  const toggleSpeed = () => {
    setPlaybackRate(prev => (prev === 1.0 ? 0.8 : prev === 0.8 ? 0.6 : 1.0));
  };

  const navigateWord = (direction) => {
    const currentWordIndex = activeChapter.words.findIndex(w => w.id === activeWord.id);
    const newIndex = direction === 'next' ? currentWordIndex + 1 : currentWordIndex - 1;
    
    if (newIndex >= 0 && newIndex < activeChapter.words.length) {
      setActiveWord(activeChapter.words[newIndex]);
      setCurrentExIdx(0); 
    }
  };

  // --- Sub-Components ---

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-[#3713ec]/10 font-sans">
      <div className="p-6 border-b border-[#3713ec]/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#3713ec] rounded-lg flex items-center justify-center shadow-lg shadow-[#3713ec]/20">
            <GraduationCap className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">Talkori</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Learning Path</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-slate-400">
            <X />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {CURRICULUM.map((chapter, idx) => {
          const isActive = activeChapter.chapterId === chapter.chapterId;
          return (
            <div 
              key={idx} 
              onClick={() => { setActiveChapter(chapter); setActiveWord(null); setIsSidebarOpen(false); }}
              className={`flex items-start gap-4 mb-6 cursor-pointer group transition-all ${isActive ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm
                ${isActive ? 'bg-[#3713ec] text-white' : 'bg-slate-100 text-slate-400'}`}>
                <span className="text-xs font-bold">{chapter.chapterId}</span>
              </div>
              <div className="flex-1 pt-1">
                <h3 className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{chapter.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-bold">{chapter.words.length} Words</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f6f6f8] font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}
      
      {/* Sidebar Desktop/Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Main View Router */}
        {!activeWord ? (
          /* DASHBOARD VIEW */
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
              <header className="mb-8 flex justify-between items-center">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white rounded-lg shadow-sm"><Menu size={20}/></button>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeChapter.title}</h2>
                  <p className="text-slate-500">Select a word to start learning</p>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeChapter.words.map((word, idx) => (
                  <div key={idx} onClick={() => { setActiveWord(word); setCurrentExIdx(0); }}
                    className="bg-white p-5 rounded-2xl border-b-4 border-transparent hover:border-[#3713ec] hover:-translate-y-1 transition-all cursor-pointer shadow-sm group">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{word.id}</span>
                    <h4 className="text-2xl font-bold text-slate-800 my-1 group-hover:text-[#3713ec] korean-text">{word.word}</h4>
                    <p className="text-sm font-medium text-slate-500">{word.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* MATRIX VIEW (Detail) */
          <div className="flex-1 flex flex-col overflow-hidden bg-[#f6f6f8]">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <button onClick={() => setActiveWord(null)} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-[#3713ec]">
                <ArrowLeft size={18} /> Back to List
              </button>
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full">{activeWord.id}</span>
                <button onClick={toggleSpeed} className="flex items-center gap-1 bg-[#3713ec]/10 px-3 py-1 rounded-full text-xs font-bold text-[#3713ec]">
                  <Gauge size={14} /> {playbackRate}x
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left Side: Word & Main Display */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Word Info Card */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 relative">
                    <span className="inline-block px-3 py-1 bg-[#3713ec]/10 text-[#3713ec] text-[10px] font-bold rounded-full uppercase mb-4">Target Word</span>
                    <h2 className="text-5xl font-black text-slate-900 mb-2 korean-text">{activeWord.word}</h2>
                    <p className="text-xl text-slate-500 mb-6">{activeWord.meaning}</p>
                    <button onClick={() => playAudio(getAudioUrl(activeWord.id))} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#3713ec] hover:text-white transition-all">
                      <Volume2 size={20} />
                    </button>
                    {activeWord.usage_note && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-xs text-yellow-800 leading-relaxed">
                        <p className="font-bold mb-1">💡 Note:</p>
                        {activeWord.usage_note}
                      </div>
                    )}
                  </div>

                  {/* Highlighted Sentence Display */}
                  <div className="bg-[#3713ec] rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-[#3713ec]/20 flex-1 flex flex-col justify-center min-h-[250px] relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest block mb-4">
                        Pattern {currentExIdx + 1}: {activeWord.examples[currentExIdx]?.type}
                      </span>
                      <h3 className="text-3xl md:text-4xl font-bold mb-4 korean-text break-keep leading-tight">
                        {activeWord.examples[currentExIdx]?.ko}
                      </h3>
                      <p className="text-white/70 text-lg mb-8">{activeWord.examples[currentExIdx]?.en}</p>
                      <button onClick={() => playAudio(getAudioUrl(activeWord.id, currentExIdx))}
                        className="w-16 h-16 bg-white text-[#3713ec] rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                        <Volume2 size={32} className="fill-current" />
                      </button>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  </div>
                </div>

                {/* Right Side: Matrix Controller (여기가 찌그러졌던 부분) */}
                <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="text-[#3713ec]" size={18} />
                      <h3 className="font-bold text-slate-800">Sentence Matrix</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">10 VARIATIONS</span>
                  </div>

                  {/* 스크롤 가능 영역 */}
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-[400px] lg:min-h-0">
                    <div className="grid grid-cols-1 gap-3">
                      {activeWord.examples.map((ex, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setCurrentExIdx(idx); playAudio(getAudioUrl(activeWord.id, idx)); }}
                          className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left
                            ${currentExIdx === idx 
                              ? 'border-[#3713ec] bg-[#3713ec] text-white shadow-md' 
                              : 'border-slate-50 bg-slate-50/50 hover:border-[#3713ec]/30 text-slate-600'}
                          `}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs
                            ${currentExIdx === idx ? 'bg-white/20 text-white' : 'bg-white text-slate-400'}`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className={`text-[10px] font-bold uppercase mb-0.5 ${currentExIdx === idx ? 'text-white/60' : 'text-slate-400'}`}>{ex.type}</p>
                            <p className="font-bold korean-text truncate">{ex.ko}</p>
                          </div>
                          {currentExIdx === idx && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </main>

            {/* Footer Nav */}
            <footer className="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
              <button onClick={() => navigateWord('prev')} 
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all">
                <ChevronLeft /> Prev
              </button>
              <button onClick={() => navigateWord('next')}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all">
                Next <ChevronRight />
              </button>
            </footer>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
        body { font-family: 'Lexend', sans-serif; }
        .korean-text { font-family: 'Noto Sans KR', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;
