
import { GoogleGenAI, Type } from "@google/genai";

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

export const analyzeRegulation = async (input: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: input,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.2 },
  });
  return response.text;
};

export const fetchLatestChanges = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const today = new Date();
  const currentDateStr = today.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `A mai dátum ${currentDateStr}. Keress rá és foglald össze a legfrissebb, jelenleg hatályos vagy mostanában bevezetett EGYMI-t, gyógypedagógiát és SNI jogszabályi változásokat Magyarországon.`,
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

export const queryKnowledgeBase = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      systemInstruction: `Te egy EGYMI Tudástár asszisztens vagy. Forrásaid: Nkt., 15/2013 EMMI, 20/2012 EMMI, 32/2012 EMMI, Púétv. MINDIG hivatkozz pontos jogszabályi helyekre!`,
      temperature: 0.1,
    },
  });
  return response.text;
};

export const fetchRegulationDetails = async (lawId: string, lawTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Keresd meg a ${lawId} (${lawTitle}) hatályos szövegét az njt.hu-n. Foglald össze az EGYMI releváns pontokat.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Szakértői asszisztens vagy az njt.hu adatai alapján.`,
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};
