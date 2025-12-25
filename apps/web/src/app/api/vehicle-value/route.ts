import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { make, model, year, mileage, condition, postalCode } = body;

    if (!make || !model || !year) {
      return NextResponse.json(
        { error: 'Make, model, and year are required' },
        { status: 400 }
      );
    }

    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.log('No Gemini API key found, using fallback calculation');
      return NextResponse.json(getFallbackValuation(make, model, year, mileage, condition));
    }

    // Try different model names in order of preference
    const modelNames = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
    
    for (const modelName of modelNames) {
      try {
        const geminiModel = genAI.getGenerativeModel({ model: modelName });

        const prompt = `You are a car valuation expert. Based on the following vehicle details, provide an estimated market value in Canadian dollars.

Vehicle Details:
- Make: ${make}
- Model: ${model}
- Year: ${year}
- Mileage: ${mileage ? `${mileage.toLocaleString()} km` : 'Not specified'}
- Condition: ${condition || 'Not specified'}
- Location: ${postalCode ? `Postal Code ${postalCode}, Canada` : 'Canada'}

Please respond ONLY with a valid JSON object in the following format (no markdown, no code blocks, just the raw JSON):
{
  "estimatedValue": 25000,
  "lowRange": 22000,
  "highRange": 28000,
  "confidence": "high",
  "explanation": "Brief explanation of the valuation",
  "factors": ["factor1", "factor2", "factor3"]
}

The estimatedValue, lowRange, and highRange should be numbers representing Canadian dollars.
The confidence should be "high", "medium", or "low".
The explanation should be a brief 1-2 sentence explanation.
The factors should be an array of 3-5 key factors that influenced the valuation.`;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse the JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const valuation = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            ...valuation,
            source: 'ai',
            model: modelName,
          });
        }
      } catch (modelError: any) {
        console.log(`Model ${modelName} failed:`, modelError.message);
        // Continue to next model
        continue;
      }
    }

    // If all AI models fail, use fallback
    console.log('All AI models failed, using fallback calculation');
    return NextResponse.json(getFallbackValuation(make, model, year, mileage, condition));

  } catch (error: any) {
    console.error('Vehicle valuation error:', error);
    return NextResponse.json(
      { error: 'Failed to get vehicle valuation', details: error.message },
      { status: 500 }
    );
  }
}

function getFallbackValuation(
  make: string,
  model: string,
  year: number,
  mileage?: number,
  condition?: string
) {
  // Basic valuation algorithm
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  // Base prices for different makes (simplified)
  const basePrices: Record<string, number> = {
    'Toyota': 35000,
    'Honda': 32000,
    'Ford': 38000,
    'BMW': 55000,
    'Mercedes-Benz': 60000,
    'Audi': 52000,
    'Tesla': 65000,
    'Chevrolet': 40000,
    'Hyundai': 28000,
    'Kia': 27000,
    'Lexus': 50000,
    'Porsche': 90000,
    'default': 30000,
  };

  let basePrice = basePrices[make] || basePrices['default'];
  
  // Depreciation: ~15% first year, ~10% subsequent years
  let depreciatedValue = basePrice;
  if (age >= 1) {
    depreciatedValue *= 0.85; // First year
    depreciatedValue *= Math.pow(0.90, Math.min(age - 1, 10)); // Subsequent years
  }

  // Mileage adjustment (average 20,000 km/year)
  if (mileage) {
    const expectedMileage = age * 20000;
    const mileageDiff = mileage - expectedMileage;
    // Adjust by ~$0.10 per km difference
    depreciatedValue -= mileageDiff * 0.10;
  }

  // Condition adjustment
  const conditionMultipliers: Record<string, number> = {
    'Excellent': 1.10,
    'Good': 1.0,
    'Fair': 0.85,
    'Poor': 0.70,
  };
  const conditionMultiplier = conditionMultipliers[condition || 'Good'] || 1.0;
  depreciatedValue *= conditionMultiplier;

  // Ensure minimum value
  depreciatedValue = Math.max(depreciatedValue, 2000);

  const estimatedValue = Math.round(depreciatedValue / 100) * 100;
  const lowRange = Math.round(estimatedValue * 0.85 / 100) * 100;
  const highRange = Math.round(estimatedValue * 1.15 / 100) * 100;

  return {
    estimatedValue,
    lowRange,
    highRange,
    confidence: 'medium',
    explanation: `This estimate is based on the ${year} ${make} ${model}'s age, condition, and typical market depreciation patterns.`,
    factors: [
      `Vehicle age: ${age} years`,
      `Brand value retention for ${make}`,
      mileage ? `Mileage: ${mileage.toLocaleString()} km` : 'Average mileage assumed',
      `Condition: ${condition || 'Good'}`,
      'Current Canadian market trends',
    ],
    source: 'calculation',
  };
}


