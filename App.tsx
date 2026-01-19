import React, { useState } from 'react';
import { analyzeRegulation, fetchLatestChanges, queryKnowledgeBase, fetchRegulationDetails } from './services/geminiService';
import { AnalysisStatus } from './types';
import { 
  Search, Scale, AlertCircle, 
  ChevronRight, RefreshCw, 
  ExternalLink, Newspaper, 
  FileText, ArrowLeft, Info, Loader2, Book
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'tracker' | 'knowledge' | 'laws'>('laws');
  const [input, setInput] = useState('');
  const [knowledgeInput, setKnowledgeInput] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<string | null>(null);
  const [trackerData, setTrackerData] = useState<{ text: string, sources: any[] } | null>(null);
  const [knowledgeResult, setKnowledgeResult] = useState<string | null>(null);
  const [lawDetail, setLawDetail] = useState<{ text: string, sources: any[] } | null>(null);
  const [selectedLaw, setSelectedLaw] = useState<{ id: string, title: string, queryId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A képernyőképen szereplő összes jogszabály pontos listája
  const coreRegulations = [
    { id: "2011. évi CXC. törvény", title: "A nemzeti köznevelésről (Nkt.)", queryId: "2011. évi CXC. törvény" },
    { id: "2023. évi LII. törvény", title: "A pedagógusok új életpályájáról (Púétv.)", queryId: "2023. évi LII. törvény" },
    { id: "18/2024. (IV. 4.) BM rendelet", title: "A pedagógusok teljesítményértékelési rendszeréről (TÉR)", queryId: "18/2024. (IV. 4.) BM rendelet" },
    { id: "401/2023. (VIII. 30.) Korm. rendelet", title: "A Púétv. végrehajtásáról - Munkaidő, pótlékok", queryId: "401/2023. (VIII. 30.) Korm. rendelet" },
    { id: "20/2012. (VIII. 31.) EMMI rendelet", title: "A nevelési-oktatási intézmények működéséről", queryId: "20/2012. (VIII. 31.) EMMI rendelet" },
    { id: "15/2013. (II. 26.) EMMI rendelet", title: "A pedagógiai szakszolgálati intézmények működéséről", queryId: "15/2013. (II. 26.) EMMI rendelet" },
    { id: "32/2012. (X. 8.) EMMI rendelet", title: "SNI Irányelvek - Autizmus, értelmi fogyatékosság", queryId: "32/2012. (X. 8.) EMMI rendelet" },
    { id: "33/1998. (VI. 24.) NM rendelet", title: "Munkaköri alkalmassági vizsgálatok", queryId: "33/1998. (VI. 24.) NM rendelet" },
    { id: "1998. évi XXVI. törvény", title: "A fogyatékos személyek jogairól", queryId: "1998. évi XXVI. törvény" },
    { id: "2019. évi LXXX. törvény", title: "A szakképzésről - Szakiskolai alapok", queryId: "2019. évi LXXX. törvény" },
    { id: "12/2020. (II. 7.) Korm. rendelet", title: "A szakképzési törvény végrehajtásáról", queryId: "12/2020. (II. 7.) Korm. rendelet" },
    { id: "363/2012. (XII. 17.) Korm. rendelet", title: "Az Óvodai nevelés országos alapprogramja", queryId: "363/2012. (XII. 17.) Korm. rendelet" },
    { id: "7/2012. (VI. 8.) EMMI rendelet", title: "A Kollégiumi nevelés országos alapprogramja", queryId: "7/2012. (VI. 8.) EMMI rendelet" },
    { id: "110/2012. (VI. 4.) Korm. rendelet", title: "A Nemzeti Alaptanterv (NAT)", queryId: "110/2012. (VI. 4.) Korm. rendelet" }
  ];

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const res = await analyzeRegulation(input);
      setResult(res);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e: any) { 
      setError(e.message || "Hiba történt az elemzés során."); 
      setStatus(AnalysisStatus.ERROR); 
    }
  };

  const handleFetchChanges = async () => {
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const data = await fetchLatestChanges();
      setTrackerData(data);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { 
      setError("Nem sikerült lekérni a változásokat.");
      setStatus(AnalysisStatus.ERROR); 
    }
  };

  const handleKnowledgeQuery = async () => {
    if (!knowledgeInput.trim()) return;
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const res = await queryKnowledgeBase(knowledgeInput);
      setKnowledgeResult(res);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { 
      setError("Hiba a tudástár lekérdezése közben.");
      setStatus(AnalysisStatus.ERROR); 
    }
  };

  const handleLawSelect = async (law: any) => {
    setSelectedLaw(law);
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    setLawDetail(null);
    try {
      const res = await fetchRegulationDetails(law.id, law.title);
      setLawDetail(res);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { 
      setError("Hiba történt a jogszabály betöltésekor. Kérjük, használja a közvetlen NJT hivatkozást!");
      setStatus(AnalysisStatus.ERROR); 
    }
  };

  const parseInstitutionalAnalysis = (text: string) => {
    const match = text.match(/\['EGYMI intézményi elemzés'\]([\s\S]*?)\[\/EGYMI intézményi elemzés\]/);
    return match ? match[1].trim() : "Nincs specifikus intézményi elemzés.";
  };

  const cleanText = (text: string) => {
    return text.replace(/\['EGYMI intézményi elemzés'\][\s\S]*?\[\/EGYMI intézményi elemzés\]/, '').trim();
  };

  // Dinamikus, garantáltan működő NJT kereső link generálása
  const getNjtSearchUrl = (query: string) => `https://njt.hu/kereses?q=${encodeURIComponent(query)}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => {setActiveTab('laws'); setSelectedLaw(null);}}>
            <Scale /> <span>EGYMI Iránytű</span>
          </div>
          <nav className="hidden md:flex gap-4">
            <button onClick={() => {setActiveTab('analyzer'); setError(null);}} className={`px-4 py-2 rounded-lg transition-all ${activeTab==='analyzer'?'bg-white text-indigo-700 font-bold shadow-sm':'hover:bg-indigo-600'}`}>Elemző</button>
            <button onClick={() => {setActiveTab('tracker'); handleFetchChanges();}} className={`px-4 py-2 rounded-lg transition-all ${activeTab==='tracker'?'bg-white text-indigo-700 font-bold shadow-sm':'hover:bg-indigo-600'}`}>Változások</button>
            <button onClick={() => {setActiveTab('knowledge'); setError(null);}} className={`px-4 py-2 rounded-lg transition-all ${activeTab==='knowledge'?'bg-white text-indigo-700 font-bold shadow-sm':'hover:bg-indigo-600'}`}>Tudástár</button>
            <button onClick={() => {setActiveTab('laws'); setError(null); setSelectedLaw(null);}} className={`px-4 py-2 rounded-lg transition-all ${activeTab==='laws'?'bg-white text-indigo-700 font-bold shadow-sm':'hover:bg-indigo-600'}`}>Jogszabályok</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 text-red-700 shadow-sm animate-in slide-in-from-top">
            <AlertCircle className="shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {activeTab === 'laws' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!selectedLaw ? coreRegulations.map(law => (
              <button key={law.id} onClick={() => handleLawSelect(law)} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg text-left transition-all group flex flex-col h-full">
                <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                  <FileText className="text-indigo-600 group-hover:text-white transition-colors"/>
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-1 leading-tight">{law.id}</h4>
                <p className="text-sm text-slate-500 flex-grow">{law.title}</p>
                <div className="mt-6 flex items-center text-xs font-bold text-indigo-600 uppercase tracking-widest">Megnyitás <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/></div>
              </button>
            )) : (
              <div className="col-span-full space-y-6 animate-in slide-in-from-right">
                <div className="flex justify-between items-center">
                  <button onClick={()=>{setSelectedLaw(null); setLawDetail(null); setError(null);}} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
                    <ArrowLeft size={18}/> VISSZA A LISTÁHOZ
                  </button>
                </div>
                
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                  <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                      <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Book size={14}/> Hivatalos Jogszabályhely
                      </div>
                      <h2 className="text-3xl font-black mb-2">{selectedLaw.id}</h2>
                      <p className="text-slate-300 text-lg">{selectedLaw.title}</p>
                    </div>
                    <a 
                      href={getNjtSearchUrl(selectedLaw.queryId)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95 border border-indigo-400/30"
                    >
                      <ExternalLink size={20}/> MEGNYITÁS AZ NJT.HU-N
                    </a>
                  </div>
                  <div className="p-8 md:p-12">
                    {status === AnalysisStatus.LOADING ? (
                      <div className="py-24 flex flex-col items-center gap-6 text-center">
                        <Loader2 className="animate-spin text-indigo-500" size={64} />
                        <div>
                          <p className="text-slate-900 text-xl font-bold">Jogszabályi szöveg betöltése...</p>
                          <p className="text-slate-500 mt-2">Közvetlen lekérdezés a Nemzeti Jogszabálytárból...</p>
                        </div>
                      </div>
                    ) : lawDetail && (
                      <div className="animate-in fade-in duration-700">
                        <div className="prose prose-indigo max-w-none">
                          <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-800 font-normal selection:bg-indigo-100">
                            {lawDetail.text}
                          </div>
                        </div>
                        {lawDetail.sources.length > 0 && (
                          <div className="mt-16 pt-8 border-t border-slate-100">
                             <h5 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                               Hitelesített források <div className="h-px flex-1 bg-slate-100"></div>
                             </h5>
                             <div className="flex flex-wrap gap-3">
                               {lawDetail.sources.map((src, i) => (
                                 <span key={i} className="bg-slate-50 text-slate-500 border border-slate-200 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Forrás #{i+1}
                                 </span>
                               ))}
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Elemző Tab (marad a korábbi logika szerint) */}
        {activeTab === 'analyzer' && (
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-indigo-900"><Search className="text-indigo-600"/> Szöveges Elemző</h2>
                <textarea 
                  className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg" 
                  placeholder="Illessze be a jogszabály szövegét ide..." 
                  value={input} 
                  onChange={e=>setInput(e.target.value)} 
                />
                <button 
                  onClick={handleAnalyze} 
                  disabled={status === AnalysisStatus.LOADING || !input.trim()}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md"
                >
                  {status === AnalysisStatus.LOADING ? <><Loader2 className="animate-spin" /> Elemzés...</> : 'Elemzés indítása'}
                </button>
             </div>
             {status === AnalysisStatus.SUCCESS && result && (
               <div className="space-y-6 animate-in fade-in">
                  <div className="bg-indigo-50 border-l-8 border-indigo-500 p-8 rounded-xl shadow-sm">
                    <h3 className="text-xl font-black text-indigo-900 mb-4 flex items-center gap-2"><Info /> EGYMI Intézményi Hatásvizsgálat</h3>
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-800">{parseInstitutionalAnalysis(result)}</div>
                  </div>
                  <div className="bg-white p-8 rounded-xl border border-slate-200 whitespace-pre-wrap shadow-sm text-slate-700 leading-relaxed">{cleanText(result)}</div>
               </div>
             )}
          </div>
        )}

        {/* Változások Tab */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-900"><Newspaper className="text-indigo-600"/> Monitor (2024-2025)</h2>
            {status === AnalysisStatus.LOADING ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <RefreshCw className="animate-spin text-indigo-500" size={48}/>
                <p className="text-slate-500 font-medium">Friss közlönyadatok lekérése...</p>
              </div>
            ) : trackerData && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm whitespace-pre-wrap leading-relaxed animate-in fade-in text-slate-700">
                {trackerData.text}
              </div>
            )}
          </div>
        )}

        {/* Tudástár Tab */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
             <div className="relative">
               <input 
                className="w-full p-6 pl-8 border border-slate-200 rounded-2xl shadow-sm text-lg outline-none focus:ring-2 focus:ring-indigo-500 pr-20" 
                placeholder="Pl.: Milyen pótlék jár az SNI koordinátornak?" 
                value={knowledgeInput} 
                onChange={e=>setKnowledgeInput(e.target.value)} 
                onKeyDown={e=>e.key==='Enter'&&handleKnowledgeQuery()} 
               />
               <button onClick={handleKnowledgeQuery} className="absolute right-4 top-4 bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">
                 <Search size={28} />
               </button>
             </div>
             {status === AnalysisStatus.LOADING ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
             ) : knowledgeResult && (
               <div className="bg-white p-8 rounded-2xl border-l-8 border-indigo-500 shadow-xl animate-in zoom-in-95 text-slate-800 leading-relaxed">
                 <div className="whitespace-pre-wrap">{knowledgeResult}</div>
               </div>
             )}
          </div>
        )}
      </main>
      
      <footer className="bg-slate-900 text-slate-500 py-10 text-center border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-bold text-slate-300 mb-1">EGYMI Jogszabály-Iránytű v3.0</p>
          <p className="text-xs">© 2025 • Az adatok tájékoztató jellegűek. Hivatalos döntéshez mindig az NJT.hu-t használja!</p>
        </div>
      </footer>
    </div>
  );
};

export default App;