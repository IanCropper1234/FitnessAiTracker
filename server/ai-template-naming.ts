import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TemplateNamingData {
  muscleGroups: string[];
  exerciseCount: number;
  totalSets: number;
  specialMethods: string[];
  sessionDuration: number;
  experienceLevel: string;
  primaryGoals: string[];
  isWeeklyPlan: boolean;
}

export async function generateAITemplateName(data: TemplateNamingData): Promise<string> {
  try {
    const prompt = `You are a fitness expert creating concise, descriptive names for workout templates. Create a professional workout template name based on the following data:

Muscle Groups: ${data.muscleGroups.join(', ')}
Exercise Count: ${data.exerciseCount}
Total Sets: ${data.totalSets}
Special Methods: ${data.specialMethods.join(', ') || 'None'}
Session Duration: ${data.sessionDuration} minutes
Experience Level: ${data.experienceLevel}
Primary Goals: ${data.primaryGoals.join(', ')}
Is Weekly Plan: ${data.isWeeklyPlan}

Guidelines:
- Keep it under 50 characters
- Be descriptive but concise
- Include muscle groups (max 2-3)
- Include special methods if present (abbreviate if needed)
- Include experience level if not intermediate
- Make it sound professional and appealing

Examples of good names:
- "Upper Body Power (Drop Sets)"
- "Push/Pull Split - Advanced"
- "Full Body MyoRep Protocol"
- "Chest & Triceps Volume"
- "4-Day Hypertrophy Program"

Response format: {"templateName": "your generated name"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert fitness coach and template naming specialist. Generate concise, professional workout template names."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 100
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.templateName || generateFallbackName(data);
  } catch (error) {
    console.error('AI template naming failed:', error);
    return generateFallbackName(data);
  }
}

function generateFallbackName(data: TemplateNamingData): string {
  const muscleGroups = data.muscleGroups.slice(0, 2);
  let name = '';
  
  if (data.isWeeklyPlan) {
    name = `Weekly ${muscleGroups.join(' & ')} Program`;
  } else {
    name = `${muscleGroups.join(' & ')} Workout`;
  }
  
  if (data.specialMethods.length > 0) {
    name += ` (${data.specialMethods[0]})`;
  }
  
  if (data.experienceLevel !== 'intermediate') {
    name += ` - ${data.experienceLevel.charAt(0).toUpperCase() + data.experienceLevel.slice(1)}`;
  }
  
  return name;
}