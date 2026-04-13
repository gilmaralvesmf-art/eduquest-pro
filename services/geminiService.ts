
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Difficulty } from "../types";

let cachedApiKey: string | null = null;

const getApiKey = async (): Promise<string> => {
  if (cachedApiKey) return cachedApiKey;
  
  // Try environment first (for dev/build injection if any)
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
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

const withRetry = async <T>(fn: () => Promise<T>, retries = 4, delay = 3000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const message = error.message || "";
    const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
    
    const isRetryable = 
      message.includes('503') || 
      message.includes('429') || 
      message.includes('UNAVAILABLE') || 
      message.includes('RESOURCE_EXHAUSTED') ||
      errorStr.includes('503') || 
      errorStr.includes('429') || 
      errorStr.includes('UNAVAILABLE') || 
      errorStr.includes('RESOURCE_EXHAUSTED');

    if (retries > 0 && isRetryable) {
      console.warn(`Gemini API em alta demanda ou limite atingido, tentando novamente em ${delay}ms... (${retries} tentativas restantes)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
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
  
  const boardPrompt = boards && boards.length > 0 ? ` no estilo das bancas: ${boards.join(', ')}` : "";
  
  let formatPrompt = "";
  if (questionType === 'multiple_choice') {
    formatPrompt = `- Formato: Cada questão deve ter um enunciado claro e 5 alternativas (A, B, C, D, E).\n    - Resposta: Indique a alternativa correta (texto completo da alternativa).\n    - IMPORTANTE: O campo 'options' DEVE conter exatamente 5 itens e 'questionType' DEVE ser 'multiple_choice'.`;
  } else if (questionType === 'open') {
    formatPrompt = `- Formato: Cada questão deve ter um enunciado claro para uma questão discursiva/aberta.\n    - Resposta: Forneça um padrão de resposta esperado ou espelho de correção detalhado.\n    - IMPORTANTE: O campo 'options' DEVE ser uma lista vazia [] e 'questionType' DEVE ser 'open'.`;
  } else {
    formatPrompt = `- Formato: Mescle questões de múltipla escolha (com 5 alternativas) e questões discursivas/abertas.\n    - Resposta: Para múltipla escolha, indique a alternativa correta. Para discursivas, forneça o padrão de resposta.\n    - IMPORTANTE: Para questões de múltipla escolha, 'options' deve ter 5 itens e 'questionType' deve ser 'multiple_choice'. Para questões discursivas, 'options' deve ser vazio [] e 'questionType' deve ser 'open'.`;
  }

  const difficultyPrompt = difficulty === Difficulty.MIXED 
    ? `- Nível de dificuldade: Mesclada (Distribua as questões entre Fácil, Médio e Difícil de forma equilibrada).`
    : `- Nível de dificuldade: ${difficulty}.`;

  const generate = async () => {
    return await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Você é um especialista em elaboração de questões de concursos e vestibulares de alto nível (como ITA, IME, FUVEST e bancas regionais como UECE, URCA, UPE, UFPE).
      Gere exatamente ${count} questões ${questionType === 'mixed' ? 'mesclando múltipla escolha e discursivas' : (questionType === 'multiple_choice' ? 'de múltipla escolha' : 'discursivas/abertas')} inéditas sobre "${topic}" na disciplina de "${subject}"${boardPrompt}.
      
      Critérios:
      ${difficultyPrompt}
      - Idioma: Português do Brasil.
      ${formatPrompt}
      - Comentário: Forneça uma explicação detalhada.
      - Qualidade: Siga o padrão rigoroso das bancas solicitadas.
      - Elementos Visuais e Gráficos: É OBRIGATÓRIO incluir elementos visuais (tabelas ou diagramas) em pelo menos 60% das questões.
      - Para tabelas: Use Markdown padrão.
      - Para figuras, diagramas e gráficos: Use OBRIGATORIAMENTE blocos de código \`\`\`mermaid. 
      - IMPORTANTE: Sempre envolva o texto dos nós (labels) em aspas duplas se contiverem caracteres especiais, parênteses, sinais de mais/menos ou matemática. 
      - Exemplo: A["C(s) + O2(g)"] --> B["CO2(g)"].
      - Exemplos de uso: 
        - Biologia: Ciclos, cadeias alimentares, organelas (usando fluxogramas).
        - Química: Processos industriais, ciclos termoquímicos, modelos atômicos simples.
        - Física: Circuitos elétricos (usando graph), diagramas de forças, trajetórias.
        - Matemática: Gráficos de funções (usando xychart-beta), diagramas de Venn.
        - Geografia/História: Linhas do tempo, fluxos migratórios.
      - IMPORTANTE: O conteúdo visual deve ser rico e ajudar na resolução da questão. Coloque o código Mermaid ou a Tabela no campo "visualContent".
      - NÃO inclua títulos ou prefixos como "Diagrama:", "Gráfico:", "graph", "chart" ou "Conteúdo Visual:" dentro do campo "visualContent". O campo deve conter APENAS o código Mermaid puro ou a Tabela Markdown.
      - Se for um diagrama Mermaid, o "visualType" deve ser "graph". Se for tabela, "table".
      - Formatação Matemática e Química: Use OBRIGATORIAMENTE LaTeX.
      - IMPORTANTE: Toda e qualquer fórmula, símbolo matemático (como \Delta, \pi, \infty, \circ) ou símbolo de reação (como \rightarrow, \rightleftharpoons) DEVE estar entre cifrões ($) e usar a barra invertida (\) corretamente.
      - NUNCA escreva "Delta", "rightarrow", "textkJ" ou "circ" como texto puro. Use sempre $\Delta$, $\rightarrow$, $\text{kJ}$ ou $^\circ$.
      - Exemplo Correto: $\Delta H_f^\circ$, $C_2H_2 + O_2 \rightarrow CO_2 + H_2O$.
      - NÃO USE o comando \`\\ce{}\` para química, escreva as fórmulas químicas usando formatação matemática padrão do LaTeX (exemplo: \`$H_2O$\`, \`$X^{2+}$\`). NUNCA use caracteres unicode puros para fórmulas complexas, use SEMPRE LaTeX.
      
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
              difficulty: { 
                type: Type.STRING,
                enum: ["Fácil", "Médio", "Difícil"],
                description: "A dificuldade específica desta questão"
              },
              year: { type: Type.NUMBER },
              source: { type: Type.STRING }
            },
            required: ["id", "subject", "topic", "text", "correctAnswer", "commentary", "difficulty", "year", "visualType"]
          }
        }
      }
    });
  };

  try {
    const response = await withRetry(generate);
    const text = response.text;
    if (!text) throw new Error("O modelo não retornou conteúdo.");
    const parsed = JSON.parse(text);
    return parsed.map((q: any) => {
      const qType = q.questionType || (q.options && q.options.length > 0 ? 'multiple_choice' : 'open');
      return { ...q, questionType: qType };
    });
  } catch (error: any) {
    console.error("Erro ao processar JSON do Gemini:", error);
    
    let errorMessage = error.message || "Erro desconhecido";
    
    // Tentar extrair mensagem amigável de erro JSON do Google
    try {
      if (errorMessage.startsWith('{')) {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error) {
          if (parsedError.error.code === 429) {
            errorMessage = "Limite de uso da IA atingido (Quota Exceeded). Por favor, aguarde alguns segundos e tente novamente.";
          } else if (parsedError.error.code === 503) {
            errorMessage = "O serviço de IA está temporariamente indisponível devido à alta demanda. Tente novamente em instantes.";
          } else {
            errorMessage = parsedError.error.message || errorMessage;
          }
        }
      }
    } catch (e) {
      // Se falhar ao parsear, mantém a mensagem original
    }

    throw new Error(`Falha ao gerar questões: ${errorMessage}`);
  }
};

export const gradeAnswerSheet = async (imageBase64: string, answerKey: string): Promise<{ studentAnswers: string[], score: number }> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const generate = async () => {
    return await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.split(',')[1] || imageBase64
          }
        },
        {
          text: `Você é um especialista em visão computacional e correção de provas. Analise este cartão-resposta de prova.
          
          O gabarito oficial é: ${answerKey}.
          
          Instruções de Processamento de Imagem:
          - A imagem pode estar inclinada, com sombras ou iluminação irregular.
          - Ignore sombras e reflexos; foque nas marcações (círculos preenchidos ou X).
          - Mesmo que a imagem esteja em um ângulo difícil, use os pontos de referência do cartão (bordas, números das questões) para alinhar mentalmente a grade de respostas.
          - Se uma marcação estiver parcial, mas for claramente a intenção do aluno, considere-a.
          
          Tarefa:
          1. Identifique a alternativa marcada pelo aluno para cada questão (A, B, C, D ou E).
          2. Se não houver marcação clara ou houver múltiplas marcações conflitantes, use "-".
          3. Se o gabarito oficial para uma questão for "-", significa que é uma questão discursiva e não deve ser corrigida automaticamente. Retorne "-" para a resposta do aluno nessa questão.
          4. Calcule o 'score' (total de acertos). Não conte questões discursivas ("-") como acertos nem erros.
          
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
  };

  try {
    const response = await withRetry(generate);
    const text = response.text;
    if (!text) throw new Error("Resposta vazia da IA");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Erro na chamada do Gemini:", error);
    
    let errorMessage = error.message || "Erro desconhecido";
    
    try {
      if (errorMessage.startsWith('{')) {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error) {
          if (parsedError.error.code === 429) {
            errorMessage = "Limite de uso da IA atingido (Quota Exceeded). Por favor, aguarde alguns segundos e tente novamente.";
          } else if (parsedError.error.code === 503) {
            errorMessage = "O serviço de IA está temporariamente indisponível devido à alta demanda. Tente novamente em instantes.";
          } else {
            errorMessage = parsedError.error.message || errorMessage;
          }
        }
      }
    } catch (e) {}

    throw new Error(`Falha na correção: ${errorMessage}`);
  }
};

export const autoGradeWithKey = async (imageBase64: string, answerKey: string): Promise<{ studentAnswers: string[], score: number }> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  const generate = async () => {
    return await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.split(',')[1] || imageBase64
          }
        },
        {
          text: `Você é um especialista em visão computacional e correção de provas. Analise este cartão-resposta. 
          Gabarito oficial: ${answerKey}.
          
          Instruções de Processamento de Imagem:
          - A imagem pode estar inclinada, com sombras ou iluminação irregular.
          - Ignore sombras e reflexos; foque nas marcações (círculos preenchidos ou X).
          - Mesmo que a imagem esteja em um ângulo difícil, use os pontos de referência do cartão (bordas, números das questões) para alinhar mentalmente a grade de respostas.
          
          Regras:
          1. Identifique a alternativa marcada pelo aluno para cada questão (A, B, C, D ou E).
          2. Se o gabarito oficial for "-", é uma questão discursiva. Retorne "-" para a resposta do aluno e não conte como acerto nem erro.
          3. Se não houver marcação clara ou houver múltiplas marcações conflitantes, use "-".
          
          Retorne um JSON com:
          - studentAnswers: array de letras (A-E ou "-")
          - score: total de acertos.`
        }
      ],
      config: { responseMimeType: "application/json" }
    });
  };

  try {
    const response = await withRetry(generate);
    const text = response.text;
    if (!text) throw new Error("Resposta vazia da IA");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Erro na correção automática:", error);
    
    let errorMessage = error.message || "Erro desconhecido";
    
    try {
      if (errorMessage.startsWith('{')) {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error) {
          if (parsedError.error.code === 429) {
            errorMessage = "Limite de uso da IA atingido (Quota Exceeded). Por favor, aguarde alguns segundos e tente novamente.";
          } else if (parsedError.error.code === 503) {
            errorMessage = "O serviço de IA está temporariamente indisponível devido à alta demanda. Tente novamente em instantes.";
          } else {
            errorMessage = parsedError.error.message || errorMessage;
          }
        }
      }
    } catch (e) {}

    throw new Error(`Erro na correção automática: ${errorMessage}`);
  }
};
