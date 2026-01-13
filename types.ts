
export interface WeatherData {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
  location: {
    city?: string;
    country?: string;
  };
}

export interface ForecastData {
  time: string[];
  temperature: number[];
}

export interface AppState {
  weather: WeatherData | null;
  forecast: ForecastData | null;
  loading: boolean;
  error: string | null;
  aiAdvice: string | null;
}

export const WEATHER_INTERPRETATION: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌦️' },
  61: { label: 'Slight rain', icon: '🌧️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Slight snow', icon: '🌨️' },
  73: { label: 'Moderate snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
};
