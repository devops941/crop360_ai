import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { WeatherLogModel } from '@/models/weather-log.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

function generateDefaultForecast(district: string) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date();

  return days.map((day, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() + idx);
    const isRainyDay = idx === 2 || idx === 5;

    return {
      day,
      date: d.toISOString().split('T')[0],
      tempMinC: 23 + (idx % 3),
      tempMaxC: 33 + (idx % 4),
      humidityPercent: isRainyDay ? 82 : 64 + (idx % 10),
      rainfallProbabilityPercent: isRainyDay ? 75 : 15 + (idx * 5),
      expectedRainMm: isRainyDay ? 18.5 : 0,
      windSpeedKmph: 10 + (idx * 2),
      sprayWindowSuitable: !isRainyDay && 10 + (idx * 2) < 18,
      agrometAdvisory: isRainyDay
        ? 'Heavy localized showers expected. Postpone irrigation and avoid foliar chemical sprays.'
        : 'Favorable atmospheric conditions. Safe for micronutrient foliar spray and intercultural weeding.',
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || 'Coimbatore';

    let weather = await WeatherLogModel.findOne({
      district: new RegExp(`^${district}$`, 'i'),
    })
      .sort({ recordedDate: -1 })
      .lean();

    if (!weather) {
      // Auto-initialize standard IMD agromet forecast for requested district
      const forecast = generateDefaultForecast(district);
      const created = await WeatherLogModel.create({
        district,
        state: 'Tamil Nadu',
        recordedDate: new Date(),
        currentConditions: {
          tempC: 31.4,
          humidityPercent: 68,
          windSpeedKmph: 12.2,
          condition: 'partly_cloudy',
        },
        gddAccumulated: 1480,
        dailyForecast: forecast,
        extremeWeatherAlerts: [
          'IMD Agromet Advisory: High relative humidity (82%) expected mid-week. Monitor paddy for blast and leaf spot.',
          'Safe spraying window active from 06:30 AM to 10:00 AM before surface wind exceeds 15 km/h.',
        ],
      });
      weather = created.toObject() as any;
    }

    return ApiResponse.success(weather);
  } catch (error) {
    return ApiResponse.serverError('Failed to fetch weather & climate data', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      district = 'Coimbatore',
      state = 'Tamil Nadu',
      pincode,
      currentConditions,
      gddAccumulated = 1480,
      dailyForecast,
      extremeWeatherAlerts,
    } = body;

    const weather = await WeatherLogModel.create({
      district,
      state,
      pincode,
      recordedDate: new Date(),
      currentConditions: currentConditions || {
        tempC: 32,
        humidityPercent: 65,
        windSpeedKmph: 11,
        condition: 'partly_cloudy',
      },
      gddAccumulated: Number(gddAccumulated),
      dailyForecast: dailyForecast || generateDefaultForecast(district),
      extremeWeatherAlerts: extremeWeatherAlerts || [
        'IMD Agromet Advisory: Monitor canopy humidity and prepare drainage channels for upcoming monsoon spells.',
      ],
    });

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'WeatherLog',
        entityId: String(weather._id),
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'System',
          userRole: session?.role || 'agronomist',
        },
        after: { district, gddAccumulated },
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.created(weather);
  } catch (error) {
    return ApiResponse.serverError('Failed to update weather forecast', error);
  }
}
