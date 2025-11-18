import OpenAI from 'openai';
import type { AppEnv } from '../config/env';

export type ModerationResult = {
  flagged: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
};

export type ModerationService = ReturnType<typeof createModerationService>;

export const createModerationService = (env: AppEnv) => {
  const client = env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
    : null;

  const moderateText = async (text: string): Promise<ModerationResult> => {
    if (!client) {
      return { flagged: false, categories: {}, scores: {} };
    }

    const response = await client.moderations.create({
      model: 'omni-moderation-latest',
      input: text
    });

    const result = response.results?.[0];
    return {
      flagged: Boolean(result?.flagged),
      categories: result?.categories ?? {},
      scores: result?.category_scores ?? {}
    };
  };

  return {
    moderateText
  };
};
