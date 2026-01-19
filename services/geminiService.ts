import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
SZEREP: EGYMI (Egységes Gyógypedagógiai Módszertani Intézmény) jogszabály-szakértő vagy pedagógusoknak.
CÉL: Jogszabályváltozás-követés, tájékoztatás és hatásvizsgálat.
STÍLUS: Szakmai, precíz.
MINDIG hivatkozz pontos jogszabályi helyekre (paragrafus, bekezdés).
SZIGORÚ UTASÍTÁS: Amikor egy konkrét jogszabályt mutatsz be, ne csak összefoglalót adj, hanem a hatályos szöveg legfontosabb paragrafusait idézd szöveghűen vagy rendkívül részletesen!
`;

export const analyzeRegulation = async (input: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: input,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.1 },
  });
  return response.text;
};

export const fetchLatestChanges = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const today = new Date().toLocaleDateString('hu-HU');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Melyek a legfrissebb (2024-2025) köznevelési, SNI és EGYMI releváns jogszabályváltozások Magyarországon? Keress rá az njt.hu-n.`,
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
      systemInstruction: `EGYMI Tudástár asszisztens vagy. Adj pontos jogszabályi hivatkozásokat.`,
      temperature: 0.1,
    },
  });
  return response.text;
};

export const fetchRegulationDetails = async (lawId: string, lawTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Keresd meg és mutasd be a hatályos szövegét: ${lawId} (${lawTitle}). 
    Használd a belső keresőt az njt.hu tartalmának eléréséhez. 
    KÖVETELMÉNY: A tartalom ne csak összefoglaló legyen! Sorold fel a legfontosabb paragrafusokat, különös tekintettel az EGYMI-re, az SNI ellátásra és a pedagógusok jogállására/bérére vonatkozó részekre. 
    A válaszod legyen hosszú, részletes és tartalamzzon szöveghű idézeteket a jogszabályból.`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 15000 }, // Megemelt budget a mély kutatáshoz
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};