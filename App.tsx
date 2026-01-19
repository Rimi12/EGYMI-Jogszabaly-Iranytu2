
import React, { useState } from 'react';
import { analyzeRegulation, fetchLatestChanges, queryKnowledgeBase, fetchRegulationDetails } from './services/geminiService';
import { AnalysisStatus } from './types';
import { 
  Search, Scale, ClipboardList, AlertCircle, 
  ChevronRight, BookOpen, RefreshCw, 
  ExternalLink, Calendar, Newspaper, Clock, HelpCircle,
  BookMarked, Gavel, FileText, ArrowLeft, Download, Printer, Info
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'tracker' | 'knowledge' | 'laws'>('analyzer');
  const [input, setInput] = useState('');
  const [knowledgeInput, setKnowledgeInput] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<string | null>(null);
  const [trackerData, setTrackerData] = useState<{ text: string, sources: any[] } | null>(null);
  const [knowledgeResult, setKnowledgeResult] = useState<string | null>(null);
  const [lawDetail, setLawDetail] = useState<{ text: string, sources: any[] } | null>(null);
  const [selectedLaw, setSelectedLaw] = useState<{ id: string, title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const coreRegulations = [
    { id: "2011. évi CXC. törvény", title: "A nemzeti köznevelésről (Nkt.) - Alapvető szabályok" },
    { id: "2023. évi LII. törvény", title: "A pedagógusok új életpályájáról (Púétv.) - Jogállás és bér" },
    { id: "18/2024. (IV. 4.) BM rendelet", title: "A pedagógusok teljesítményértékelési rendszeréről (TÉR)" },
    { id: "401/2023. (VIII. 30.) Korm. rendelet", title: "A Púétv. végrehajtásáról - Munkaidő, pótlékok" },
    { id: "20/2012. (VIII. 31.) EMMI rendelet", title: "A nevelési-oktatási intézmények működéséről" },
    { id: "15/2013. (II. 26.) EMMI rendelet", title: "A pedagógiai szakszolgálati intézmények működéséről" },
    { id: "32/2012. (X. 8.) EMMI rendelet", title: "SNI Irányelvek - Autizmus, értelmi fogyatékosság" },
    { id: "33/1998. (VI. 24.) NM rendelet", title: "Munkaköri alkalmassági vizsgálatok" },
    { id: "1998. évi XXVI. törvény", title: "A fogyatékos személyek jogairól" },
    { id: "2019. évi LXXX. törvény", title: "A szakképzésről - Szakiskolai alapok" },
    { id: "12/2020. (II. 7.) Korm. rendelet", title: "A szakképzési törvény végrehajtásáról" },
    { id: "363/2012. (XII. 17.) Korm. rendelet", title: "Az Óvodai nevelés országos alapprogramja" },
    { id: "7/2012. (VI. 8.) EMMI rendelet", title: "A Kollégiumi nevelés országos alapprogramja" },
    { id: "110/2012. (VI. 4.) Korm. rendelet", title: "A Nemzeti Alaptanterv (NAT)" }
  ];

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setStatus(AnalysisStatus.LOADING);
    try {
      const res = await analyzeRegulation(input);
      setResult(res);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { setError("Hiba az elemzésben"); setStatus(AnalysisStatus.ERROR); }
  };

  const handleFetchChanges = async () => {
    setStatus(AnalysisStatus.LOADING);
    try {
      const data = await fetchLatestChanges();
      setTrackerData(data);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { setStatus(AnalysisStatus.ERROR); }
  };

  const handleKnowledgeQuery = async (q?: string) => {
    const query = q || knowledgeInput;
    if (!query.trim()) return;
    setStatus(AnalysisStatus.LOADING);
    try {
      const res = await queryKnowledgeBase(query);
      setKnowledgeResult(res);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { setStatus(AnalysisStatus.ERROR); }
  };

  const handleLawSelect = async (law: any) => {
    setSelectedLaw(law);
    setStatus(AnalysisStatus.LOADING);
    try {
      const res = await fetchRegulationDetails(law.id, law.title);
      setLawDetail(res);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { setStatus(AnalysisStatus.ERROR); }
  };

  const handleSaveAsWord = (content: string, title: string) => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body><h1>${title}</h1>${content.replace(/\n/g, '<br>')}</body></html>`;
    const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EGYMI_Szakertoi_Valasz.doc`;
    link.click();
  };

  const parseInstitutionalAnalysis = (text: string) => {
    const match = text.match(/\['EGYMI intézményi elemzés'\]([\s\S]*?)\[\/EGYMI intézményi elemzés\]/);
    return match ? match[1].trim() : "Nincs elérhető intézményi elemzés.";
  };

  const cleanText = (text: string) => {
    return text.replace(/\['EGYMI intézményi elemzés'\][\s\S]*?\[\/EGYMI intézményi elemzés\]/, '').trim();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => setActiveTab('analyzer')}>
            <Scale /> <span>EGYMI Iránytű</span>
          </div>
          <nav className="flex gap-4">
            <button onClick={() => setActiveTab('analyzer')} className={`px-3 py-1 rounded-lg ${activeTab==='analyzer'?'bg-indigo-800 border-b-2 border-white':''}`}>Elemző</button>
            <button onClick={() => {setActiveTab('tracker'); handleFetchChanges();}} className={`px-3 py-1 rounded-lg ${activeTab==='tracker'?'bg-indigo-800 border-b-2 border-white':''}`}>Változások</button>
            <button onClick={() => setActiveTab('knowledge')} className={`px-3 py-1 rounded-lg ${activeTab==='knowledge'?'bg-indigo-800 border-b-2 border-white':''}`}>Tudástár</button>
            <button onClick={() => setActiveTab('laws')} className={`px-3 py-1 rounded-lg ${activeTab==='laws'?'bg-indigo-800 border-b-2 border-white':''}`}>Jogszabályok</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        {activeTab === 'analyzer' && (
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Search className="text-indigo-600"/> Szöveges Elemző</h2>
                <textarea className="w-full h-48 p-4 bg-slate-50 border rounded-xl outline-none" placeholder="Jogszabály szöveg..." value={input} onChange={e=>setInput(e.target.value)} />
                <button onClick={handleAnalyze} className="mt-4 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold w-full md:w-auto">Elemzés indítása</button>
             </div>
             {status === 'SUCCESS' && result && (
               <div className="space-y-6 animate-in fade-in">
                  <div className="bg-indigo-50 border-l-8 border-indigo-500 p-8 rounded-xl shadow-sm">
                    <h3 className="text-xl font-black text-indigo-900 mb-4 uppercase">EGYMI intézményi elemzés</h3>
                    <div className="whitespace-pre-wrap">{parseInstitutionalAnalysis(result)}</div>
                  </div>
                  <div className="bg-white p-8 rounded-xl border whitespace-pre-wrap shadow-sm">{cleanText(result)}</div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Newspaper className="text-indigo-600"/> Jogszabályi Monitor</h2>
            {status === 'LOADING' ? <RefreshCw className="animate-spin mx-auto text-indigo-500" size={40}/> : trackerData && (
              <div className="bg-white p-8 rounded-2xl border whitespace-pre-wrap">{trackerData.text}</div>
            )}
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-6">
             <input className="w-full p-4 border rounded-2xl shadow-sm text-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Kérdezzen..." value={knowledgeInput} onChange={e=>setKnowledgeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleKnowledgeQuery()} />
             {status === 'LOADING' ? <RefreshCw className="animate-spin mx-auto text-indigo-500"/> : knowledgeResult && (
               <div className="bg-white p-8 rounded-2xl border-l-8 border-indigo-500 shadow-lg relative">
                 <button onClick={()=>handleSaveAsWord(knowledgeResult, knowledgeInput)} className="absolute top-4 right-4 bg-indigo-50 text-indigo-700 p-2 rounded-lg hover:bg-indigo-100"><Download size={20}/></button>
                 <div className="whitespace-pre-wrap">{knowledgeResult}</div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'laws' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!selectedLaw ? coreRegulations.map(law => (
              <button key={law.id} onClick={() => handleLawSelect(law)} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 text-left transition-all">
                <FileText className="text-indigo-600 mb-2"/>
                <h4 className="font-bold text-slate-900">{law.id}</h4>
                <p className="text-sm text-slate-500">{law.title}</p>
              </button>
            )) : (
              <div className="col-span-full space-y-6">
                <button onClick={()=>setSelectedLaw(null)} className="flex items-center gap-2 text-slate-500 font-bold"><ArrowLeft size={16}/> VISSZA</button>
                <div className="bg-white rounded-2xl border shadow-sm">
                  <div className="bg-slate-900 p-8 text-white"><h2 className="text-2xl font-bold">{selectedLaw.id}</h2></div>
                  <div className="p-8">
                    {status === 'LOADING' ? <RefreshCw className="animate-spin mx-auto"/> : lawDetail && <div className="whitespace-pre-wrap text-lg">{lawDetail.text}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="bg-slate-900 text-slate-500 py-8 text-center border-t border-slate-800">
        <p>© 2025 EGYMI Jogszabály-Iránytű • Szakértői Rendszer</p>
      </footer>
    </div>
  );
};

export default App;
