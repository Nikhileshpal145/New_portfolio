import { GoogleGenAI } from "@google/genai";
import { PORTFOLIO_DATA } from "../data/portfolio";

// Initialize Gemini client
// Note: API Key is accessed via process.env.API_KEY as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the AI Assistant for ${PORTFOLIO_DATA.name}'s portfolio website. 
Your goal is to represent ${PORTFOLIO_DATA.name}, a ${PORTFOLIO_DATA.title}, to potential recruiters, clients, or fellow engineers.

Here is ${PORTFOLIO_DATA.name}'s resume context:
Bio: ${PORTFOLIO_DATA.bio}
Skills: ${PORTFOLIO_DATA.skills.join(", ")}

Projects:
${PORTFOLIO_DATA.projects.map(p => `- ${p.title}: ${p.description} (Stack: ${p.techStack.join(', ')})`).join('\n')}

Experience:
${PORTFOLIO_DATA.experience.map(e => `- ${e.role} at ${e.company} (${e.period}): ${e.description.join(' ')}`).join('\n')}

Guidelines:
1. Be professional, concise, and enthusiastic.
2. Answer questions specifically about ${PORTFOLIO_DATA.name}'s experience and skills.
3. If asked about a specific technology not listed, you can say "${PORTFOLIO_DATA.name} hasn't explicitly listed this, but with their background in [relevant skill], they could likely pick it up quickly."
4. Do not make up facts outside the provided context.
5. Keep responses relatively short (under 150 words) unless asked for details.
`;

export const streamChatResponse = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  onChunk: (text: string) => void
) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    });

    const result = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    onChunk("\n[System Error: Unable to connect to neural interface. Please check API key configuration.]");
  }
};