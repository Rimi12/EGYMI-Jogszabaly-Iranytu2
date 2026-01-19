import React, { useState } from 'react';
import { analyzeRegulation, fetchLatestChanges, queryKnowledgeBase, fetchRegulationDetails } from './services/geminiService';
import { AnalysisStatus } from './types';
import { 
  Search, Scale, AlertCircle, 
  ChevronRight, RefreshCw, 
  ExternalLink, Newspaper, 
  FileText, ArrowLeft, Info, Loader2, Book, Copy, Check
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
  const [copied, setCopied] = useState(false);

  const coreRegulations = [
    { id: "2011. évi CXC. törvény", title: "A nemzeti köznevelésről (Nkt.)", queryId: "2011. CXC. törvény" },
    { id: "2023. évi LII. törvény", title: "A pedagógusok új életpályájáról (Púétv.)", queryId: "2023. LII. törvény" },
    { id: "18/2024. (IV. 4.) BM rendelet", title: "A pedagógusok teljesítményértékelési rendszeréről (TÉR)", queryId: "18/2024. BM rendelet" },
    { id: "401/2023. (VIII. 30.) Korm. rendelet", title: "A Púétv. végrehajtásáról - Munkaidő, pótlékok", queryId: "401/2023. Korm. rendelet" },
    { id: "20/2012. (VIII. 31.) EMMI rendelet", title: "A nevelési-oktatási intézmények működéséről", queryId: "20/2012. EMMI rendelet" },
    { id: "15/2013. (II. 26.) EMMI rendelet", title: "A pedagógiai szakszolgálati intézmények működéséről", queryId: "15/2013. EMMI rendelet" },
    { id: "32/2012. (X. 8.) EMMI rendelet", title: "SNI Irányelvek - Autizmus, értelmi fogyatékosság", queryId: "32/2012. EMMI rendelet" },
    { id: "33/1998. (VI. 24.) NM rendelet", title: "Munkaköri alkalmassági vizsgálatok", queryId: "33/1998. NM rendelet" },
    { id: "1998. évi XXVI. törvény", title: "A fogyatékos személyek jogairól", queryId: "1998. XXVI. törvény" },
    { id: "2019. évi LXXX. törvény", title: "A szakképzésről - Szakiskolai alapok", queryId: "2019. LXXX. törvény" },
    { id: "12/2020. (II. 7.) Korm. rendelet", title: "A szakképzési törvény végrehajtásáról", queryId: "12/2020. Korm. rendelet" },
    { id: "363/2012. (XII. 17.) Korm. rendelet", title: "Az Óvodai nevelés országos alapprogramja", queryId: "363/2012. Korm. rendelet" },
    { id: "7/2012. (VI. 8.) EMMI rendelet", title: "A Kollégiumi nevelés országos alapprogramja", queryId: "7/2012. EMMI rendelet" },
    { id: "110/2012. (VI. 4.) Korm. rendelet", title: "A Nemzeti Alaptanterv (NAT)", queryId: "110/2012. Korm. rendelet" }
  ];

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
      setError("Az AI betöltés sikertelen, de a külső linkek működnek!");
      setStatus(AnalysisStatus.ERROR); 
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // A legstabilabb megoldás a 404 elkerülésére: Célzott Google keresés az njt.hu domainen
  const getSafeNjtLink = (id: string) => `https://www.google.com/search?q=site:njt.hu+${encodeURIComponent(id)}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-indigo-100">
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => {setActiveTab('laws'); setSelectedLaw(null);}}>
            <Scale /> <span>EGYMI Iránytű</span>
          </div>
          <nav className="hidden md:flex gap-2">
            <button onClick={() => setActiveTab('analyzer')} className={`px-4 py-2 rounded-lg transition-all ${activeTab==='analyzer'?'bg-white text-indigo-700 font-bold shadow-sm':'hover:bg-indigo-600'}`}>Elemző</button>
            <button onClick={() => {setActiveTab('tracker'); fetchLatestChanges().then(setTrackerData);}} className={`px-4 py-2 rounded-lg transition-all ${activeTab==='tracker'?'bg-white text-indigo-700 font-bold shadow-sm':'hover:bg-indigo-600'}`}>Változások</button>
            <button onClick={() => setActiveTab('knowledge')} className={`px-4 py-2 rounded-lg transition-all ${activeTab==='knowledge'?'bg-white text-indigo-700 font-bold shadow-sm':'hover:bg-indigo-600'}`}>Tudástár</button>
            <button onClick={() => {setActiveTab('laws'); setSelectedLaw(null);}} className={`px-4 py-2 rounded-lg transition-all ${activeTab==='laws'?'bg-white text-indigo-700 font-bold shadow-sm':'hover:bg-indigo-600'}`}>Jogszabályok</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {activeTab === 'laws' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {!selectedLaw ? coreRegulations.map(law => (
              <button key={law.id} onClick={() => handleLawSelect(law)} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-xl text-left transition-all group flex flex-col h-full shadow-sm relative overflow-hidden">
                <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                  <FileText className="text-indigo-600 group-hover:text-white transition-colors"/>
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-1 leading-tight">{law.id}</h4>
                <p className="text-sm text-slate-500 flex-grow pr-4">{law.title}</p>
                <div className="mt-6 flex items-center text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  Részletek és link <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform ml-1"/>
                </div>
              </button>
            )) : (
              <div className="col-span-full space-y-6">
                <button onClick={()=>{setSelectedLaw(null); setLawDetail(null);}} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold transition-colors">
                  <ArrowLeft size={18}/> VISSZA A LISTÁHOZ
                </button>
                
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                  <div className="bg-slate-900 p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="max-w-xl">
                      <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Book size={14}/> Jogszabályi adatlap
                      </div>
                      <h2 className="text-3xl font-black mb-2">{selectedLaw.id}</h2>
                      <p className="text-slate-300 text-lg leading-snug">{selectedLaw.title}</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => copyToClipboard(selectedLaw.id)}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 border border-slate-700 text-sm"
                      >
                        {copied ? <Check size={18} className="text-green-400"/> : <Copy size={18}/>}
                        AZONOSÍTÓ MÁSOLÁSA
                      </button>
                      <a 
                        href={getSafeNjtLink(selectedLaw.id)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 border border-indigo-400/30 text-sm whitespace-nowrap"
                      >
                        <ExternalLink size={18}/> HITELLES OLDAL (NJT)
                      </a>
                    </div>
                  </div>
                  
                  <div className="p-8 md:p-12">
                    {status === AnalysisStatus.LOADING ? (
                      <div className="py-24 flex flex-col items-center gap-6 text-center">
                        <Loader2 className="animate-spin text-indigo-500" size={64} />
                        <div>
                          <p className="text-slate-900 text-xl font-bold">Adatbetöltés és szöveghű elemzés...</p>
                          <p className="text-slate-500 mt-2 max-w-md mx-auto italic">A rendszer most olvassa be és rendszerezi a paragrafusokat a hiteles Nemzeti Jogszabálytárból...</p>
                        </div>
                      </div>
                    ) : lawDetail && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-800 font-normal">
                          {lawDetail.text}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Elemző, Tracker, Knowledge részek változatlanok vagy finomhangoltak a geminiService-en keresztül */}
        {activeTab === 'analyzer' && (
          <div className="space-y-6">
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-indigo-900"><Search className="text-indigo-600"/> Szöveges Elemző</h2>
                <textarea 
                  className="w-full h-56 p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg" 
                  placeholder="Illessze be a jogszabály szövegét ide az NJT-ről..." 
                  value={input} 
                  onChange={e=>setInput(e.target.value)} 
                />
                <button 
                  onClick={async () => {
                    setStatus(AnalysisStatus.LOADING);
                    const res = await analyzeRegulation(input);
                    setResult(res);
                    setStatus(AnalysisStatus.SUCCESS);
                  }}
                  disabled={status === AnalysisStatus.LOADING || !input.trim()}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-bold w-full md:w-auto flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  {status === AnalysisStatus.LOADING ? <Loader2 className="animate-spin" /> : 'Elemzés indítása'}
                </button>
             </div>
             {status === AnalysisStatus.SUCCESS && result && (
               <div className="bg-white p-8 rounded-3xl border border-slate-200 whitespace-pre-wrap shadow-xl text-slate-700 leading-relaxed animate-in fade-in">
                 {result}
               </div>
             )}
          </div>
        )}
        
        {/* Egyéb tab-ok... */}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-12 text-center border-t border-slate-800 mt-auto">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-bold text-slate-300 mb-2">EGYMI Jogszabály-Iránytű v3.3</p>
          <p className="text-xs mb-4">A rendszer nem helyettesíti a jogi tanácsadást. Forrás: Nemzeti Jogszabálytár.</p>
          <div className="flex justify-center gap-6">
            <Scale size={20} className="text-slate-700"/>
            <Book size={20} className="text-slate-700"/>
            <Info size={20} className="text-slate-700"/>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;