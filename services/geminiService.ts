
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Difficulty } from "../types";

let cachedApiKey: string | null = null;

const getApiKey = async (): Promise<string> => {
  if (cachedApiKey) return cachedApiKey;
  
  // Try environment first (for dev/build injection if any)
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;
  if (envKey && envKey !== "undefined" && envKey !== "") {
    cachedApiKey = envKey;
    return envKey;
  }

  // Fallback to fetching from server
  try {
    const response = await fetch('/api/config');
    const data = await response.json();
    if (data.GEMINI_API_KEY) {
      cachedApiKey = data.GEMINI_API_KEY;
      return data.GEMINI_API_KEY;
    }
  } catch (err) {
    console.error("Erro ao buscar chave da API do servidor:", err);
  }

  throw new Error("Chave de API não encontrada. Por favor, verifique as configurações do ambiente.");
};

export const generateQuestions = async (
  subject: string, 
  topic: string, 
  count: number, 
  difficulty: Difficulty,
  board?: string,
  questionType: 'multiple_choice' | 'open' = 'multiple_choice'
): Promise<Question[]> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const boardPrompt = board ? ` no estilo da banca ${board}` : "";
  const formatPrompt = questionType === 'multiple_choice' 
    ? `- Formato: Cada questão deve ter um enunciado claro e 5 alternativas (A, B, C, D, E).\n    - Resposta: Indique a alternativa correta (texto completo da alternativa).`
    : `- Formato: Cada questão deve ter um enunciado claro para uma questão discursiva/aberta.\n    - Resposta: Forneça um padrão de resposta esperado ou espelho de correção detalhado.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Você é um especialista em elaboração de questões de concursos e vestibulares de alto nível (como ITA, IME, FUVEST e bancas regionais como UECE, URCA, UPE, UFPE).
    Gere exatamente ${count} questões ${questionType === 'multiple_choice' ? 'de múltipla escolha' : 'discursivas/abertas'} inéditas sobre "${topic}" na disciplina de "${subject}"${boardPrompt}.
    
    Critérios:
    - Nível de dificuldade: ${difficulty}.
    - Idioma: Português do Brasil.
    ${formatPrompt}
    - Comentário: Forneça uma explicação detalhada.
    - Qualidade: Siga o padrão rigoroso das bancas solicitadas.
    - Elementos Visuais: Se o assunto permitir, inclua tabelas (em formato Markdown), ou descrições detalhadas de gráficos, infográficos ou charges que complementem a questão.
    - Formatação Matemática: Use obrigatoriamente caracteres Unicode para sobreescrito (ex: x², y³) e subscrito (ex: H₂O). NUNCA use o acento circunflexo (^) para potências. Para fórmulas complexas, use notação clara.
    
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
              description: "Lista de 5 alternativas (vazio se for questão aberta)"
            },
            correctAnswer: { 
              type: Type.STRING,
              description: "O texto exato da alternativa correta ou o padrão de resposta esperado para questões abertas"
            },
            commentary: {
              type: Type.STRING,
              description: "Explicação detalhada da questão e do gabarito"
            },
            visualType: { 
              type: Type.STRING, 
              enum: ["table", "graph", "infographic", "charge", "none"],
              description: "Tipo de elemento visual que acompanha a questão"
            },
            visualContent: { 
              type: Type.STRING,
              description: "Conteúdo do elemento visual (Markdown para tabela, descrição para outros)"
            },
            questionType: {
              type: Type.STRING,
              description: "O tipo de questão gerada ('multiple_choice' ou 'open')"
            },
            difficulty: { type: Type.STRING },
            year: { type: Type.NUMBER },
            source: { type: Type.STRING }
          },
          required: ["id", "subject", "topic", "text", "correctAnswer", "commentary", "difficulty", "year", "visualType"]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("O modelo não retornou conteúdo.");
    const parsed = JSON.parse(text);
    return parsed.map((q: any) => ({ ...q, questionType }));
  } catch (error: any) {
    console.error("Erro ao processar JSON do Gemini:", error);
    throw new Error(`Falha ao gerar questões: ${error.message}`);
  }
};

export const gradeAnswerSheet = async (imageBase64: string, answerKey: string): Promise<{ studentAnswers: string[], score: number }> => {
  const apiKey = await getApiKey();
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
  const apiKey = await getApiKey();
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
