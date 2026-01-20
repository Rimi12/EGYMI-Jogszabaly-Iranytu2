# EGYMI Jogszabály-Iránytű v3.4 – Funkcionális Összefoglaló

Az alkalmazás egy mesterséges intelligencia (Google Gemini API) alapú szakértői támogató rendszer, amely kifejezetten az **Egységes Gyógypedagógiai Módszertani Intézmények (EGYMI)** pedagógusai számára készült. Célja a gyakran változó és bonyolult jogszabályi környezet gyors, hiteles és közérthető értelmezése.

## 1. Menürendszer és elérhető funkciók

Az alkalmazás négy fő modulra oszlik, amelyek a felső navigációs sávon érhetőek el:

### A. Jogszabályok (Alapértelmezett nézet)
Ez a modul tartalmazza az EGYMI-k működését leginkább meghatározó **14 alapvető jogszabály** listáját.
- **Tartalom:** Kártya alapú elrendezésben láthatóak a törvények és rendeletek (pl. Nkt., Púétv., TÉR rendelet, SNI irányelvek).
- **Működés:** 
    - Egy jogszabályra kattintva az alkalmazás a **Gemini 3 Pro** modell segítségével megnyit egy részletes adatlapot.
    - **Szöveghű megjelenítés:** Az AI utasítást kapott, hogy ne csak összefoglalót készítsen, hanem paragrafus-szinten, részletesen idézze a hatályos szöveget, különös tekintettel a 2026-os EGYMI-re és a pedagógusok jogállására.
    - **ID másolása:** Egy kattintással vágólapra másolható a pontos jogszabályi azonosító.
    - **Hiteles oldal (NJT):** Google mélylink segítségével garantáltan a hatályos NJT tartalomhoz vezet.

### B. Elemző (Analyzer)
Ez a funkció lehetővé teszi tetszőleges jogszabályi szövegek azonnali szakértői interpretációját.
- **Működés:** A felhasználó beilleszthet egy szövegrészletet (pl. egy 2026-ban megjelent közlöny-szöveget).
- **Eredmény:** A **Gemini 3 Flash** modell elemzi a bemenetet EGYMI-specifikus szempontból.

### C. Változások (Tracker)
Valós idejű monitorozó funkció a legújabb jogszabályi módosítások követéséhez.
- **Működés:** A rendszer a **Google Search Grounding** technológiát használva az interneten keresi a 2024–2026-os releváns változásokat.
- **Eredmény:** Strukturált lista a legfrissebb (akár 2026-os) módosításokról, forrásmegjelöléssel.

### D. Tudástár (Knowledge Base)
Interaktív, kérdés-válasz alapú kereső a köznevelési jog világában.
- **Működés:** Szabad szöveges keresőmező (pl.: *"Milyen változások vannak 2026-ban a pótlékokban?"*).
- **Eredmény:** Pontos jogszabályi hivatkozásokkal alátámasztott, szakértői válasz.

---

## 2. Kiemelt technikai megoldások a stabilitás érdekében

### 2026-os Aktualitás
A v3.4-es verzió minden lekérdezése explicitly tartalmazza a **2026-os évre** való fókuszálást, biztosítva, hogy a pedagógusok a legaktuálisabb információkhoz jussanak hozzá.

### AI Modellstratégia
- **Gemini 3 Pro:** Mély kutatáshoz és jogszabály-adatlapokhoz.
- **Gemini 3 Flash:** Gyors változáskövetéshez és elemzésekhez.
- **Thinking Budget:** Fenntartott 15,000 token a komplex jogi szövegek precíz feldolgozásához.

---
*Frissítve: 2026.01.01.*