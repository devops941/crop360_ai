'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Calendar,
  Layers,
  Activity,
  Gauge,
  Loader2,
  Droplet,
  ShieldCheck,
} from 'lucide-react';
import { CropCareNav, FarmerOption, FarmOption, ActiveCropContext } from '@/components/crop-care/crop-care-nav';

interface ForecastDay {
  day: string;
  date: string;
  tempMinC: number;
  tempMaxC: number;
  humidityPercent: number;
  rainfallProbabilityPercent: number;
  expectedRainMm: number;
  windSpeedKmph: number;
  sprayWindowSuitable: boolean;
  agrometAdvisory: string;
}

interface WeatherData {
  _id: string;
  district: string;
  state: string;
  pincode?: string;
  currentConditions: {
    tempC: number;
    humidityPercent: number;
    windSpeedKmph: number;
    condition: string;
  };
  gddAccumulated: number;
  dailyForecast: ForecastDay[];
  extremeWeatherAlerts: string[];
}

const DISTRICT_LIST = ['Coimbatore', 'Thanjavur', 'Madurai', 'Salem', 'Tiruchirappalli'];

export default function WeatherPage() {
  const searchParams = useSearchParams();
  const queryFarmerId = searchParams.get('farmerId') || '';
  const queryFarmId = searchParams.get('farmId') || '';
  const queryCropName = searchParams.get('cropName') || '';

  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [activeCropInfo, setActiveCropInfo] = useState<ActiveCropContext | null>(null);

  // Filter State
  const [filterFarmerId, setFilterFarmerId] = useState(queryFarmerId);
  const [filterFarmId, setFilterFarmId] = useState(queryFarmId);

  useEffect(() => {
    if (queryFarmerId) setFilterFarmerId(queryFarmerId);
    if (queryFarmId) setFilterFarmId(queryFarmId);
  }, [queryFarmerId, queryFarmId]);

  const [selectedDistrict, setSelectedDistrict] = useState('Coimbatore');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load Farmers and Farms
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [farmersRes, farmsRes] = await Promise.all([
          fetch('/api/farmers'),
          fetch('/api/farms'),
        ]);
        const fJson = await farmersRes.json();
        const fmJson = await farmsRes.json();
        if (fJson.success) setFarmers(fJson.data || []);
        if (fmJson.success) setFarms(fmJson.data || []);
      } catch (e) {
        console.error('Failed to load lookups', e);
      }
    };
    fetchLookups();
  }, []);

  // Sync selected farmer's district if known
  useEffect(() => {
    if (!filterFarmerId || farmers.length === 0) return;
    const f = farmers.find((item) => item._id === filterFarmerId);
    if (f?.district) {
      const match = DISTRICT_LIST.find(
        (d) => d.toLowerCase() === f.district?.toLowerCase()
      );
      if (match) {
        setSelectedDistrict(match);
      }
    }
  }, [filterFarmerId, farmers]);

  const [gpsActive, setGpsActive] = useState(false);

  const loadWeather = async (district?: string, lat?: number, lng?: number) => {
    try {
      setLoading(true);
      const url =
        lat !== undefined && lng !== undefined
          ? `/api/weather?lat=${lat}&lng=${lng}`
          : `/api/weather?district=${encodeURIComponent(district || selectedDistrict)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setWeather(json.data);
      }
    } catch (err) {
      console.error('Failed to load weather:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!gpsActive) {
      loadWeather(selectedDistrict);
    }
  }, [selectedDistrict, gpsActive]);

  const handleGpsDetect = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setRefreshing(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsActive(true);
          loadWeather(undefined, pos.coords.latitude, pos.coords.longitude);
          setRefreshing(false);
        },
        (err) => {
          console.warn('GPS location request error:', err);
          setRefreshing(false);
          loadWeather(selectedDistrict);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (gpsActive) {
      handleGpsDetect();
    } else {
      await loadWeather(selectedDistrict);
      setRefreshing(false);
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'sunny':
        return <Sun className="h-8 w-8 text-amber-500 animate-pulse" />;
      case 'rainy':
      case 'stormy':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      default:
        return <CloudSun className="h-8 w-8 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
              <CloudSun className="h-3.5 w-3.5" /> IMD Agromet Advisory Service
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Weather & Climate Intelligence
          </h1>
          <p className="text-sm text-stone-600 dark:text-[#a0b5a3] mt-1 max-w-2xl">
            Synoptic 7-day meteorological forecast, Accumulated Growing Degree Days (GDD), spray suitability windows, and localized rain alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/crop-protection?farmerId=${filterFarmerId || ''}&farmId=${filterFarmId || ''}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#245C3A]/30 text-[#245C3A] dark:text-emerald-400 hover:bg-[#E7EFE6] dark:hover:bg-[#193D2A] transition-colors"
          >
            &larr; Crop Protection &amp; Spray
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#245C3A] hover:bg-[#193D2A] dark:bg-[#245C3A] dark:hover:bg-[#1e4e31] shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync IMD Data
          </button>
        </div>
      </div>

      {/* Unified In-Season Navigation & Filter Bar */}
      <CropCareNav
        currentTab="weather"
        farmers={farmers}
        farms={farms}
        filterFarmerId={filterFarmerId}
        filterFarmId={filterFarmId}
        onFarmerChange={(id) => {
          setFilterFarmerId(id);
        }}
        onFarmChange={(id) => setFilterFarmId(id)}
        onResetFilter={() => {
          setFilterFarmerId('');
          setFilterFarmId('');
        }}
        onActiveCropDetected={(ctx) => {
          setActiveCropInfo(ctx);
        }}
      />

      {/* District Selector Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218]">
        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-stone-500 dark:text-[#a0b5a3]">
          <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Station / District:</span>
        </div>
        <button
          onClick={handleGpsDetect}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            gpsActive
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40'
          }`}
        >
          <MapPin className="h-3 w-3" />
          <span>{gpsActive ? '📍 Current GPS Active' : '📍 Detect My Location'}</span>
        </button>
        {DISTRICT_LIST.map((dist) => (
          <button
            key={dist}
            onClick={() => {
              setGpsActive(false);
              setSelectedDistrict(dist);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              !gpsActive && selectedDistrict === dist
                ? 'bg-[#245C3A] text-white shadow-xs'
                : 'text-stone-700 dark:text-[#CFDEC9] hover:bg-stone-100 dark:hover:bg-[#193D2A]'
            }`}
          >
            {dist}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-stone-500 dark:text-[#a0b5a3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#245C3A] dark:text-emerald-400 mb-2" />
          <p className="text-sm">Fetching station telemetry from IMD Agromet...</p>
        </div>
      ) : weather ? (
        <>
          {/* Real-time Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Current Temp</span>
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Thermometer className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
                {weather.currentConditions.tempC}°C
              </div>
              <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988] capitalize">
                {weather.currentConditions.condition.replace('_', ' ')}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Relative Humidity</span>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Droplets className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
                {weather.currentConditions.humidityPercent}%
              </div>
              <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">
                {weather.currentConditions.humidityPercent > 75 ? 'High fungal sporulation risk' : 'Optimal canopy moisture'}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Surface Wind Speed</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wind className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
                {weather.currentConditions.windSpeedKmph} km/h
              </div>
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                {weather.currentConditions.windSpeedKmph < 15 ? 'Safe spraying window open' : 'High drift hazard'}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500 dark:text-[#a0b5a3]">Accumulated GDD</span>
                <div className="h-8 w-8 rounded-lg bg-[#E7EFE6] dark:bg-[#193D2A] text-[#245C3A] dark:text-emerald-400 flex items-center justify-center">
                  <Gauge className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-[#245C3A] dark:text-emerald-400">
                {weather.gddAccumulated} °C-d
              </div>
              <p className="mt-1 text-[11px] text-stone-500 dark:text-[#889988]">Growing Degree Days (Base 10°C)</p>
            </div>
          </div>

          {/* Extreme Weather Advisories Banner */}
          {weather.extremeWeatherAlerts?.length > 0 && (
            <div className="rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Official IMD Agromet Advisory Bulletin
                    </h4>
                    <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
                      {weather.extremeWeatherAlerts.map((alert, idx) => (
                        <li key={idx}>{alert}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link
                    href={`/irrigation?farmerId=${filterFarmerId || ''}&farmId=${filterFarmId || ''}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
                  >
                    <Droplet className="h-3.5 w-3.5" />
                    <span>Adjust Irrigation</span>
                  </Link>
                  <Link
                    href={`/crop-protection?farmerId=${filterFarmerId || ''}&farmId=${filterFarmId || ''}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#245C3A] hover:bg-[#193D2A] text-white transition shadow-xs"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>IPM Prescriptions</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 7-Day Synoptic Weather Forecast */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  7-Day Agronomic Forecast &amp; Spray Suitability
                </h3>
                <p className="text-xs text-stone-500 dark:text-[#a0b5a3]">
                  Hourly wind velocities and rainfall probability calibrated against CIBRC application standards
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {weather.dailyForecast.map((day, idx) => {
                const isRainy = day.rainfallProbabilityPercent >= 50;

                return (
                  <div
                    key={day.day + idx}
                    className="rounded-2xl border border-[#E3E8DF] dark:border-[#245C3A]/30 bg-white dark:bg-[#162218] p-4 shadow-xs flex flex-col justify-between hover:border-[#245C3A]/60 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-[#245C3A]/20">
                        <div>
                          <span className="text-xs font-bold text-stone-900 dark:text-white">{day.day}</span>
                          <span className="text-[10px] text-stone-400 block">{day.date}</span>
                        </div>
                        {isRainy ? (
                          <CloudRain className="h-6 w-6 text-blue-500" />
                        ) : (
                          <Sun className="h-6 w-6 text-amber-500" />
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-lg font-bold text-stone-900 dark:text-white">
                          {day.tempMaxC}°C
                        </span>
                        <span className="text-xs text-stone-400">Min: {day.tempMinC}°C</span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex justify-between py-0.5 text-stone-600 dark:text-[#a0b5a3]">
                          <span>Rain Probability:</span>
                          <span className={`font-semibold ${isRainy ? 'text-blue-600 dark:text-blue-400' : 'text-stone-800 dark:text-stone-200'}`}>
                            {day.rainfallProbabilityPercent}% ({day.expectedRainMm} mm)
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5 text-stone-600 dark:text-[#a0b5a3]">
                          <span>Humidity:</span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">{day.humidityPercent}%</span>
                        </div>
                        <div className="flex justify-between py-0.5 text-stone-600 dark:text-[#a0b5a3]">
                          <span>Wind:</span>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">{day.windSpeedKmph} km/h</span>
                        </div>
                      </div>

                      <div className="mt-3 p-2 rounded-lg bg-stone-50 dark:bg-[#121c14] border border-[#E3E8DF] dark:border-[#245C3A]/20">
                        <p className="text-[11px] text-stone-600 dark:text-[#CFDEC9] italic leading-relaxed">
                          &quot;{day.agrometAdvisory}&quot;
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-stone-100 dark:border-[#245C3A]/20 space-y-2">
                      <div className="flex items-center justify-between">
                        {day.sprayWindowSuitable ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Favorable Spray Window
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <XCircle className="h-3.5 w-3.5" /> High Washoff/Drift Risk
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        {day.sprayWindowSuitable ? (
                          <Link
                            href={`/crop-protection?farmerId=${filterFarmerId || ''}&farmId=${filterFarmId || ''}`}
                            className="text-emerald-700 dark:text-emerald-300 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open IPM Plan</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : isRainy ? (
                          <Link
                            href={`/irrigation?farmerId=${filterFarmerId || ''}&farmId=${filterFarmId || ''}`}
                            className="text-blue-700 dark:text-blue-300 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <span>Delay Irrigation</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-stone-400">Normal Care Plan</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Cycle Completed Banner */}
          <div className="bg-gradient-to-r from-[#245C3A]/15 via-[#245C3A]/5 to-transparent dark:from-[#245C3A]/25 p-5 rounded-2xl border border-[#245C3A]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#245C3A] text-white">
                  6-STAGE WORKFLOW SYNCHRONIZED
                </span>
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                In-Season Crop Care Cycle Integrated
              </h3>
              <p className="text-xs text-stone-600 dark:text-[#a0b5a3] mt-0.5 max-w-xl">
                Crop biometrics, water budgeting, split-dose nutrition, pest detection, IPM protection, and weather forecasting work hand-in-hand.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/crop-growth?farmerId=${filterFarmerId || ''}&farmId=${filterFarmId || ''}`}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-stone-800 border border-[#245C3A]/20 text-[#245C3A] dark:text-emerald-400 hover:bg-stone-50 shadow-xs transition"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Return to Growth &amp; Canopy</span>
              </Link>
              <Link
                href={`/irrigation?farmerId=${filterFarmerId || ''}&farmId=${filterFarmId || ''}`}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#245C3A] hover:bg-[#193D2A] text-white shadow-xs transition"
              >
                <Droplet className="h-3.5 w-3.5" />
                <span>Irrigation Budget</span>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
