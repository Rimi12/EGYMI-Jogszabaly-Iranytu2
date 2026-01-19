import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
SZEREP: EGYMI (Egységes Gyógypedagógiai Módszertani Intézmény) jogszabály-szakértő vagy pedagógusoknak.
CÉL: Jogszabályváltozás-követés, tájékoztatás és hatásvizsgálat.
STÍLUS: Szakmai, de közérthető. Kerüld a rövidítéseket a kifejtésben.
MINDIG hivatkozz pontos jogszabályi helyekre.
`;

export const analyzeRegulation = async (input: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: input,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.1 },
  });
  if (!response.text) throw new Error("Üres válasz az AI-tól.");
  return response.text;
};

export const fetchLatestChanges = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const today = new Date().toLocaleDateString('hu-HU');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Melyek a legfrissebb (2024-2025) köznevelési, SNI és EGYMI releváns jogszabályváltozások Magyarországon? Keress rá az njt.hu-n és a Magyar Közlönyben. Sorold fel őket dátum szerint. Ne csak összefoglalót adj, hanem a konkrét módosítások lényegét is.`,
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
      systemInstruction: `EGYMI Tudástár asszisztens vagy. Forrásaid: Nkt., 15/2013 EMMI, 20/2012 EMMI, 32/2012 EMMI, Púétv. Adj pontos jogszabályi hivatkozásokat és részletes kifejtést.`,
      temperature: 0.1,
    },
  });
  return response.text;
};

export const fetchRegulationDetails = async (lawId: string, lawTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Pro modellt használunk a nagyobb kontextushoz
    contents: `Kérlek, keresd meg a ${lawId} (${lawTitle}) hatályos szövegét a Nemzeti Jogszabálytárban (njt.hu). 
    FONTOS: Ne összefoglalót írj! A jogszabály legfontosabb fejezeteit, szakaszait és paragrafusait szeretném látni szöveghűen vagy rendkívül részletesen kifejtve. 
    Különösen figyelj azokra a részekre, amelyek az EGYMI-re, a pedagógusok jogállására, bérére vagy a sajátos nevelési igényű (SNI) gyermekekre vonatkoznak.`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4000 }, // Engedélyezzük a mélyebb gondolkodást a kereséshez
      systemInstruction: `Szigorú szakértői asszisztens vagy. A feladatod a jogszabályi szöveg minél pontosabb és részletesebb visszadása az njt.hu alapján. Ne rövidíts le fontos jogi rendelkezéseket.`,
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};