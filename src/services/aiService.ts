
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    try {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
        return apiKey ? new GoogleGenAI({ apiKey }) : null;
    } catch (e) {
        return null;
    }
};

/** Extract text from GenAI response; handles different SDK response shapes */
const getResponseText = (response: any, fallback: string): string => {
    if (!response) return fallback;
    if (typeof response.text === 'string' && response.text.trim()) return response.text;
    const candidates = response.candidates;
    if (Array.isArray(candidates) && candidates[0]) {
        const content = candidates[0].content;
        const parts = content?.parts;
        if (Array.isArray(parts) && parts[0]?.text) return String(parts[0].text);
    }
    return fallback;
};

export const generateAccountInsights = async (summaryData: any): Promise<string> => {
    const ai = getClient();
    if (!ai) return "AI Configuration missing.";

    try {
        const prompt = `
        You are a world-class Amazon Advertising Analyst. 
        Analyze the following account performance summary and provide a strategic, actionable paragraph (max 150 words).
        Focus on Efficiency (ACOS), Waste, and Growth.
        Data: ${JSON.stringify(summaryData, null, 2)}
        Format using Markdown bolding for key metrics. Jump straight into the insight.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return getResponseText(response, "Could not generate insights.");
    } catch (error) {
        return "Unable to generate AI insights. Check API configuration.";
    }
};

/**
 * Generates specific advice based on the current active dashboard view
 */
export const generateContextualAdvice = async (viewName: string, viewData: any): Promise<string> => {
    const ai = getClient();
    if (!ai) return "AI Configuration missing.";

    try {
        const prompt = `
        You are an Amazon PPC Expert. Provide 3 specific, bulleted technical recommendations for the "${viewName}" dashboard data provided.
        Be extremely concrete. Use ASINs, Campaign names, or Match types mentioned in the data.
        
        Data Context:
        ${JSON.stringify(viewData).substring(0, 4000)} 
        
        Keep it under 100 words. Be blunt and professional.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return getResponseText(response, "No specific advice for this view.");
    } catch (error) {
        return "Advice generation failed.";
    }
};
