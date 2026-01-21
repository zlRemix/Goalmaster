
import { GoogleGenAI } from "@google/genai";

// AI Service for generating dynamic game content using Gemini
export class GeminiService {
  async generateMatchCommentary(
    homeTeam: string, 
    awayTeam: string, 
    score: string, 
    keyMoments: string[]
  ): Promise<string> {
    // Creating a new instance right before the call as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Erstelle einen packenden, professionellen Fußball-Spielbericht in deutscher Sprache.
        Heimteam: ${homeTeam}
        Auswärtsteam: ${awayTeam}
        Ergebnis: ${score}
        Schlüsselmomente: ${keyMoments.join(', ')}
        Der Ton sollte leidenschaftlich sein, wie in einer großen Sportzeitung.`,
      });
      return response.text || "Analyse momentan nicht verfügbar.";
    } catch (error) {
      console.error("Gemini API error during commentary generation:", error);
      // Return a standard fallback if AI generation fails
      return `Ein intensives Spiel zwischen ${homeTeam} und ${awayTeam} endet mit ${score}. Die Fans sahen eine Partie voller Leidenschaft. Die taktische Marschroute beider Trainer war deutlich erkennbar, wobei am Ende die Effizienz vor dem Tor den Ausschlag gab.`;
    }
  }
}

export const geminiService = new GeminiService();
