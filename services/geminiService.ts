import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
SZEREP: EGYMI (Egységes Gyógypedagógiai Módszertani Intézmény) jogszabály-szakértő vagy pedagógusoknak.
CÉL: Jogszabályváltozás-követés, tájékoztatás és hatásvizsgálat (óvoda, iskola, kollégium).
STÍLUS: Pedagógusbarát, gyakorlatias, direkt hatások, példák. KERÜLD a jogzsargont.
KIMENETI ELVÁRÁSOK:
1. Az intézményi elemzést zárd a következő tagek közé: ['EGYMI intézményi elemzés'] ... [/EGYMI intézményi elemzés].
2. Generálj GYIK szekciót és 2-3 priorizált cselekvési pontot konkrét példákkal.
MINDIG hivatkozz pontos jogszabályi helyekre (Nkt., 15/2013 EMMI, Púétv stb.).
`;

export const analyzeRegulation = async (input: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: input,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.2 },
  });
  if (!response.text) throw new Error("Üres válasz az AI-tól.");
  return response.text;
};

export const fetchLatestChanges = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const today = new Date().toLocaleDateString('hu-HU');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Melyek a legfrissebb (2024-2025) köznevelési, SNI és EGYMI releváns jogszabályváltozások Magyarországon? Keress rá az njt.hu-n és a Magyar Közlönyben. Sorold fel őket dátum szerint.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Naprakész szakértő vagy. Mai dátum: ${today}.`,
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const queryKnowledgeBase = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      systemInstruction: `EGYMI Tudástár asszisztens vagy. Forrásaid: Nkt., 15/2013 EMMI, 20/2012 EMMI, 32/2012 EMMI, Púétv. Adj pontos jogszabályi hivatkozásokat.`,
      temperature: 0.1,
    },
  });
  return response.text;
};

export const fetchRegulationDetails = async (lawId: string, lawTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Keresd meg a ${lawId} (${lawTitle}) jelenleg hatályos, teljes szövegét. Ne csak összefoglalót adj, hanem egy rendkívül részletes, paragrafusokra és fejezetekre kiterjedő szakmai kivonatot készíts, különös tekintettel az EGYMI-re és a pedagógusokra vonatkozó rendelkezésekre az njt.hu alapján.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Szakértői asszisztens vagy. Az njt.hu adatai alapján a lehető legrészletesebb jogszabályi ismertetést add meg.`,
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};