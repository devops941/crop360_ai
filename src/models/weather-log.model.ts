import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDailyForecast {
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

export interface IWeatherLog extends Document {
  district: string;
  state: string;
  pincode?: string;
  farmId?: mongoose.Types.ObjectId;
  recordedDate: Date;
  currentConditions: {
    tempC: number;
    humidityPercent: number;
    windSpeedKmph: number;
    condition: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy';
  };
  gddAccumulated: number;
  dailyForecast: IDailyForecast[];
  extremeWeatherAlerts: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DailyForecastSchema = new Schema<IDailyForecast>(
  {
    day: { type: String, required: true },
    date: { type: String, required: true },
    tempMinC: { type: Number, required: true },
    tempMaxC: { type: Number, required: true },
    humidityPercent: { type: Number, required: true },
    rainfallProbabilityPercent: { type: Number, required: true },
    expectedRainMm: { type: Number, required: true, default: 0 },
    windSpeedKmph: { type: Number, required: true },
    sprayWindowSuitable: { type: Boolean, default: true },
    agrometAdvisory: { type: String, required: true },
  },
  { _id: false }
);

const WeatherLogSchema = new Schema<IWeatherLog>(
  {
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      default: 'Tamil Nadu',
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      index: true,
    },
    recordedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    currentConditions: {
      tempC: { type: Number, default: 31 },
      humidityPercent: { type: Number, default: 68 },
      windSpeedKmph: { type: Number, default: 12 },
      condition: {
        type: String,
        enum: ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'stormy'],
        default: 'partly_cloudy',
      },
    },
    gddAccumulated: {
      type: Number,
      default: 1420,
    },
    dailyForecast: {
      type: [DailyForecastSchema],
      default: [],
    },
    extremeWeatherAlerts: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'weather_logs',
  }
);

export const WeatherLogModel: Model<IWeatherLog> =
  mongoose.models.WeatherLog || mongoose.model<IWeatherLog>('WeatherLog', WeatherLogSchema);
