
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
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const todayFormatted = new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentYear = new Date().getFullYear();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const responseText = await analyzeRegulation(input);
      setResult(responseText);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message || 'Hiba történt az elemzés során.');
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleFetchChanges = async () => {
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const data = await fetchLatestChanges();
      setTrackerData(data);
      setLastUpdate(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }));
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err: any) {
      setError('Nem sikerült lekérni a frissítéseket. Kérjük, próbálja újra később.');
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleKnowledgeQuery = async (query?: string) => {
    const finalQuery = query || knowledgeInput;
    if (!finalQuery.trim()) return;
    
    if (query) setKnowledgeInput(query);
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const response = await queryKnowledgeBase(finalQuery);
      setKnowledgeResult(response);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err: any) {
      setError('Nem sikerült választ kapni a Tudástárból.');
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleLawSelect = async (law: { id: string, title: string }) => {
    setSelectedLaw(law);
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const data = await fetchRegulationDetails(law.id, law.title);
      setLawDetail(data);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err: any) {
      setError('Nem sikerült betölteni a jogszabály adatait.');
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleSaveAsWord = (content: string, title: string) => {
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title><style>body { font-family: sans-serif; }</style></head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + "<h1>" + title + "</h1>" + content.replace(/\n/g, '<br>') + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EGYMI_Szakertoi_Valasz_${new Date().getTime()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (content: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Nyomtatás - EGYMI Szakértő</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { color: #3730a3; border-bottom: 2px solid #3730a3; padding-bottom: 10px; margin-bottom: 20px; }
            .content { white-space: pre-wrap; font-size: 12pt; }
            .footer { margin-top: 40px; font-size: 10pt; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>EGYMI Szakértői Dokumentum</h1>
          <div class="content">${content}</div>
          <div class="footer">Készült az EGYMI Jogszabály-Iránytű alkalmazással: ${new Date().toLocaleString('hu-HU')}</div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const parseInstitutionalAnalysis = (text: string) => {
    const match = text.match(/\['EGYMI intézményi elemzés'\]([\s\S]*?)\[\/EGYMI intézményi elemzés\]/);
    return match ? match[1].trim() : "Az intézményi elemzés nem érhető el.";
  };

  const cleanText = (text: string) => {
    return text.replace(/\['EGYMI intézményi elemzés'\][\s\S]*?\[\/EGYMI intézményi elemzés\]/, '').trim();
  };

  const quickTopics = [
    "Utazó gyógypedagógusi hálózat feladatai",
    "SNI felülvizsgálat eljárásrendje",
    "EGYMI finanszírozási alapjai",
    "Szakértői vélemények kötelező tartalma",
    "Egyéni fejlesztési tervek (ITP) készítése"
  ];

  const coreRegulations = [
    { id: "2011. évi CXC. törvény", title: "A nemzeti köznevelésről (Nkt.) - Alapvető szabályok az iskolák, óvodák és továbbnevelés számára" },
    { id: "2023. évi LII. törvény", title: "A pedagógusok új életpályájáról (Púétv.) - Jogállás és bérszabályozás" },
    { id: "18/2024. (IV. 4.) BM rendelet", title: "A pedagógusok teljesítményértékelési rendszeréről (TÉR) - Az értékelés szempontjai és eljárásrendje" },
    { id: "401/2023. (VIII. 30.) Korm. rendelet", title: "A Púétv. végrehajtásáról - Munkaidő, pótlékok és minősítés" },
    { id: "20/2012. (VIII. 31.) EMMI rendelet", title: "A nevelési-oktatási intézmények működéséről - Eljárásrendek és továbbnevelési kérdések" },
    { id: "15/2013. (II. 26.) EMMI rendelet", title: "A pedagógiai szakszolgálati intézmények működéséről - EGYMI szakértői feladatok" },
    { id: "32/2012. (X. 8.) EMMI rendelet", title: "SNI Irányelvek - Autizmus (ASZ), értelmi fogyatékosság és fejlesztő oktatás irányelvei" },
    { id: "33/1998. (VI. 24.) NM rendelet", title: "A munkaköri, szakmai, illetve személyi higiénés alkalmasság orvosi vizsgálatáról és véleményezéséről" },
    { id: "1998. évi XXVI. törvény", title: "A fogyatékos személyek jogairól és esélyegyenlőségükről" },
    { id: "2019. évi LXXX. törvény", title: "A szakképzésről - Szakiskolai és készségfejlesztő iskolai képzés alapjai" },
    { id: "12/2020. (II. 7.) Korm. rendelet", title: "A szakképzésről szóló törvény végrehajtásáról" },
    { id: "363/2012. (XII. 17.) Korm. rendelet", title: "Az Óvodai nevelés országos alapprogramja" },
    { id: "7/2012. (VI. 8.) EMMI rendelet", title: "A Kollégiumi nevelés országos alapprogramja" },
    { id: "110/2012. (VI. 4.) Korm. rendelet", title: "A Nemzeti Alaptanterv (NAT) kiadásáról" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setActiveTab('analyzer')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Scale className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">EGYMI Jogszabály-Iránytű</h1>
          </button>
          <nav className="hidden lg:flex gap-1 h-full">
            {[
              { id: 'analyzer', label: 'Elemző', icon: Search },
              { id: 'tracker', label: 'Változáskövető', icon: Newspaper },
              { id: 'knowledge', label: 'Tudástár', icon: BookMarked },
              { id: 'laws', label: 'Jogszabályok', icon: Gavel }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'tracker' && !trackerData) handleFetchChanges();
                  if (tab.id !== 'laws') setSelectedLaw(null);
                }}
                className={`px-4 flex items-center gap-2 border-b-2 transition-all ${activeTab === tab.id ? 'border-white bg-indigo-800' : 'border-transparent hover:bg-indigo-600'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 space-y-8">
        {activeTab === 'analyzer' && (
          <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4 text-indigo-700">
                <BookOpen className="w-5 h-5" />
                <h2 className="font-semibold text-lg">Elemzendő jogszabály vagy kérdés</h2>
              </div>
              <textarea
                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 mb-4"
                placeholder="Másolja be a szöveget..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={status === AnalysisStatus.LOADING || !input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md"
                >
                  {status === AnalysisStatus.LOADING ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Elemzés indítása
                </button>
              </div>
            </section>
            {status === AnalysisStatus.SUCCESS && result && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl shadow-sm">
                  <h3 className="font-bold text-xl uppercase text-indigo-800 mb-4">EGYMI intézményi elemzés</h3>
                  <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">{parseInstitutionalAnalysis(result)}</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-800 whitespace-pre-wrap">{cleanText(result)}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-800">Naprakész Jogszabályi Monitor</h2>
              <button onClick={handleFetchChanges} disabled={status === AnalysisStatus.LOADING} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-md">
                <RefreshCw className={status === AnalysisStatus.LOADING ? 'animate-spin' : ''} /> Frissítés
              </button>
            </div>
            {status === AnalysisStatus.LOADING ? (
              <div className="py-24 text-center"><RefreshCw className="w-12 h-12 animate-spin mx-auto text-indigo-500" /></div>
            ) : trackerData && (
              <div className="grid gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 prose max-w-none whitespace-pre-wrap">{trackerData.text}</div>
                {trackerData.sources.map((chunk, idx) => chunk.web && (
                  <a key={idx} href={chunk.web.uri} target="_blank" className="bg-slate-100 p-4 rounded-xl flex items-center justify-between hover:bg-indigo-50 transition-colors">
                    <span className="text-sm font-medium">{chunk.web.title}</span>
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Forrás tájékoztató */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">Hiteles és Elsődleges Források</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    A Tudástár válaszai <b>kizárólag és elsődlegesen</b> a "Jogszabályok" menüpontban felsorolt hivatalos forrásokra (<b>Nkt., NM, BM, EMMI rendeletek, SNI irányelvek</b>) épülnek. A szakértői asszisztens ezeket a dokumentumokat tekinti mérvadónak minden válasz kidolgozásakor.
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  placeholder="Kérdezzen az EGYMI protokollokról..."
                  value={knowledgeInput}
                  onChange={(e) => setKnowledgeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleKnowledgeQuery()}
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickTopics.map(t => <button key={t} onClick={() => handleKnowledgeQuery(t)} className="text-xs bg-slate-200 px-3 py-1.5 rounded-full hover:bg-indigo-600 hover:text-white transition-all font-medium text-slate-600">{t}</button>)}
              </div>
              
              {status === AnalysisStatus.LOADING && (
                <div className="py-12 text-center">
                  <RefreshCw className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-2" />
                  <p className="text-slate-500 italic">Szakértői válasz generálása a hivatalos források alapján...</p>
                </div>
              )}

              {status === AnalysisStatus.SUCCESS && knowledgeResult && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-indigo-100 p-8 shadow-sm whitespace-pre-wrap relative border-l-8 border-l-indigo-500">
                    <div className="flex justify-end gap-2 mb-6 no-print">
                      <button 
                        onClick={() => handleSaveAsWord(knowledgeResult, knowledgeInput)}
                        className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-semibold"
                        title="Mentés Word dokumentumként"
                      >
                        <Download className="w-4 h-4" /> Mentés Word
                      </button>
                      <button 
                        onClick={() => handlePrint(knowledgeResult, knowledgeInput)}
                        className="flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-semibold"
                        title="Kijelölt tartalom nyomtatása"
                      >
                        <Printer className="w-4 h-4" /> Nyomtatás
                      </button>
                    </div>
                    <div className="prose prose-slate max-w-none text-slate-800">
                      {knowledgeResult}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'laws' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {!selectedLaw ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coreRegulations.map(law => (
                  <button key={law.id} onClick={() => handleLawSelect(law)} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-all text-left flex flex-col justify-between h-full group">
                    <div>
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">{law.id}</h4>
                      <p className="text-sm text-slate-500 leading-snug">{law.title}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-indigo-600 font-semibold text-sm">Megtekintés <ChevronRight className="w-4 h-4" /></div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <button onClick={() => setSelectedLaw(null)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium"><ArrowLeft className="w-4 h-4" /> Vissza a listához</button>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-900 p-8 text-white">
                    <h2 className="text-2xl font-bold">{selectedLaw.id}</h2>
                    <p className="text-slate-400 mt-1">{selectedLaw.title}</p>
                  </div>
                  <div className="p-8">
                    {status === AnalysisStatus.LOADING ? (
                      <div className="py-12 text-center">
                        <RefreshCw className="animate-spin mx-auto text-indigo-500 w-12 h-12 mb-4" />
                        <p className="text-slate-500">Jogszabályi adatok betöltése az NJT-ről...</p>
                      </div>
                    ) : lawDetail && (
                      <div className="space-y-8">
                        <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-700">{lawDetail.text}</div>
                        {lawDetail.sources.map((s, i) => s.web && (
                          <a key={i} href={s.web.uri} target="_blank" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md font-bold">
                            Hatályos NJT.hu szöveg megnyitása <ExternalLink className="w-4 h-4" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {status === AnalysisStatus.ERROR && (
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <div>
              <p className="font-bold">Hiba történt!</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-10 mt-auto text-center border-t border-slate-800">
        <p className="text-sm font-medium opacity-75">&copy; {currentYear} EGYMI Jogszabály-Iránytű • Szakértői Támogató Rendszer</p>
        <p className="text-xs mt-2 opacity-50 uppercase tracking-widest">Hivatalos NJT.HU és Google Grounding Integrációval</p>
      </footer>
    </div>
  );
};

export default App;
