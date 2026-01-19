
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Search, Scale, ClipboardList, AlertCircle, 
  ChevronRight, BookOpen, RefreshCw, 
  ExternalLink, Calendar, Newspaper, Clock, HelpCircle,
  BookMarked, Gavel, FileText, ArrowLeft, Download, Printer, Info
} from 'lucide-react';

// --- ADATSTRUKTÚRÁK ---
enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// --- GEMINI SZERVIZ LOGIKA (EREDETI, KOMPLEX INSTRUKCIÓKKAL) ---
const SYSTEM_INSTRUCTION = `
SZEREP: EGYMI (Egységes Gyógypedagógiai Módszertani Intézmény) jogszabály-szakértő vagy pedagógusoknak.
CÉL: Jogszabályváltozás-követés, tájékoztatás és hatásvizsgálat (óvoda, iskola, kollégium).
STÍLUS: Pedagógusbarát, gyakorlatias, direkt hatások, példák. KERÜLD a jogzsargont.
METÓDUS: Lépésről lépésre (Chain of Thought), logika ellenőrzés.
BIZT: Ha nem tudsz valamit, jelezd. Tilos a hallucináció.

KIMENETI ELVÁRÁSOK:
1. Az intézményi elemzést zárd a következő tagek közé: ['EGYMI intézményi elemzés'] ... [/EGYMI intézményi elemzés]. Ebben vizsgáld a tanterv, szervezet és eljárásrend módosulásait.
2. Generálj GYIK szekciót.
3. Adj meg 2-3 priorizált cselekvési pontot konkrét példákkal.
4. Minden állításnál jelölj forrást vagy jelezd, ha szakmai véleményről van szó.

Strukturáld a választ címsorokkal, listákkal és táblázatokkal ahol lehetséges.
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
    contents: `A mai dátum ${currentDateStr}. Keress rá és foglald össze a legfrissebb, jelenleg hatályos vagy mostanában bevezetett EGYMI-t, gyógypedagógiát és SNI jogszabályi változásokat.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Te egy naprakész EGYMI jogszabály-szakértő vagy. Dátum: ${currentDateStr}. Használd a Google keresőt.`,
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
      systemInstruction: `Te egy EGYMI Tudástár asszisztens vagy. Forrásaid: Nkt., 15/2013 EMMI, 20/2012 EMMI, 32/2012 EMMI (SNI Irányelvek), Púétv, TÉR. MINDIG hivatkozz pontos jogszabályi pontokra!`,
      temperature: 0.1,
    },
  });
  return response.text;
};

const fetchRegulationDetails = async (lawId: string, lawTitle: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Keresd meg a ${lawId} (${lawTitle}) hatályos szövegét az njt.hu-n. Foglald össze az EGYMI releváns pontokat.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Szakértői asszisztens vagy. Az njt.hu alapján dolgozz.`,
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

// --- FŐ ALKALMAZÁS KOMPONENS ---
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

  // Eredeti, bővített jogszabály lista visszaállítása
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

  const quickTopics = [
    "Utazó gyógypedagógusi hálózat feladatai",
    "SNI felülvizsgálat eljárásrendje",
    "EGYMI finanszírozási alapjai",
    "Szakértői vélemények kötelező tartalma",
    "Egyéni fejlesztési tervek (ITP) készítése"
  ];

  // --- FUNKCIÓK ---
  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const res = await analyzeRegulation(input);
      setResult(res);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { setError("Hiba az elemzésben"); setStatus(AnalysisStatus.ERROR); }
  };

  const handleFetchChanges = async () => {
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const data = await fetchLatestChanges();
      setTrackerData(data);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { setError("Hiba a frissítések lekérésekor."); setStatus(AnalysisStatus.ERROR); }
  };

  const handleKnowledgeQuery = async (q?: string) => {
    const query = q || knowledgeInput;
    if (!query.trim()) return;
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const res = await queryKnowledgeBase(query);
      setKnowledgeResult(res);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { setError("Hiba a Tudástár elérésekor."); setStatus(AnalysisStatus.ERROR); }
  };

  const handleLawSelect = async (law: any) => {
    setSelectedLaw(law);
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const res = await fetchRegulationDetails(law.id, law.title);
      setLawDetail(res);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) { setError("Hiba a jogszabály betöltésekor."); setStatus(AnalysisStatus.ERROR); }
  };

  const handleSaveAsWord = (content: string, title: string) => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title><style>body { font-family: sans-serif; }</style></head><body>`;
    const sourceHTML = header + "<h1>" + title + "</h1>" + content.replace(/\n/g, '<br>') + "</body></html>";
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EGYMI_Szakertoi_Valasz_${new Date().getTime()}.doc`;
    link.click();
  };

  const handlePrint = (content: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Nyomtatás</title><style>body { font-family: sans-serif; padding: 40px; } h1 { color: #3730a3; border-bottom: 2px solid #3730a3; } .c { white-space: pre-wrap; }</style></head><body><h1>${title}</h1><div class="c">${content}</div><script>window.onload=()=>{window.print();window.close();};</script></body></html>`);
    printWindow.document.close();
  };

  const parseInstitutionalAnalysis = (text: string) => {
    const match = text.match(/\['EGYMI intézményi elemzés'\]([\s\S]*?)\[\/EGYMI intézményi elemzés\]/);
    return match ? match[1].trim() : "Az intézményi elemzés nem érhető el.";
  };

  const cleanText = (text: string) => {
    return text.replace(/\['EGYMI intézményi elemzés'\][\s\S]*?\[\/EGYMI intézményi elemzés\]/, '').trim();
  };

  // --- UI RENDERING ---
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => setActiveTab('analyzer')}>
            <Scale /> <span>EGYMI Iránytű</span>
          </div>
          <nav className="flex gap-4">
            <button onClick={() => setActiveTab('analyzer')} className={`px-3 py-1 rounded-lg ${activeTab==='analyzer'?'bg-indigo-800 border-b-2 border-white':''}`}>Elemző</button>
            <button onClick={() => {setActiveTab('tracker'); handleFetchChanges();}} className={`px-3 py-1 rounded-lg ${activeTab==='tracker'?'bg-indigo-800 border-b-2 border-white':''}`}>Változáskövető</button>
            <button onClick={() => setActiveTab('knowledge')} className={`px-3 py-1 rounded-lg ${activeTab==='knowledge'?'bg-indigo-800 border-b-2 border-white':''}`}>Tudástár</button>
            <button onClick={() => setActiveTab('laws')} className={`px-3 py-1 rounded-lg ${activeTab==='laws'?'bg-indigo-800 border-b-2 border-white':''}`}>Jogszabályok</button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        {activeTab === 'analyzer' && (
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Search className="text-indigo-600"/> Jogszabály Elemzés</h2>
                <textarea 
                  className="w-full h-48 p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="Másolja be az elemzendő jogszabály-szöveget vagy tervezetet..." 
                  value={input} 
                  onChange={e=>setInput(e.target.value)} 
                />
                <div className="mt-4 flex justify-end">
                  <button onClick={handleAnalyze} disabled={status === 'LOADING'} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2">
                    {status === 'LOADING' ? <RefreshCw className="animate-spin"/> : <Search size={20}/>} Elemzés indítása
                  </button>
                </div>
             </div>
             {status === 'SUCCESS' && result && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-indigo-50 border-l-8 border-indigo-500 p-8 rounded-xl shadow-sm">
                    <h3 className="text-xl font-black text-indigo-900 mb-4 uppercase">EGYMI intézményi elemzés</h3>
                    <div className="prose text-slate-700 whitespace-pre-wrap leading-relaxed">{parseInstitutionalAnalysis(result)}</div>
                  </div>
                  <div className="bg-white p-8 rounded-xl border whitespace-pre-wrap shadow-sm text-slate-800">{cleanText(result)}</div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Newspaper className="text-indigo-600"/> Friss Változások</h2>
              <button onClick={handleFetchChanges} className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"><RefreshCw size={16}/> Új keresés</button>
            </div>
            {status === 'LOADING' ? <div className="py-20 text-center"><RefreshCw className="animate-spin mx-auto text-indigo-500" size={40}/></div> : trackerData && (
              <div className="grid gap-6">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm whitespace-pre-wrap leading-relaxed">{trackerData.text}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trackerData.sources.map((s, i) => s.web && (
                    <a key={i} href={s.web.uri} target="_blank" className="bg-slate-100 p-4 rounded-xl flex justify-between items-center hover:bg-indigo-50 transition-colors">
                      <span className="text-sm font-bold truncate pr-4">{s.web.title}</span>
                      <ExternalLink size={16} className="text-indigo-600 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-6">
             <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4">
               <Info className="text-blue-600 shrink-0" size={32}/>
               <p className="text-sm text-blue-900 leading-relaxed font-medium">A Tudástár válaszai <b>kizárólag</b> hiteles források (Nkt., EMMI rendeletek, SNI irányelvek) alapján készülnek. Minden válasz végén megtalálja a jogszabályi hivatkozásokat.</p>
             </div>
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-lg" 
                 placeholder="Kérdezzen az SNI ellátásról, finanszírozásról vagy protokollokról..." 
                 value={knowledgeInput} 
                 onChange={e=>setKnowledgeInput(e.target.value)} 
                 onKeyDown={e=>e.key==='Enter'&&handleKnowledgeQuery()} 
               />
             </div>
             <div className="flex flex-wrap gap-2">
               {quickTopics.map(t => <button key={t} onClick={()=>handleKnowledgeQuery(t)} className="bg-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:bg-indigo-600 hover:text-white transition-all">{t}</button>)}
             </div>
             {status === 'LOADING' ? <div className="text-center py-12"><RefreshCw className="animate-spin mx-auto mb-4 text-indigo-500"/> Szakértői válasz generálása...</div> : knowledgeResult && (
               <div className="bg-white p-8 rounded-2xl border-l-8 border-indigo-500 shadow-lg relative">
                 <div className="flex justify-end gap-3 mb-6 no-print">
                   <button onClick={()=>handleSaveAsWord(knowledgeResult, knowledgeInput)} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-100 transition-all"><Download size={16}/> Word mentés</button>
                   <button onClick={()=>handlePrint(knowledgeResult, knowledgeInput)} className="bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-100 transition-all"><Printer size={16}/> Nyomtatás</button>
                 </div>
                 <div className="whitespace-pre-wrap text-slate-800 leading-relaxed prose max-w-none">{knowledgeResult}</div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'laws' && (
          <div className="space-y-6">
            {!selectedLaw ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coreRegulations.map(law => (
                  <button key={law.id} onClick={() => handleLawSelect(law)} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all"><FileText size={20}/></div>
                      <h4 className="font-black text-slate-900 mb-1">{law.id}</h4>
                      <p className="text-sm text-slate-500 leading-tight">{law.title}</p>
                    </div>
                    <div className="mt-4 text-indigo-600 font-bold text-xs flex items-center gap-1">KIFEJTÉS MEGNYITÁSA <ChevronRight size={14}/></div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <button onClick={()=>setSelectedLaw(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600"><ArrowLeft size={16}/> VISSZA A LISTÁHOZ</button>
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="bg-slate-900 p-8 text-white">
                    <h2 className="text-2xl font-bold">{selectedLaw.id}</h2>
                    <p className="text-slate-400 font-medium mt-1">{selectedLaw.title}</p>
                  </div>
                  <div className="p-8">
                    {status === 'LOADING' ? <RefreshCw className="animate-spin text-indigo-500 mx-auto" size={32}/> : lawDetail && (
                      <div className="space-y-8">
                        <div className="whitespace-pre-wrap text-lg text-slate-700 leading-relaxed">{lawDetail.text}</div>
                        {lawDetail.sources.map((s, i) => s.web && (
                          <a key={i} href={s.web.uri} target="_blank" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Hatályos szöveg az NJT.hu-n <ExternalLink size={18}/></a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'ERROR' && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center gap-4">
            <AlertCircle size={32} className="shrink-0"/>
            <div>
              <p className="font-bold">Műveleti hiba!</p>
              <p className="text-sm">{error || "Ismeretlen hiba történt a rendszerben."}</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-12 text-center border-t border-slate-800">
        <p className="font-bold text-slate-400">© 2025 EGYMI Jogszabály-Iránytű • Szakértői Rendszer</p>
        <p className="text-xs mt-2 uppercase tracking-[0.2em] opacity-40">Hivatalos NJT.hu és Google Grounding technológiával</p>
      </footer>
    </div>
  );
};

// --- RENDERELÉS ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
