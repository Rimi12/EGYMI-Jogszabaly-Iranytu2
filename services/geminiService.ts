
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
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 }
    },
  });

  return response.text;
};

export const fetchLatestChanges = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const today = new Date();
  const currentDateStr = today.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `A mai dátum ${currentDateStr}. Keress rá és foglald össze a legfrissebb, jelenleg hatályos vagy mostanában bevezetett EGYMI-t, gyógypedagógiát és SNI (sajátos nevelési igényű) tanulókat érintő magyarországi jogszabályi változásokat. Emeld ki a legfontosabb határidőket és teendőket a pedagógusok számára. Használj hiteles forrásokat (pl. Magyar Közlöny, kormányzati portálok).`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Te egy naprakész EGYMI jogszabály-szakértő vagy. A mai dátum: ${currentDateStr}. Használd a Google keresőt a legfrissebb hírekhez. A választ strukturált listában add meg, minden ponthoz rövid gyakorlati magyarázattal és pontos forrásmegjelöléssel.`,
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const queryKnowledgeBase = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const today = new Date();
  const currentDateStr = today.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      systemInstruction: `Te egy EGYMI Tudástár asszisztens vagy. Feladatod az EGYMI intézmények működésével, a gyógypedagógiai eljárásrenddel és az SNI ellátással kapcsolatos kérdések megválaszolása.
      A mai dátum: ${currentDateStr}.
      
      ELSŐDLEGES ÉS KÖTELEZŐ FORRÁSOK (prioritási sorrendben):
      1. 2011. évi CXC. törvény (Nkt. - Nemzeti köznevelésről)
      2. 15/2013. (II. 26.) EMMI rendelet (Pedagógiai szakszolgálatok működése)
      3. 20/2012. (VIII. 31.) EMMI rendelet (Nevelési-oktatási intézmények működése)
      4. 32/2012. (X. 8.) EMMI rendelet (SNI Irányelvek, autizmus, stb.)
      5. 18/2024. (IV. 4.) BM rendelet (Pedagógusok teljesítményértékelése - TÉR)
      6. 33/1998. (VI. 24.) NM rendelet (Munkaköri alkalmassági vizsgálatok)
      7. 2023. évi LII. törvény (Púétv. - Új életpálya törvény)
      
      A válaszod legyen:
      - Szakmailag precíz, de közérthető.
      - MINDEN VÁLASZBAN explicit módon hivatkozz a fenti jogszabályok konkrét pontjaira, mivel ezek a rendszer alapját képező hiteles források.
      - Ha egy kérdésre több jogszabály is releváns, mindegyiket említsd meg.
      - Adj gyakorlati tanácsokat pedagógusoknak az adott jogszabályi keretek között.
      Ha a kérdés nem kapcsolódik az EGYMI-hez vagy a gyógypedagógiához, udvariasan jelezd.`,
      temperature: 0.1,
    },
  });

  return response.text;
};

export const fetchRegulationDetails = async (lawId: string, lawTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const today = new Date();
  const currentDateStr = today.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Keresd meg a ${lawId} (${lawTitle}) legfrissebb, hatályos szövegét az njt.hu oldalon. Foglald össze a legfontosabb, EGYMI pedagógusokat érintő aktuális rendelkezéseket, különös tekintettel a legutóbbi módosításokra. Adj meg egy közvetlen linket az NJT hatályos állapotához.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `Szakértői asszisztens vagy. Feladatod a(z) ${lawId} pontos, aktuális állapotának bemutatása. A mai dátum: ${currentDateStr}. Mindig ellenőrizd, hogy a legfrissebb verziót mutatod-e be az njt.hu alapján.`,
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};
