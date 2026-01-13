
import { GoogleGenAI } from "@google/genai";
import { WeatherData, WEATHER_INTERPRETATION } from "../types";

export const getAIWeatherAdvice = async (weather: WeatherData): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "AI advisor currently unavailable.";

  const ai = new GoogleGenAI({ apiKey });
  const condition = WEATHER_INTERPRETATION[weather.weatherCode]?.label || 'unknown';
  
  const prompt = `
    You are Atmosphere AI, a witty and helpful weather assistant. 
    Current data:
    - Temperature: ${weather.temperature}°C
    - Condition: ${condition}
    - Wind: ${weather.windSpeed} km/h
    - Period: ${weather.isDay ? 'Daytime' : 'Nighttime'}
    
    Provide a short, punchy (max 2 sentences) piece of advice for the user today. 
    Include recommendations on what to wear or an activity to do. Be friendly and stylish.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "Enjoy your day, whatever the weather!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The stars are cloudy, but you're doing great. Stay comfortable!";
  }
};
