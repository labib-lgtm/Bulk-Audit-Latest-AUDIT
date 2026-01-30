
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    try {
        return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    } catch (e) {
        return null;
    }
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

        return response.text || "Could not generate insights.";
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

        return response.text || "No specific advice for this view.";
    } catch (error) {
        return "Advice generation failed.";
    }
};
