import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, ChevronLeft, ChevronRight, Volume2, 
  BookOpen, Menu, X, Map, Zap, Settings, Gauge,
  CheckCircle, Lock, LayoutGrid, List, ArrowLeft, Lightbulb, Info,
  GraduationCap, MousePointerClick
} from 'lucide-react';

// =================================================================
// [수정 필요] 여기에 선생님의 버니넷 'Pull Zone' 주소를 넣으세요!
// 예: "https://talkori-cdn.b-cdn.net" (뒤에 /audio_tk 는 아래 코드에서 붙입니다)
// =================================================================
const BUNNY_CDN_HOST = "https://talkori.b-cdn.net"; 

// 오디오 경로 규칙: 호스트 + /audio_tk/ + 파일명
const CDN_BASE_URL = `${BUNNY_CDN_HOST}/audio_tk`;

/* [데이터 구조] - 엑셀 내용을 JSON으로 변환한 것 */
const CURRICULUM = [
  {
    chapterId: 1,
    title: "Day 1: 편의점 정복하기",
    subtitle: "At the Convenience Store",
    description: "물건 사기에 필수적인 명사와 표현을 익힙니다.",
    grammar_focus: "명사 뒤에 '~주세요(Juseyo)'를 붙여서 정중하게 요청해보세요.",
    color: "bg-green-500", 
    text_color: "text-green-600",
    border_color: "border-green-200",
    bg_soft: "bg-green-50",
    words: [
      {
        id: "1-1", word: "가다", meaning: "To go", type: "Verb",
        usage_note: "Used for movement away from the speaker.",
        examples: [
          { type: "Core", ko: "저는 학교에 가요.", en: "I go to school." },
          { type: "Question", ko: "어디 가요?", en: "Where are you going?" },
          { type: "Request", ko: "빨리 가세요.", en: "Please go quickly." },
          { type: "Past", ko: "집에 갔어요.", en: "I went home." },
          { type: "Future", ko: "내일 갈 거예요.", en: "I will go tomorrow." },
          { type: "Negation", ko: "안 가요.", en: "I don't go." },
          { type: "Condition", ko: "가면 알아요.", en: "If you go, you'll know." },
          { type: "Connective", ko: "가고 싶어요.", en: "I want to go." },
          { type: "Idiom", ko: "시간이 잘 가요.", en: "Time flies." },
          { type: "Casual", ko: "나 갈게.", en: "I'm leaving." }
        ]
      },
      {
        id: "1-2", word: "물", meaning: "Water", type: "Noun",
        usage_note: "Restaurants usually serve water self-service.",
        examples: [
          { type: "Core", ko: "물 주세요.", en: "Please give me water." },
          { type: "Question", ko: "물 있어요?", en: "Do you have water?" },
          { type: "Req", ko: "물 좀 주세요.", en: "Give me some water please." },
          { type: "Past", ko: "물 마셨어요.", en: "I drank water." },
          { type: "Fut", ko: "물 마실래요.", en: "I will drink water." },
          { type: "Neg", ko: "물 아니에요.", en: "It's not water." },
          { type: "Cond", ko: "물 있으면 줘.", en: "If you have water, give me." },
          { type: "Conn", ko: "물 마시고 자요.", en: "Drink water and sleep." },
          { type: "Idiom", ko: "물 쓰듯 쓰다.", en: "Spend money like water." },
          { type: "Cas", ko: "물 줘.", en: "Give me water." }
        ]
      },
      // 더미 데이터 생성 (UI 테스트용)
      ...Array.from({ length: 18 }).map((_, i) => ({
        id: `1-${i+3}`, word: `단어 ${i+3}`, meaning: `Word ${i+3}`, type: "Noun",
        examples: Array(10).fill({ type: "Core", ko: "예문입니다.", en: "Example sentence." })
      }))
    ]
  },
  {
    chapterId: 2,
    title: "Day 2: 카페에서 주문하기",
    subtitle: "Ordering Coffee",
    description: "커피 주문과 옵션 선택하기",
    color: "bg-indigo-500",
    text_color: "text-indigo-600",
    border_color: "border-indigo-500",
    bg_soft: "bg-indigo-50",
    words: [] 
  }
];

// 오디오 URL 생성기 (1-1 유지)
const getAudioUrl = (wordId, exIndex = null) => {
  const formattedId = String(wordId); 
  if (exIndex === null) {
    return `${CDN_BASE_URL}/w_${formattedId}.mp3`;
  } else {
    const formattedEx = String(exIndex + 1).padStart(2, '0');
    return `${CDN_BASE_URL}/w_${formattedId}_ex_${formattedEx}.mp3`;
  }
};

const App = () => {
  const [activeChapter, setActiveChapter] = useState(CURRICULUM[0]);
  const [activeWord, setActiveWord] = useState(null); 
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showNote, setShowNote] = useState(false);

  // 오디오 재생
  const playAudio = (url) => {
    // 실제 파일이 없을 때 대비한 데모용 TTS (테스트 끝나면 삭제 가능)
    const demoUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent('오디오 확인용')}&tl=ko&client=tw-ob`;
    
    // 버니넷 주소가 'your-bunny'로 되어있으면(설정 안했으면) 데모 재생
    const targetUrl = url.includes('your-bunny') ? demoUrl : url;
    
    const audio = new Audio(targetUrl);
    audio.playbackRate = playbackRate;
    audio.play().catch(e => console.log(e));
  };

  const toggleSpeed = () => {
    setPlaybackRate(prev => (prev === 1.0 ? 0.8 : prev === 0.8 ? 0.6 : 1.0));
  };

  // --- Components ---

  // 1. Sidebar (Roadmap)
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
        
        {/* Progress Widget */}
        <div className="bg-[#3713ec]/5 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[#3713ec]">Total Progress</span>
            <span className="text-xs font-bold text-[#3713ec]">1%</span>
          </div>
          <div className="w-full bg-[#3713ec]/10 rounded-full h-1.5">
            <div className="bg-[#3713ec] h-1.5 rounded-full" style={{ width: '1%' }}></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 relative roadmap-line custom-scrollbar">
        {CURRICULUM.map((chapter, idx) => {
          const isActive = activeChapter.chapterId === chapter.chapterId;
          return (
            <div 
              key={idx} 
              onClick={() => { setActiveChapter(chapter); setActiveWord(null); setIsSidebarOpen(false); }}
              className={`relative z-10 flex items-start gap-4 mb-8 cursor-pointer group ${isActive ? '' : 'opacity-60'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl ring-4 ring-white transition-all
                ${isActive ? 'bg-[#3713ec] shadow-[#3713ec]/30 scale-110' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>
                {isActive ? <Play className="text-white fill-white ml-1" size={20} /> : <Lock size={18} />}
              </div>
              <div className="flex-1 pt-1">
                <p className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'text-[#3713ec]' : 'text-slate-400'}`}>
                  {isActive ? 'Current Day' : 'Locked'}
                </p>
                <h3 className={`font-bold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{chapter.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{chapter.words.length} Words</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );

  // 2. Dashboard View (Word Grid)
  const DashboardView = () => (
    <div className="flex-1 overflow-y-auto bg-[#f6f6f8] p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#3713ec] font-semibold text-sm mb-1">
              <Zap size={16} />
              <span>Pattern Matrix Learning</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">{activeChapter.title}</h2>
            <p className="text-slate-500 mt-1">{activeChapter.subtitle}</p>
          </div>
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
             <div className="text-right">
               <p className="text-xs font-bold text-slate-400 uppercase">Session</p>
               <p className="text-sm font-bold text-slate-700">0 / {activeChapter.words.length}</p>
             </div>
             <div className="w-10 h-10 bg-[#3713ec] rounded-full flex items-center justify-center text-white">
               <Play className="fill-white ml-1" size={20} />
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {activeChapter.words.map((word, idx) => (
            <div 
              key={idx}
              onClick={() => { setActiveWord(word); setCurrentExIdx(0); }}
              className="soft-ui-card bg-white p-6 rounded-2xl border-b-4 border-slate-100 hover:border-[#3713ec] hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">{word.type || "Word"}</span>
                <span className="text-xs font-bold text-slate-300 group-hover:text-[#3713ec]">#{idx+1}</span>
              </div>
              <h4 className="text-3xl font-bold text-slate-800 mb-1 group-hover:text-[#3713ec] transition-colors korean-text">{word.word}</h4>
              <p className="text-lg font-medium text-slate-500 group-hover:text-slate-700">{word.meaning}</p>
            </div>
          ))}
        </div>

        {activeChapter.grammar_focus && (
          <div className="bg-[#3713ec]/5 rounded-2xl p-8 border border-[#3713ec]/10 flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-white p-3 rounded-xl text-[#3713ec] shadow-sm shrink-0">
              <Lightbulb size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Today's Grammar Focus</h3>
              <p className="text-slate-600 leading-relaxed">{activeChapter.grammar_focus}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 3. Matrix View (Detail Learning)
  const MatrixView = () => {
    if (!activeWord) return null;
    const activeExample = activeWord.examples ? activeWord.examples[currentExIdx] : { ko: "", en: "", type: "" };
    const currentWordIndex = activeChapter.words.findIndex(w => w.id === activeWord.id);

    const navigateWord = (direction) => {
      const newIndex = direction === 'next' ? currentWordIndex + 1 : currentWordIndex - 1;
      if (newIndex >= 0 && newIndex < activeChapter.words.length) {
        setActiveWord(activeChapter.words[newIndex]);
        setCurrentExIdx(0); 
      } else if (direction === 'next') {
        alert("Day Completed!");
        setActiveWord(null);
      }
    };

    return (
      <div className="flex-1 flex flex-col h-full bg-[#f6f6f8] font-sans overflow-hidden animate-fade-in">
        
        {/* Nav Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => setActiveWord(null)} 
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors font-bold text-sm"
          >
            <ArrowLeft size={18} /> Back to List
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-800">
              {currentWordIndex + 1} / {activeChapter.words.length}
            </span>
            <button onClick={toggleSpeed} className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
              <Gauge size={14} /> {playbackRate}x
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start h-full">
            
            {/* [LEFT] Target Word & Current Sentence Display */}
            <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
              
              {/* Word Card */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-block px-3 py-1 bg-[#3713ec]/10 text-[#3713ec] text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                    {activeWord.type} • Root
                  </span>
                  <div className="relative">
                    {activeWord.usage_note && (
                      <button onClick={() => setShowNote(!showNote)} className="text-[#3713ec] hover:bg-[#3713ec]/10 p-2 rounded-full transition-colors">
                        <Info size={24} />
                      </button>
                    )}
                    {showNote && activeWord.usage_note && (
                      <div className="absolute right-0 top-10 w-64 p-4 bg-slate-800 text-white text-xs rounded-xl shadow-xl z-50 animate-fade-in leading-relaxed">
                        <p className="font-bold mb-1 text-yellow-400">Usage Note:</p>
                        {activeWord.usage_note}
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-1 korean-text tracking-tight">{activeWord.word}</h2>
                <p className="text-xl text-slate-500 font-medium">{activeWord.meaning}</p>
                <button onClick={() => playAudio(getAudioUrl(activeWord.id))} className="mt-6 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#3713ec] hover:text-white transition-all">
                  <Volume2 size={20} />
                </button>
              </div>

              {/* [Result] Sentence Display */}
              <div className="bg-[#3713ec] rounded-2xl p-8 md:p-10 text-white shadow-xl shadow-[#3713ec]/30 relative overflow-hidden group flex-1 flex flex-col justify-center min-h-[280px]">
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                
                <div className="relative z-10 animate-fade-in" key={currentExIdx}> 
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-white/90 text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      {activeExample.type} Pattern
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <h3 className="text-3xl md:text-4xl font-bold mb-2 leading-snug korean-text break-keep">
                      {activeExample.ko}
                    </h3>
                    <p className="text-white/80 text-lg font-medium">
                      {activeExample.en}
                    </p>
                  </div>

                  <div className="mt-10 flex gap-3">
                    <button 
                      onClick={() => playAudio(getAudioUrl(activeWord.id, currentExIdx))}
                      className="w-14 h-14 bg-white text-[#3713ec] rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Volume2 size={28} className="fill-current" />
                    </button>
                    <button onClick={toggleSpeed} className="h-14 px-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-colors flex flex-col justify-center items-center text-xs">
                      <Gauge size={18} className="mb-1" /> {playbackRate}x
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* [RIGHT] Matrix Controller Grid */}
            <div className="lg:w-7/12 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 h-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 shrink-0">
                <LayoutGrid className="text-[#3713ec]" size={18} />
                <h3 className="font-bold text-slate-800">Conjugation Matrix</h3>
              </div>

              {/* [수정 포인트] 높이 제한 삭제 & overflow-y-auto 적용 */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeWord.examples.map((ex, idx) => (
                    <button
                      key={idx}
                      onClick={() => { 
                        setCurrentExIdx(idx); 
                        playAudio(getAudioUrl(activeWord.id, idx)); 
                      }}
                      className={`group flex flex-col justify-center p-4 rounded-xl border-2 transition-all text-left min-h-[80px] relative overflow-hidden
                        ${currentExIdx === idx 
                          ? 'border-[#3713ec] bg-[#3713ec] text-white shadow-md scale-[1.02] z-10' 
                          : 'border-slate-100 bg-slate-50 hover:border-[#3713ec]/30 text-slate-500'}
                      `}
                    >
                      <div className="flex justify-between w-full mb-1 relative z-10">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${currentExIdx === idx ? 'text-white/70' : 'text-slate-400 group-hover:text-[#3713ec]'}`}>
                          {String(idx + 1).padStart(2, '0')} • {ex.type}
                        </span>
                        {currentExIdx === idx && <Play size={12} className="fill-current animate-pulse" />}
                      </div>
                      <span className={`font-bold text-lg truncate w-full korean-text relative z-10 ${currentExIdx === idx ? 'text-white' : 'text-slate-800'}`}>
                        {ex.ko}
                      </span>
                    </button>
                  ))}
                </div>
                {/* 하단 여백 */}
                <div className="h-4"></div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-white dark:bg-[#131022] border-t border-slate-100 dark:border-slate-800 p-4 flex justify-between items-center z-30">
          <button 
            onClick={() => navigateWord('prev')}
            disabled={currentWordIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
          >
            <ChevronLeft /> Prev
          </button>
          
          <button 
            onClick={() => navigateWord('next')}
            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            Next <ChevronRight />
          </button>
        </div>

      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#f6f6f8] font-sans text-slate-800 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none md:relative md:translate-x-0 border-r border-slate-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
        {/* Mobile Header (Dashboard Only) */}
        {!activeWord && (
          <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600"><Menu size={24} /></button>
              <span className="font-bold text-slate-800">Talkori</span>
            </div>
          </div>
        )}
        
        {activeWord ? <MatrixView /> : <DashboardView />}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
        body { font-family: 'Lexend', sans-serif; }
        .korean-text { font-family: 'Noto Sans KR', sans-serif; }
        .soft-ui-card { box-shadow: 8px 8px 16px rgba(0,0,0,0.03), -4px -4px 12px rgba(255,255,255,0.8); }
        .roadmap-line::before { content: ''; position: absolute; left: 39px; top: 0; bottom: 0; width: 2px; background: repeating-linear-gradient(to bottom, rgba(55, 19, 236, 0.1) 0, rgba(55, 19, 236, 0.1) 10px, transparent 10px, transparent 20px); z-index: 0; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes slide-up { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes pop-in { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default App;
