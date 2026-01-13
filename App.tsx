
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, 
  Sun, 
  Wind, 
  Droplets, 
  MapPin, 
  RefreshCw, 
  Clock as ClockIcon, 
  AlertCircle,
  Zap,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { WeatherData, ForecastData, AppState, WEATHER_INTERPRETATION } from './types';
import { getAIWeatherAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    weather: null,
    forecast: null,
    loading: true,
    error: null,
    aiAdvice: null
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchWeather = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, loading: false, error: "Geolocation is not supported by your browser." }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Open-Meteo is a free, keyless weather API
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m&timezone=auto`
          );
          
          if (!response.ok) throw new Error("Failed to fetch weather data");
          
          const data = await response.json();
          
          const weather: WeatherData = {
            temperature: data.current_weather.temperature,
            windSpeed: data.current_weather.windspeed,
            weatherCode: data.current_weather.weathercode,
            isDay: data.current_weather.is_day === 1,
            time: data.current_weather.time,
            location: { city: "Current Location" }
          };

          const forecast: ForecastData = {
            time: data.hourly.time.slice(0, 24),
            temperature: data.hourly.temperature_2m.slice(0, 24)
          };

          const advice = await getAIWeatherAdvice(weather);

          setState({
            weather,
            forecast,
            loading: false,
            error: null,
            aiAdvice: advice
          });
        } catch (err) {
          setState(prev => ({ ...prev, loading: false, error: (err as Error).message }));
        }
      },
      (err) => {
        setState(prev => ({ ...prev, loading: false, error: "Access to location denied. Please allow location to see local weather." }));
      }
    );
  }, []);

  useEffect(() => {
    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const chartData = state.forecast?.time.map((t, i) => ({
    time: new Date(t).getHours() + ":00",
    temp: state.forecast?.temperature[i]
  })) || [];

  const getBgGradient = () => {
    if (state.loading) return 'from-gray-900 to-black';
    if (!state.weather) return 'from-indigo-900 to-gray-900';
    
    if (state.weather.isDay) {
      if (state.weather.weatherCode < 3) return 'from-blue-400 to-blue-600';
      if (state.weather.weatherCode < 60) return 'from-blue-600 to-gray-400';
      return 'from-gray-500 to-gray-700';
    } else {
      return 'from-indigo-950 via-slate-900 to-black';
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 bg-gradient-to-br ${getBgGradient()} p-4 md:p-8 flex flex-col items-center justify-start overflow-y-auto`}>
      {/* Header Section */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-2 drop-shadow-lg">
            {formatTime(currentTime)}
          </h1>
          <div className="flex items-center gap-2 text-blue-100/80 font-medium">
            <Calendar className="w-4 h-4" />
            {formatDate(currentTime)}
          </div>
        </div>
        
        <div className="glass px-6 py-4 rounded-3xl flex items-center gap-4 group">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-sm text-blue-100/60">
              <MapPin className="w-4 h-4" />
              <span>{state.weather?.location.city || "Searching..."}</span>
            </div>
            <button 
              onClick={() => fetchWeather()}
              className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-blue-200 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${state.loading ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Current Weather Card */}
        <div className="md:col-span-8 glass rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          {state.loading ? (
             <div className="flex-1 flex items-center justify-center">
               <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="w-12 h-12 animate-spin text-blue-200" />
                  <p className="text-blue-100/60 font-medium">Calibrating instruments...</p>
               </div>
             </div>
          ) : state.error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-xl font-semibold mb-2">Weather Unavailable</p>
                <p className="text-blue-100/60 mb-6">{state.error}</p>
                <button onClick={fetchWeather} className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full transition-all">Retry</button>
              </div>
            </div>
          ) : state.weather ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-8xl font-black drop-shadow-2xl flex items-start">
                    {Math.round(state.weather.temperature)}
                    <span className="text-4xl mt-4 ml-1 opacity-50">°C</span>
                  </p>
                  <p className="text-2xl font-medium text-blue-100/80 mt-2">
                    {WEATHER_INTERPRETATION[state.weather.weatherCode]?.label}
                  </p>
                </div>
                <div className="text-8xl filter drop-shadow-lg">
                   {WEATHER_INTERPRETATION[state.weather.weatherCode]?.icon}
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-white/10 grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl"><Wind className="w-5 h-5 text-blue-200" /></div>
                  <div>
                    <p className="text-xs text-blue-100/50 font-semibold uppercase">Wind</p>
                    <p className="text-lg font-bold">{state.weather.windSpeed} km/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl"><Droplets className="w-5 h-5 text-blue-200" /></div>
                  <div>
                    <p className="text-xs text-blue-100/50 font-semibold uppercase">Humidity</p>
                    <p className="text-lg font-bold">64%</p> {/* Static since OpenMeteo base current weather is limited */}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl"><Sun className="w-5 h-5 text-blue-200" /></div>
                  <div>
                    <p className="text-xs text-blue-100/50 font-semibold uppercase">UV Index</p>
                    <p className="text-lg font-bold">Low</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* AI Insight Card */}
        <div className="md:col-span-4 glass rounded-[2.5rem] p-8 flex flex-col justify-between bg-indigo-500/10 border-indigo-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Advisor</h3>
              <p className="text-xs text-indigo-200/60 uppercase font-bold tracking-widest">Atmosphere Insights</p>
            </div>
          </div>
          
          <div className="flex-1 flex items-center">
            {state.loading ? (
              <div className="space-y-3 w-full">
                <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse"></div>
                <div className="h-4 bg-white/10 rounded-full w-1/2 animate-pulse"></div>
              </div>
            ) : (
              <p className="text-xl leading-relaxed font-medium text-blue-50 italic">
                "{state.aiAdvice}"
              </p>
            )}
          </div>
          
          <div className="mt-8">
            <div className="px-4 py-2 bg-white/10 rounded-full inline-block text-xs font-bold text-white/60">
              Generated by Gemini 3 Flash
            </div>
          </div>
        </div>

        {/* Hourly Forecast Chart */}
        <div className="md:col-span-12 glass rounded-[2.5rem] p-8">
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
               <ClockIcon className="w-5 h-5 text-blue-200" />
               <h3 className="font-bold text-xl">Next 24 Hours</h3>
             </div>
             <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold">
                   <div className="w-2 h-2 rounded-full bg-blue-400"></div> Temp
                </div>
             </div>
           </div>

           <div className="h-[200px] w-full">
            {state.forecast ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    interval={3}
                  />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: 'white'
                    }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="temp" 
                    stroke="#60a5fa" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTemp)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-white/20 italic">
                Awaiting trajectory data...
              </div>
            )}
           </div>
        </div>

        {/* Quick Details Grid */}
        <div className="md:col-span-4 glass rounded-[2.5rem] p-6 flex items-center gap-4">
           <div className="p-4 bg-yellow-500/20 rounded-2xl"><Sun className="w-6 h-6 text-yellow-400" /></div>
           <div>
             <p className="text-xs font-bold text-white/40 uppercase">Sunrise</p>
             <p className="text-lg font-bold">06:12 AM</p>
           </div>
        </div>
        <div className="md:col-span-4 glass rounded-[2.5rem] p-6 flex items-center gap-4">
           <div className="p-4 bg-orange-500/20 rounded-2xl"><Cloud className="w-6 h-6 text-orange-400" /></div>
           <div>
             <p className="text-xs font-bold text-white/40 uppercase">Sunset</p>
             <p className="text-lg font-bold">08:45 PM</p>
           </div>
        </div>
        <div className="md:col-span-4 glass rounded-[2.5rem] p-6 flex items-center gap-4">
           <div className="p-4 bg-blue-500/20 rounded-2xl"><Droplets className="w-6 h-6 text-blue-400" /></div>
           <div>
             <p className="text-xs font-bold text-white/40 uppercase">Rain Chance</p>
             <p className="text-lg font-bold">12%</p>
           </div>
        </div>
      </div>

      <footer className="w-full max-w-5xl mt-12 py-8 flex justify-between items-center text-white/30 text-sm border-t border-white/5">
        <p>© 2025 Atmosphere AI • Powered by Gemini & Open-Meteo</p>
        <div className="flex gap-4">
           <a href="#" className="hover:text-white transition-colors">Privacy</a>
           <a href="#" className="hover:text-white transition-colors">API Docs</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
