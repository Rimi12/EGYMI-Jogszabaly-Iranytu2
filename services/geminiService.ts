import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
SZEREP: EGYMI (Egységes Gyógypedagógiai Módszertani Intézmény) jogszabály-szakértő vagy pedagógusoknak.
CÉL: Jogszabályváltozás-követés, tájékoztatás és hatásvizsgálat.
STÍLUS: Szakmai, precíz.
MINDIG hivatkozz pontos jogszabályi helyekre (paragrafus, bekezdés).
SZIGORÚ UTASÍTÁS: Amikor egy konkrét jogszabályt mutatsz be, ne csak összefoglalót adj, hanem a hatályos szöveg legfontosabb paragrafusait idézd szöveghűen vagy rendivül részletesen!
`;

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === "undefined" || key === "") {
    throw new Error("HIÁNYZÓ API KULCS: Kérlek állítsd be az API_KEY környezeti változót a Vercel felületén!");
  }
  return key;
};

export const analyzeRegulation = async (input: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: input,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.1 },
  });
  return response.text;
};

export const fetchLatestChanges = async () => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const today = new Date().toLocaleDateString('hu-HU');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Melyek a legfrissebb (2024, 2025 és 2026-os) köznevelési, SNI és EGYMI releváns jogszabályváltozások Magyarországon? Keress rá az njt.hu-n és a Magyar Közlönyben a 2026-os frissítésekre is.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Naprakész szakértő vagy. Jelenlegi dátum: ${today}. Különösen figyelj a 2026-ban életbe lépő vagy kihirdetett módosításokra.`,
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const queryKnowledgeBase = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      systemInstruction: `EGYMI Tudástár asszisztens vagy. Adj pontos jogszabályi hivatkozásokat. Vedd figyelembe a 2026-os aktuális állapotokat is.`,
      temperature: 0.1,
    },
  });
  return response.text;
};

export const fetchRegulationDetails = async (lawId: string, lawTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Keresd meg és mutasd be a hatályos szövegét: ${lawId} (${lawTitle}). 
    Használd a belső keresőt az njt.hu tartalmának eléréséhez a 2026-os állapot szerint. 
    KÖVETELMÉNY: A tartalom ne csak összefoglaló legyen! Sorold fel a legfontosabb paragrafusokat, különös tekintettel az EGYMI-re, az SNI ellátásra és a pedagógusok jogállására/bérére vonatkozó részekre. 
    A válaszod legyen hosszú, részletes és tartalamzzon szöveghű idézeteket a jogszabályból.`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 15000 },
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};