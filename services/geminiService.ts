import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from environment variables
// Note: In a production client-side app, you might proxy this through your own backend,
// but for this specific request context using process.env.API_KEY is correct.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSMSDraft = async (topic: string, tone: 'formal' | 'casual' | 'urgent'): Promise<string> => {
  try {
    const prompt = `
      Write a short, clear, and engaging SMS broadcast message for a church congregation.
      Topic: ${topic}
      Tone: ${tone}
      Constraints:
      - Max 160 characters if possible, but definitely under 300.
      - Do not include hashtags.
      - Use "{$name}" as a placeholder if the message feels like it needs a name, but prefer generic greetings for broadcasts.
      - Sign off as "Ecclesia Team".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating SMS draft:", error);
    throw new Error("Failed to generate draft content.");
  }
};