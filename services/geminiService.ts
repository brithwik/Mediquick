
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const CLEAN_TEXT_INSTRUCTION = "CRITICAL: Do not use any markdown formatting symbols. No asterisks, no underscores, no hashes. Use only plain text. For lists, use simple bullets like '-' or '•'. Separate sections with double line breaks for clear paragraphs.";

/**
 * Utility to strip markdown symbols if the model accidentally includes them.
 */
export const stripMarkdown = (text: string) => {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/#/g, '')
    .replace(/`/g, '');
};

export const analyzeSymptomsOrReports = async (prompt: string, imageBase64?: string) => {
  const ai = getAI();
  const parts: any[] = [{ text: prompt }];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `You are a Senior Medical Decision Support Agent. ${CLEAN_TEXT_INSTRUCTION}
      Structure your response with:
      1. ANALYSIS: A summary of findings.
      2. RISK LEVEL: (Low/Medium/High/Emergency) with reasoning.
      3. DECISION SUPPORT: Concrete next steps.
      4. DISCLAIMER: Remind the user you are an AI.`
    }
  });

  return {
    text: stripMarkdown(response.text || "No analysis provided."),
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const checkOverdoseRisk = async (data: { drug: string, amount: string, time: string, weight?: string, symptoms: string }) => {
  const ai = getAI();
  const prompt = `Assess overdose risk for:
  Drug: ${data.drug}
  Amount Taken: ${data.amount}
  Time Since Ingestion: ${data.time}
  Patient Weight: ${data.weight || 'Not provided'}
  Current Symptoms: ${data.symptoms}
  
  Provide immediate emergency advice, potential toxicity symptoms to watch for, and clinical guidance.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `You are an Emergency Toxicology Expert. ${CLEAN_TEXT_INSTRUCTION}
      Always prioritize life-saving measures. If risk is high, advise immediate Emergency Room visit. 
      Use clear headings like EMERGENCY ACTION, RISK ASSESSMENT, and SYMPTOMS TO MONITOR.`
    }
  });

  return {
    text: stripMarkdown(response.text || "Assessment unavailable."),
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const identifyDrug = async (imageBase64: string, context?: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        { text: `Identify this drug. ${context ? `Additional Context: ${context}` : ''} Provide Name, Class, Indications, Dosage, Contraindications, and Side Effects. Use clear paragraphs and bullet points.` }
      ]
    },
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: CLEAN_TEXT_INSTRUCTION
    }
  });

  return {
    text: stripMarkdown(response.text || "Drug could not be identified."),
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const searchNearbyCare = async (query: string, location?: { latitude: number; longitude: number }) => {
  const ai = getAI();
  // Using gemini-2.5-flash for reliable Maps tool use
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: query,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      systemInstruction: `You are a medical location assistant. ${CLEAN_TEXT_INSTRUCTION} 
      Find specific medical facilities requested. Provide their name, full address, and distance if known. You MUST use the googleMaps tool for this.`,
      toolConfig: location ? {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        }
      } : undefined
    },
  });

  return {
    text: stripMarkdown(response.text || "No nearby services found."),
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const generateSpeech = async (text: string) => {
  const ai = getAI();
  const cleanTextForTTS = stripMarkdown(text).substring(0, 800);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this medical information clearly: ${cleanTextForTTS}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// LIVE API ENCODING/DECODING UTILS (as per standards)
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Renamed from decode to decodeBase64Audio to fix missing export errors
export function decodeBase64Audio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const decodePCM = async (data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const encodePCM = (data: Float32Array): string => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return encode(new Uint8Array(int16.buffer));
};
