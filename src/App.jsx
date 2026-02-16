import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Play, ChevronLeft, ChevronRight, Volume2, 
  Menu, X, Zap, Gauge, ArrowLeft,
  GraduationCap, LayoutGrid
} from 'lucide-react';

// 실제 데이터 파일을 불러옵니다.
import rawData from './data.json';

const BUNNY_CDN_HOST = "https://talkori.b-cdn.net"; 
const CDN_BASE_URL = `${BUNNY_CDN_HOST}/audio_tk`;

const App = () => {
  // 1. 데이터 가공 로직
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

  // 🎵 [핵심 추가] 현재 재생 중인 오디오를 추적하기 위한 Ref
  const audioRef = useRef(null);

  useEffect(() => {
    if (CURRICULUM.length > 0 && !activeChapter) {
      setActiveChapter(CURRICULUM[0]);
    }
  }, [CURRICULUM]);

  // 🎵 [핵심 추가] 화면이 바뀌거나 단어가 바뀔 때 기존 오디오를 끄는 청소 기능
  useEffect(() => {
    stopCurrentAudio();
  }, [activeWord, activeChapter]);

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const getAudioUrl = (wordId, exIndex = null) => {
    const cleanId = String(wordId).trim();
    if (exIndex === null) {
      return `${CDN_BASE_URL}/w_${cleanId}.mp3`;
    } else {
      const formattedNum = String(exIndex + 1).padStart(2, '0');
      return `${CDN_BASE_URL}/w_${cleanId}_ex_${formattedNum}.mp3`;
    }
  };

  // 🎵 [로직 수정] 오디오 재생 함수
  const playAudio = (url) => {
    // 1. 이미 재생 중인 소리가 있다면 정지
    stopCurrentAudio();

    // 2. 새 오디오 객체 생성 및 설정
    const audio = new Audio(url);
    audio.playbackRate = playbackRate;
    
    // 3. 현재 재생 중인 오디오로 등록
    audioRef.current = audio;

    // 4. 재생
    audio.play().catch(e => console.error("Audio Play Error:", e));
  };

  const toggleSpeed = () => {
    setPlaybackRate(prev => (prev === 1.0 ? 0.8 : prev === 0.8 ? 0.6 : 1.0));
    // 배속 변경 시 현재 재생 중인 오디오에도 즉시 적용
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate === 1.0 ? 0.8 : playbackRate === 0.8 ? 0.6 : 1.0;
    }
  };

  if (!activeChapter) return <div className="flex h-screen items-center justify-center font-bold text-[#3713ec]">Loading...</div>;

  return (
    <div className="flex h-screen bg-[#f6f6f8] font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-slate-200`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3713ec] rounded-xl flex items-center justify-center shadow-lg shadow-[#3713ec]/20">
                <GraduationCap className="text-white" size={24} />
              </div>
              <div>
                <h1 className="font-bold text-xl text-slate-800 tracking-tight">Talkori</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Learning Path</p>
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
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{chapter.words.length} Words</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {!activeWord ? (
          /* DASHBOARD VIEW */
          <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <header className="mb-8 flex items-center justify-between">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white rounded-lg shadow-sm mr-4"><Menu size={20}/></button>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[#3713ec] font-bold text-xs mb-1 uppercase tracking-wider">
                  <Zap size={14} /> Pattern Matrix Learning
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{activeChapter.title}</h2>
              </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {activeChapter.words.map((word, idx) => (
                <div key={idx} onClick={() => { setActiveWord(word); setCurrentExIdx(0); }}
                  className="bg-white p-6 rounded-2xl border-b-4 border-slate-100 hover:border-[#3713ec] hover:-translate-y-1 transition-all cursor-pointer shadow-sm group">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">#{word.id}</span>
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
              <button onClick={() => setActiveWord(null)} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-[#3713ec] transition-colors">
                <ArrowLeft size={18} /> Back to List
              </button>
              <div className="flex items-center gap-4">
                <button onClick={toggleSpeed} className="flex items-center gap-1 bg-[#3713ec]/10 px-3 py-1.5 rounded-full text-xs font-bold text-[#3713ec]">
                  <Gauge size={14} /> {playbackRate}x Speed
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-6">
                  {/* Word Card */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <span className="inline-block px-3 py-1 bg-[#3713ec]/10 text-[#3713ec] text-[10px] font-bold rounded-full uppercase mb-4">Vocabulary</span>
                    <h2 className="text-5xl font-black text-slate-900 mb-2 korean-text">{activeWord.word}</h2>
                    <p className="text-xl text-slate-500 font-medium mb-6">{activeWord.meaning}</p>
                    <button onClick={() => playAudio(getAudioUrl(activeWord.id))} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-[#3713ec] hover:text-white transition-all shadow-inner">
                      <Volume2 size={20} />
                    </button>
                    {activeWord.usage_note && (
                      <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 text-[11px] text-blue-800 leading-relaxed korean-text">
                        <span className="font-bold">Note:</span> {activeWord.usage_note}
                      </div>
                    )}
                  </div>

                  {/* Sentence Display */}
                  <div className="bg-[#3713ec] rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-[#3713ec]/20 min-h-[300px] flex flex-col justify-center relative overflow-hidden group">
                    <div className="relative z-10">
                      <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest block mb-4">Pattern {currentExIdx + 1}: {activeWord.examples[currentExIdx]?.type}</span>
                      <h3 className="text-3xl md:text-4xl font-bold mb-4 korean-text break-keep leading-snug">
                        {activeWord.examples[currentExIdx]?.ko || "No Text"}
                      </h3>
                      <p className="text-white/70 text-lg mb-10 font-medium italic">
                        {activeWord.examples[currentExIdx]?.en}
                      </p>
                      <button onClick={() => playAudio(getAudioUrl(activeWord.id, currentExIdx))}
                        className="w-16 h-16 bg-white text-[#3713ec] rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform">
                        <Volume2 size={32} className="fill-current" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Matrix Grid */}
                <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full lg:max-h-[650px]">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
                    <LayoutGrid className="text-[#3713ec]" size={18} />
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Variation Matrix</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                      {activeWord.examples.map((ex, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setCurrentExIdx(idx); playAudio(getAudioUrl(activeWord.id, idx)); }}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group
                            ${currentExIdx === idx 
                              ? 'border-[#3713ec] bg-[#3713ec] text-white shadow-lg' 
                              : 'border-slate-50 bg-slate-50/50 hover:border-[#3713ec]/30 text-slate-600'}
                          `}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs
                            ${currentExIdx === idx ? 'bg-white/20 text-white' : 'bg-white text-slate-300'}`}>
                            {idx + 1}
                          </div>
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
                <ChevronLeft /> Prev Word
              </button>
              <button onClick={() => {
                const idx = activeChapter.words.findIndex(w => w.id === activeWord.id);
                if(idx < activeChapter.words.length - 1) { setActiveWord(activeChapter.words[idx+1]); setCurrentExIdx(0); }
              }} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all">
                Next Word <ChevronRight />
              </button>
            </footer>
          </div>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;800&family=Noto+Sans+KR:wght@400;700;900&display=swap');
        body { font-family: 'Lexend', sans-serif; }
        .korean-text { font-family: 'Noto Sans KR', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
