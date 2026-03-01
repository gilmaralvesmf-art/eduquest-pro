
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Difficulty } from "../types";

export const generateQuestions = async (
  subject: string, 
  topic: string, 
  count: number, 
  difficulty: Difficulty,
  board?: string
): Promise<Question[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chave de API não configurada. Por favor, configure a GEMINI_API_KEY.");
  const ai = new GoogleGenAI({ apiKey });
  
  const boardPrompt = board ? ` no estilo da banca ${board}` : "";
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Você é um especialista em elaboração de questões de concursos e vestibulares.
    Gere exatamente ${count} questões de múltipla escolha inéditas sobre "${topic}" na disciplina de "${subject}"${boardPrompt}.
    
    Critérios:
    - Nível de dificuldade: ${difficulty}.
    - Idioma: Português do Brasil.
    - Formato: Cada questão deve ter um enunciado claro e 5 alternativas (A, B, C, D, E).
    - Resposta: Indique a alternativa correta (texto completo da alternativa).
    - Qualidade: As questões devem ser desafiadoras e seguir o padrão das grandes bancas brasileiras.
    
    Retorne APENAS o JSON seguindo o esquema fornecido, sem textos explicativos antes ou depois.`,
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
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de 5 alternativas"
            },
            correctAnswer: { 
              type: Type.STRING,
              description: "O texto exato da alternativa correta"
            },
            difficulty: { type: Type.STRING },
            year: { type: Type.NUMBER },
            source: { type: Type.STRING }
          },
          required: ["id", "subject", "topic", "text", "options", "correctAnswer", "difficulty", "year"]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("O modelo não retornou conteúdo.");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Erro ao processar JSON do Gemini:", error);
    throw new Error(`Falha ao gerar questões: ${error.message}`);
  }
};

export const gradeAnswerSheet = async (imageBase64: string, answerKey: string): Promise<{ studentAnswers: string[], score: number }> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave de API não configurada. Verifique as configurações do ambiente.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.split(',')[1] || imageBase64
          }
        },
        {
          text: `Analise este cartão-resposta de prova. 
          O gabarito oficial é: ${answerKey}.
          
          Tarefa:
          1. Identifique a alternativa marcada pelo aluno para cada questão (A, B, C, D ou E).
          2. Se não houver marcação clara, use "-".
          3. Calcule o 'score' (total de acertos).
          
          Retorne obrigatoriamente um JSON puro no formato:
          {
            "studentAnswers": ["A", "B", ...],
            "score": 10
          }`
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Resposta vazia da IA");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro na chamada do Gemini:", error);
    throw error;
  }
};

export const autoGradeWithKey = async (imageBase64: string, answerKey: string): Promise<{ studentAnswers: string[], score: number }> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chave de API não configurada.");
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.split(',')[1] || imageBase64
          }
        },
        {
          text: `Analise este cartão-resposta. 
          Gabarito oficial: ${answerKey}.
          
          Retorne um JSON com:
          - studentAnswers: array de letras (A-E ou "-")
          - score: total de acertos.`
        }
      ],
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || '{"studentAnswers":[], "score":0}');
  } catch (error) {
    console.error("Erro na correção automática:", error);
    throw error;
  }
};
