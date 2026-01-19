
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Search, Scale, ClipboardList, AlertCircle, 
  ChevronRight, BookOpen, RefreshCw, 
  ExternalLink, Calendar, Newspaper, Clock, HelpCircle,
  BookMarked, Gavel, FileText, ArrowLeft, Download, Printer, Info
} from 'lucide-react';

// --- TYPES ---
interface AnalysisResult {
  rawResponse: string;
  institutionalAnalysis: string;
  faq: Array<{ question: string; answer: string }>;
  actionPoints: Array<{ title: string; description: string; example: string; priority: 'High' | 'Medium' | 'Low' }>;
}

enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// --- SERVICES ---
const SYSTEM_INSTRUCTION = `
SZEREP: EGYMI (Egységes Gyógypedagógiai Módszertani Intézmény) jogszabály-szakértő vagy pedagógusoknak.
CÉL: Jogszabályváltozás-követés, tájékoztatás és hatásvizsgálat (óvoda, iskola, kollégium).
STÍLUS: Pedagógusbarát, gyakorlatias, direkt hatások, példák. KERÜLD a jogzsargont.
METÓDUS: Lépésről lépésre (Chain of Thought), logika ellenőrzés.
BIZT: Ha nem tudsz valamit, jelezd. Tilos a hallucináció.

KIMENETI ELVÁRÁSOK:
1. Az intézményi elemzést zárd a következő tagek közé: ['EGYMI intézményi elemzés'] ... [/EGYMI intézményi elemzés].
2. Generálj GYIK szekciót.
3. Adj meg 2-3 priorizált cselekvési pontot konkrét példákkal.
4. Minden állításnál jelölj forrást.
`;

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const analyzeRegulation = async (input: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: input,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.2 },
  });
  return response.text;
};

const fetchLatestChanges = async () => {
  const ai = getAI();
  const today = new Date();
  const currentDateStr = today.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `A mai dátum ${currentDateStr}. EGYMI, gyógypedagógia és SNI jogszabályi változások összefoglalója.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Te egy naprakész EGYMI jogszabály-szakértő vagy. Dátum: ${currentDateStr}.`,
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

const queryKnowledgeBase = async (query: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      systemInstruction: `Te egy EGYMI Tudástár asszisztens vagy. Hivatkozz az Nkt., EMMI és BM rendeletekre.`,
      temperature: 0.1,
    },
  });
  return response.text;
};

const fetchRegulationDetails = async (lawId: string, lawTitle: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Keresd meg a ${lawId} (${lawTitle}) hatályos szövegét az njt.hu-n.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Szakértői asszisztens vagy.`,
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

// --- MAIN APP COMPONENT ---
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
    { id: "2011. évi CXC. törvény", title: "A nemzeti köznevelésről (Nkt.)" },
    { id: "2023. évi LII. törvény", title: "A pedagógusok új életpályájáról (Púétv.)" },
    { id: "18/2024. (IV. 4.) BM rendelet", title: "A pedagógusok teljesítményértékelési rendszeréről (TÉR)" },
    { id: "15/2013. (II. 26.) EMMI rendelet", title: "A pedagógiai szakszolgálati intézmények működéséről" },
    { id: "32/2012. (X. 8.) EMMI rendelet", title: "SNI Irányelvek" }
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-indigo-700 text-white shadow-lg h-16 flex items-center px-4">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => setActiveTab('analyzer')}>
            <Scale /> <span>EGYMI Iránytű</span>
          </div>
          <nav className="flex gap-4">
            <button onClick={() => setActiveTab('analyzer')} className={`pb-1 ${activeTab==='analyzer'?'border-b-2':''}`}>Elemző</button>
            <button onClick={() => {setActiveTab('tracker'); handleFetchChanges();}} className={`pb-1 ${activeTab==='tracker'?'border-b-2':''}`}>Hírek</button>
            <button onClick={() => setActiveTab('knowledge')} className={`pb-1 ${activeTab==='knowledge'?'border-b-2':''}`}>Tudástár</button>
            <button onClick={() => setActiveTab('laws')} className={`pb-1 ${activeTab==='laws'?'border-b-2':''}`}>Jogszabályok</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        {activeTab === 'analyzer' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Jogszabály Elemzés</h2>
            <textarea className="w-full h-40 p-4 border rounded-xl" placeholder="Szöveg beillesztése..." value={input} onChange={e=>setInput(e.target.value)} />
            <button onClick={handleAnalyze} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">Elemzés</button>
            {status === 'SUCCESS' && result && <div className="bg-white p-6 rounded-xl border whitespace-pre-wrap">{result}</div>}
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Friss Változások</h2>
            {status === 'LOADING' ? <RefreshCw className="animate-spin mx-auto mt-10" /> : trackerData && (
              <div className="bg-white p-6 rounded-xl border whitespace-pre-wrap">{trackerData.text}</div>
            )}
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-4">
             <h2 className="text-2xl font-bold">Szakmai Tudástár</h2>
             <input className="w-full p-4 border rounded-xl" placeholder="Kérdés..." value={knowledgeInput} onChange={e=>setKnowledgeInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleKnowledgeQuery()} />
             {status === 'LOADING' ? <RefreshCw className="animate-spin mx-auto" /> : knowledgeResult && (
               <div className="bg-white p-6 rounded-xl border border-l-8 border-l-indigo-500 whitespace-pre-wrap">{knowledgeResult}</div>
             )}
          </div>
        )}

        {activeTab === 'laws' && (
          <div className="grid gap-4">
            {!selectedLaw ? coreRegulations.map(law => (
              <div key={law.id} onClick={() => handleLawSelect(law)} className="bg-white p-4 rounded-xl border hover:border-indigo-500 cursor-pointer flex justify-between items-center">
                <div><div className="font-bold">{law.id}</div><div className="text-sm text-slate-500">{law.title}</div></div>
                <ChevronRight />
              </div>
            )) : (
              <div>
                <button onClick={()=>setSelectedLaw(null)} className="mb-4 flex items-center gap-1 text-slate-500"><ArrowLeft size={16}/> Vissza</button>
                <div className="bg-white p-6 rounded-xl border">
                  <h3 className="text-xl font-bold mb-4">{selectedLaw.id}</h3>
                  {status === 'LOADING' ? <RefreshCw className="animate-spin" /> : lawDetail && <div className="whitespace-pre-wrap">{lawDetail.text}</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="p-8 text-center text-slate-400 text-sm">© 2025 EGYMI Jogszabály-Iránytű</footer>
    </div>
  );
};

// --- RENDER ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
