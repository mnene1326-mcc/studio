'use server';
/**
 * @fileOverview An AI agent that suggests personalized ice-breaker messages for matched users.
 *
 * - suggestChatStarter - A function that generates ice-breaker suggestions.
 * - SuggestChatStarterInput - The input type for the suggestChatStarter function.
 * - SuggestChatStarterOutput - The return type for the suggestChatStarter function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const UserProfileSchema = z.object({
  name: z.string().describe("The name of the user."),
  interests: z.string().describe("A comma-separated list or short paragraph describing the user's interests and hobbies."),
  lookingFor: z.string().describe("What the user is looking for in the app (e.g., 'serious partner', 'casual friendship', 'networking')."),
});

const SuggestChatStarterInputSchema = z.object({
  currentUserProfile: UserProfileSchema.describe("The profile of the current user."),
  otherUserProfile: UserProfileSchema.describe("The profile of the other matched user."),
});
export type SuggestChatStarterInput = z.infer<typeof SuggestChatStarterInputSchema>;

const SuggestChatStarterOutputSchema = z.object({
  suggestions: z.array(z.string()).describe("A list of personalized ice-breaker messages."),
});
export type SuggestChatStarterOutput = z.infer<typeof SuggestChatStarterOutputSchema>;

export async function suggestChatStarter(input: SuggestChatStarterInput): Promise<SuggestChatStarterOutput> {
  return suggestChatStarterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestChatStarterPrompt',
  input: { schema: SuggestChatStarterInputSchema },
  output: { schema: SuggestChatStarterOutputSchema },
  prompt: `You are a friendly and creative dating app assistant for MatchFlow. Your goal is to suggest personalized and engaging ice-breaker messages for two users who have matched.

Consider the profiles of both users below to craft suggestions that are relevant to their interests and what they are looking for. The suggestions should encourage conversation and highlight common ground or interesting aspects of their profiles.

Current User Profile:
Name: {{{currentUserProfile.name}}}
Interests: {{{currentUserProfile.interests}}}
Looking For: {{{currentUserProfile.lookingFor}}}

Other User Profile:
Name: {{{otherUserProfile.name}}}
Interests: {{{otherUserProfile.interests}}}
Looking For: {{{otherUserProfile.lookingFor}}}

Please provide 3-5 unique and friendly ice-breaker message suggestions that {{{currentUserProfile.name}}} can send to {{{otherUserProfile.name}}}. Each suggestion should be a complete message.`,
});

const suggestChatStarterFlow = ai.defineFlow(
  {
    name: 'suggestChatStarterFlow',
    inputSchema: SuggestChatStarterInputSchema,
    outputSchema: SuggestChatStarterOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
