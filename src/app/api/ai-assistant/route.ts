import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { connectDB } from '@/lib/mongodb';
import { FarmModel } from '@/models/farm.model';
import { AuditLogger } from '@/lib/audit-logger';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

const AGRONOMIC_KNOWLEDGE = [
  {
    keywords: ['blast', 'pyricularia', 'fungus', 'spot', 'இலை கருகல்'],
    reply: `🌾 **ICAR/TNAU Advisory on Blast Disease:**
1. **Diagnosis**: Spindle-shaped diamond spots with grey centers on leaves or panicle necks.
2. **Organic/Bio-control**: Spray *Pseudomonas fluorescens* 0.5% WP (5g/L) during early morning hours.
3. **Chemical**: If severe, spray Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane 40% EC @ 1.5ml/L.
4. **Safety**: Observe 14 days Pre-Harvest Interval (PHI). Avoid excess top-dressing of nitrogenous urea until lesions dry out.`,
    ta: `🌾 **இலைக்கருகல் நோய் மேலாண்மை (TNAU பரிந்துரை):**
1. சூடோமோனாஸ் புளோரசன்ஸ் 0.5% WP (5 கிராம்/லிட்டர்) தெளிக்கவும்.
2. நோய் தீவிரம் அடைந்தால் ட்ரைசைக்ளசோல் 75% WP @ 0.6 கிராம்/லிட்டர் தெளிக்கவும்.
3. தழைச்சத்து (யூரியா) இடுவதை தற்காலிகமாக குறைக்கவும்.`,
  },
  {
    keywords: ['fertilizer', 'urea', 'npk', 'dosage', 'உரம்'],
    reply: `🌱 **ICAR Split Nutrient Schedule for Paddy:**
1. **Basal Stage**: 50% P (DAP) + 25% N (Urea) + 50% K (MOP) + 10kg Zinc Sulphate per acre incorporated before final leveling.
2. **Active Tillering (20-25 DAT)**: 50% N split with cono-weeding.
3. **Panicle Initiation (40-45 DAT)**: Remaining 25% N + 50% K for optimal grain weight and panicle length.`,
    ta: `🌱 **நெல் பயிருக்கான உரம் மேலாண்மை (TNAU பரிந்துரை):**
1. **அடி உரம்**: ஏக்கருக்கு 50% டி.ஏ.பி + 25% யூரியா + 50% பொட்டாஷ் + 10 கிலோ துத்தநாக சல்பேட்.
2. **தூர்கட்டும் பருவம்**: 50% யூரியா கோனோ வீடர் மூலம் களை எடுத்த பின் இடவும்.
3. **கதிர் உருவாகும் பருவம்**: மீதமுள்ள 25% யூரியா மற்றும் 50% பொட்டாஷ் இடவும்.`,
  },
  {
    keywords: ['water', 'irrigation', 'etc', 'பாசனம்'],
    reply: `💧 **AWD (Alternate Wetting and Drying) Water Management:**
1. Maintain 2-5 cm standing water during transplanting and panicle initiation.
2. During vegetative tillering, allow water to recede 15 cm below ground level before re-irrigating to conserve 30% groundwater and reduce methane emissions.`,
    ta: `💧 **காய்ச்சலும் பாய்ச்சலும் பாசன முறை (AWD):**
1. நடவு மற்றும் கதிர் வரும் தருணத்தில் 2-5 செ.மீ நீர் தேங்க வைக்கவும்.
2. தூர் கட்டும் போது நீர்மட்டம் 15 செ.மீ குறையும் வரை காத்திருந்து பாசனம் செய்தால் 30% தண்ணீர் சேமிக்கப்படும்.`,
  },
];

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { message, language = 'en', farmId } = body;

    if (!message) {
      return ApiResponse.badRequest('Message prompt is required');
    }

    // Contextual farm enrichment
    let farmContext = '';
    if (farmId) {
      const farm = await FarmModel.findById(farmId).lean();
      if (farm) {
        farmContext = ` (Context: Farm ${farm.parcelName}, Soil: ${farm.soilType || 'Clay Loam'})`;
      }
    }

    const lower = message.toLowerCase();
    const matched = AGRONOMIC_KNOWLEDGE.find((k) =>
      k.keywords.some((w) => lower.includes(w))
    );

    let answer = '';
    if (matched) {
      answer = language === 'ta' && matched.ta ? matched.ta : matched.reply;
    } else {
      answer =
        language === 'ta'
          ? `வணக்கம்! பயிர் பாதுகாப்பு, உர அளவு, பாசன கணக்கீடு அல்லது சந்தை நிலவரம் பற்றி நீங்கள் கேட்கலாம். உங்கள் பண்ணை நிலைக்கு ஏற்ற துல்லியமான விவசாய ஆலோசனைகளை Crop360 AI வழங்குகிறது.`
          : `Hello! I am your Crop360 Agronomy Assistant. Based on ICAR and TNAU agronomy protocols${farmContext}, I can assist with:
- Split fertilizer schedules (Basal, Tillering, Panicle initiation)
- Pest and blight diagnostics (Blast, Stem borer, Armyworm)
- AWD water budgeting and ETc calculations
- Localized mandi price benchmarks and MSP guidance.
Please feel free to ask your field-specific question!`;
    }

    // Audit Log
    try {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = token ? await verifyAuthToken(token) : null;
      await AuditLogger.record({
        entityType: 'AIAssistantQuery',
        entityId: 'ai-session',
        action: 'CREATE',
        performedBy: {
          userId: session?.userId,
          userName: session?.name || 'Farmer',
          userRole: session?.role || 'farmer',
        },
        after: { query: message, language },
      });
    } catch {
      // Non-blocking
    }

    return ApiResponse.success({ answer, timestamp: new Date() });
  } catch (error) {
    return ApiResponse.serverError('Failed to generate AI agronomic response', error);
  }
}
