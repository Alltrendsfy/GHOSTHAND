import { GoogleGenAI, Type } from '@google/genai';

// Initialize with a cleaner pattern
const getAI = (apiKey: string) => new GoogleGenAI({ apiKey });

/**
 * Uses gemini-2.5-flash with Google Search grounding
 */
export async function searchWeb(apiKey: string, query: string): Promise<string> {
  const ai = getAI(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    // Extract grounding info if available to format a nicer response
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let text = response.text || "Sem resultados.";
    
    if (chunks) {
       text += "\n\nFontes:\n" + chunks.map((c: any) => c.web?.uri ? `- ${c.web.title}: ${c.web.uri}` : '').join('\n');
    }
    return text;
  } catch (error) {
    console.error("Search error:", error);
    return "Erro ao realizar a pesquisa.";
  }
}

/**
 * Uses gemini-2.5-flash with Google Maps grounding
 */
export async function searchMaps(apiKey: string, query: string): Promise<string> {
  const ai = getAI(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });
    return response.text || "Não encontrei informações no mapa.";
  } catch (error) {
    console.error("Maps error:", error);
    return "Erro ao consultar o Google Maps.";
  }
}

/**
 * Uses gemini-3-pro-preview to analyze an image
 */
export async function analyzeImage(apiKey: string, base64Data: string, mimeType: string, prompt: string): Promise<string> {
  const ai = getAI(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt || "Descreva esta imagem detalhadamente para um desenvolvedor." }
        ]
      }
    });
    return response.text || "Não consegui analisar a imagem.";
  } catch (error) {
    console.error("Analysis error:", error);
    return "Erro na análise da imagem.";
  }
}

/**
 * Uses gemini-2.5-flash-image to edit images
 */
export async function editImage(apiKey: string, base64Data: string, mimeType: string, prompt: string): Promise<string> {
  const ai = getAI(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt }
        ]
      }
    });

    // Extract the image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data; // Return base64 string
      }
    }
    throw new Error("Nenhuma imagem gerada.");
  } catch (error) {
    console.error("Image edit error:", error);
    throw error;
  }
}

/**
 * Uses veo-3.1-fast-generate-preview to generate videos
 */
export async function generateVideo(apiKey: string, prompt: string, imageBase64?: string, imageMime?: string): Promise<string> {
  const ai = getAI(apiKey);
  try {
    let operation;
    
    if (imageBase64 && imageMime) {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: imageBase64,
            mimeType: imageMime
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    } else {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    }

    // Polling logic
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Falha na geração do vídeo");
    
    // Return the URI directly - the frontend will need to append the key to fetch it
    return videoUri;

  } catch (error) {
    console.error("Video generation error:", error);
    throw error;
  }
}