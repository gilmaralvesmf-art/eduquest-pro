
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Difficulty } from "../types";

let cachedApiKey: string | null = null;

const getApiKey = async (): Promise<string> => {
  if (cachedApiKey) return cachedApiKey;
  
  // Prefer process.env as per guidelines
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey !== "undefined" && envKey !== "") {
    cachedApiKey = envKey;
    return envKey;
  }

  // Fallback to fetching from server if env is empty
  try {
    const response = await fetch('/api/config');
    const data = await response.json();
    if (data.GEMINI_API_KEY) {
      cachedApiKey = data.GEMINI_API_KEY;
      return data.GEMINI_API_KEY;
    }
  } catch (err) {
    console.error("Error fetching API key from server:", err);
  }

  throw new Error("Chave de API não encontrada.");
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 5, delay = 3000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const message = error.message || "";
    // Check for rate limit (429) or overloaded (503/429/RESOURCE_EXHAUSTED)
    const isRetryable = 
      /429|503|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(message) || 
      /429|503|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(JSON.stringify(error));

    if (retries > 0 && isRetryable) {
      const waitTime = /429|RESOURCE_EXHAUSTED/.test(message) ? delay * 2 : delay;
      console.warn(`Gemini API busy or rate limited, retrying in ${waitTime}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return withRetry(fn, retries - 1, waitTime * 1.5);
    }
    throw error;
  }
};

export const generateQuestions = async (
  subject: string, 
  topic: string, 
  count: number, 
  difficulty: Difficulty,
  boards?: string[],
  questionType: 'multiple_choice' | 'open' | 'mixed' = 'multiple_choice'
): Promise<Question[]> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const boardPrompt = boards && boards.length > 0 
    ? `. Considere os seguintes estilos, bancas ou níveis de ensino: ${boards.join(', ')}` 
    : "";
  
  const formatPrompt = questionType === 'multiple_choice'
    ? `- Cada questão deve ter um enunciado claro e 5 alternativas (A, B, C, D, E).\n- Marque a alternativa correta.\n- O campo 'options' deve ter 5 itens.`
    : questionType === 'open'
    ? `- Cada questão deve ser discursiva/aberta.\n- Forneça um padrão de resposta esperado.\n- O campo 'options' deve ser vazio [].`
    : `- Mescle questões de múltipla escolha (5 alternativas) e discursivas.\n- Siga os formatos acima para cada tipo.`;

  const difficultyPrompt = difficulty === Difficulty.MIXED 
    ? `- Nível de dificuldade equilibrado entre Fácil, Médio e Difícil.`
    : `- Nível de dificuldade: ${difficulty}.`;

  const visualPrompt = `- Elementos Visuais (GeoGebra): Caso a questão seja de Matemática, Física ou Química, você PODE usar o bloco de código \`\`\`geogebra contendo comandos para gerar gráficos ou diagramas.
       - Use apenas para: Gráficos de funções, geometria, vetores ou trajetórias.
       - Caso não seja necessário um gráfico, use visualType: "none" e visualContent: "".
       - Se usar GeoGebra, o campo 'visualType' deve ser "graph" ou "infographic".`;

  const generate = async () => {
    return await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um autor de questões de exames de elite (ITA, IME, FUVEST, ENEM).
      Gere ${count} questões de ${subject} sobre "${topic}"${boardPrompt}.
      
      Critérios de Qualidade:
      ${difficultyPrompt}
      ${formatPrompt}
      ${visualPrompt}
      - LaTeX: Use $...$ (inline) ou $$...$$ (block) para TODA e QUALQUER fórmula matemática ou símbolo químico.
      - Retorne o ano (year) e a fonte (source) da questão se for uma questão real, ou "Inédita" se for criada por você.
      
      Retorne APENAS o JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              commentary: { type: Type.STRING },
              visualType: { type: Type.STRING },
              visualContent: { type: Type.STRING },
              questionType: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              year: { type: Type.NUMBER },
              source: { type: Type.STRING }
            },
            required: ["id", "subject", "topic", "text", "correctAnswer"]
          }
        }
      }
    });
  };

  try {
    const response = await withRetry(generate);
    const text = response.text;
    if (!text) throw new Error("IA retornou resposta vazia.");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    let msg = error.message || "Erro na geração";
    if (msg.includes('429')) msg = "Limite de velocidade atingido. Tente novamente em 10 segundos.";
    if (msg.includes('503')) msg = "Serviço temporariamente indisponível. Tente novamente.";
    throw new Error(msg);
  }
};

export const gradeAnswerSheet = async (imageBase64: string, answerKey: string): Promise<{ studentAnswers: string[], score: number }> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const generate = async () => {
    return await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64.split(',')[1] || imageBase64 } },
        { text: `Gabarito esperado: ${answerKey}. Analise a imagem do cartão-resposta. Identifique as marcações do aluno. Retorne JSON: {"studentAnswers": ["A", "B", ...], "score": N}. Seja preciso e ultra-rápido.` }
      ],
      config: { responseMimeType: "application/json" }
    });
  };

  try {
    const response = await withRetry(generate);
    if (!response.text) throw new Error("Resposta vazia");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Grading Error:", error);
    throw new Error(error.message || "Erro na correção");
  }
};

export const autoGradeWithKey = async (imageBase64: string, answerKey: string): Promise<{ studentAnswers: string[], score: number }> => {
  return gradeAnswerSheet(imageBase64, answerKey);
};
