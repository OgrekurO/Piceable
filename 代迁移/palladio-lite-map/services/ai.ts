
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function translateRecord(data: Record<string, any>, targetLanguage: string): Promise<Record<string, any>> {
  if (!targetLanguage || targetLanguage === 'en') return data;

  try {
    // specific instructions to only translate values, keeping keys intact
    const prompt = `Translate the values of the following JSON object into ${targetLanguage}. 
    Do not translate keys. Do not translate proper nouns that are names of database IDs or URLs.
    Return the result as a valid JSON object.
    
    Data: ${JSON.stringify(data)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return data;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Translation error:", error);
    return data;
  }
}