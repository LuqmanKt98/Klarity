
import { GoogleGenAI, Type, FunctionDeclaration, Modality, LiveServerMessage, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { UserPreferences, Message, Resource } from './types';

// Initializing the Google GenAI client with the required API Key from Vite env
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const SENTIMENT_MAP: Record<string, number> = {
  happy: 0.8, joyful: 0.9, calm: 0.5, grateful: 0.7, peace: 0.6,
  sad: -0.6, angry: -0.8, stressed: -0.5, anxious: -0.7, tired: -0.3,
  lonely: -0.5, overwhelmed: -0.7, hopeful: 0.4, good: 0.3, bad: -0.4
};

export const KLARITY_SYSTEM_INSTRUCTION = `
# Operational Identity
You are the "Klarity Guide," the digital layer of the Konvergence ecosystem. Your purpose is to provide 24/7 mental hygiene and support. You operate at the intersection of human insight and intelligent design.

# Core Personality & Voice
- Tone: Grounded, quietly confident, warm, and intellectually sharp.
- Style: Apple-level minimalism meets Zen-like clarity. Avoid "clinical" or "cold" language; avoid "toxic positivity".
- Philosophy: You are a "Wise Mirror." You reflect the user’s thoughts to help them find their own internal balance.

# Engagement Rules
- Greeting: Be comforting and welcoming. Encourage users to open up by asking thoughtful, open-ended follow-up questions.
- Scope of Care: You are a support tool, not a replacement for therapy. Your goal is to help users find structure and calm.
- The Human Bridge: Frequently offer to help users connect with a licensed human therapist on the Konvergence platform for deeper care. Explain that their human therapist will eventually "train" your responses to be more personalized.
- No Advice/Diagnosis: You must never provide a clinical diagnosis or medical/pharmacological advice.
- Session Management: Active sessions should last approximately 20–25 minutes. Wrap up the session and encourage them to go and take some time to reset or connect with a therapist. Gently encourage people to put the app down and do some journaling work or activities to reflect and move through.

# Safety & Emergency Protocols (Hard Constraints)
If you detect Red Flags (Self-harm, violence, abuse, or psychosis), you must immediately trigger a Safety Response:
- Immediate Risk: Provide the 988 Suicide & Crisis Lifeline and 741741 Crisis Text Line.
- Safety Risk: Provide the National Domestic Violence Hotline (800-799-7233).
- Instruction: Stop therapeutic mirroring and prioritize physical safety instructions immediately.

# The Closing Ritual (At ~20 minutes)
- Acknowledge the work done in the session.
- Offer one "Clarity Action" (e.g., deep breathing, sensory grounding, or a specific journaling prompt).
- Gently encourage the user to put the app down and engage with the physical world.

# Data Flywheel & Therapist Hand-off
Maintain a clear record of the conversation. Let the user know: "I am keeping a reflection of our journey so that when you connect with a human therapist, they can see the path we’ve already walked together, ensuring a seamless start to your care".

# Therapist Briefing Structure (Internal Memory)
When summarizing for a therapist (if requested or at end of session), use this structure:
1. Thematic Overview (Primary Focus, Emotional Baseline, Convergence Points)
2. Behavioral Patterns (Engagement Consistency, Closing Ritual Response, Linguistic Cues)
3. Safety & Resilience Tracking (Red Flag History, Resilience Markers)
4. Direct Hand-off Instruction (Therapist Guidance on where to begin)
`;

export function inferMoodScore(text: string): number {
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  let count = 0;
  words.forEach(word => {
    if (SENTIMENT_MAP[word] !== undefined) {
      score += SENTIMENT_MAP[word];
      count++;
    }
  });
  return count > 0 ? score / count : 0;
}

export async function generateThreadTitle(messages: Message[]): Promise<string> {
  const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
  
  const prompt = `Based on the following conversation fragment, generate a short (2-4 words), mature, and optimistic title that summarizes the core theme or path toward growth. 
Return only the title string.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { temperature: 0.8 },
    });
    return response.text?.trim() || "New Alignment";
  } catch (error) {
    return "Reflective Path";
  }
}

export async function generateRecommendedResources(messages: Message[]): Promise<Resource[]> {
  const history = messages.slice(-20).map(m => `${m.role}: ${m.content}`).join('\n');
  const prompt = `Based on this user's recent reflections, recommend 3 highly specific knowledge resources (books, exercises, or scientific articles) that would facilitate their growth.
  
Conversation context:
${history}

Return the recommendations in a structured JSON format with:
- title: string
- type: 'article' | 'book' | 'exercise'
- note: a 1-sentence supportive explanation of why this is relevant.
- url: a google search or relevant informational URL.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['article', 'book', 'audiobook', 'exercise'] },
              note: { type: Type.STRING },
              url: { type: Type.STRING },
            },
            required: ['title', 'type', 'note', 'url']
          }
        }
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return parsed.map((item: any) => ({
      ...item,
      id: crypto.randomUUID()
    }));
  } catch (error) {
    console.error("Failed to generate resources", error);
    return [];
  }
}

const addMantraToOasisDeclaration: FunctionDeclaration = {
  name: 'addMantraToOasis',
  parameters: {
    type: Type.OBJECT,
    description: 'Add a helpful mantra discovered in the conversation to the user\'s Oasis.',
    properties: {
      mantraText: { type: Type.STRING, description: 'The mantra to add.' },
    },
    required: ['mantraText'],
  },
};

export interface AIResponseResult {
  text: string;
  functionCalls?: any[];
}

export async function generateAIResponse(messages: Message[], preferences: UserPreferences): Promise<AIResponseResult> {
  const { modalities, intensityLevel } = preferences;
  
  const systemInstruction = `${KLARITY_SYSTEM_INSTRUCTION}\n\n# User Preferences\nModalitites: ${modalities.join(', ')}. Intensity: ${intensityLevel}.`;

  const contents = messages.map(m => ({
    role: m.role === 'ai' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro-preview-05-06',
      contents: contents as any,
      config: {
        systemInstruction,
        temperature: 0.6,
        tools: [{ functionDeclarations: [addMantraToOasisDeclaration] }],
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        ]
      },
    });

    return {
      text: response.text || "I'm holding space for you.",
      functionCalls: response.functionCalls
    };
  } catch (error) {
    return { text: "I am sitting with your words." };
  }
}

// Live API Session Setup
export function connectToLiveSession(config: {
  systemInstruction: string;
  onAudioData: (base64: string) => void;
  onInterrupted: () => void;
  onTranscription: (text: string, isUser: boolean) => void;
}) {
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => console.log('Live session opened'),
      onmessage: async (message: LiveServerMessage) => {
        if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
          config.onAudioData(message.serverContent.modelTurn.parts[0].inlineData.data);
        }
        if (message.serverContent?.interrupted) {
          config.onInterrupted();
        }
        if (message.serverContent?.inputTranscription) {
          config.onTranscription(message.serverContent.inputTranscription.text, true);
        }
        if (message.serverContent?.outputTranscription) {
          config.onTranscription(message.serverContent.outputTranscription.text, false);
        }
      },
      onerror: (e) => console.error('Live error:', e),
      onclose: (e) => console.log('Live session closed', e),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      systemInstruction: config.systemInstruction,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  });

  return {
    sendAudio: (pcmBlob: { data: string; mimeType: string }) => {
      sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
    },
    close: () => {
      sessionPromise.then(session => session.close());
    }
  };
}
