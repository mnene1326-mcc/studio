'use server';
/**
 * @fileOverview An AI agent that verifies identity by comparing a selfie with a profile photo.
 *
 * - verifyIdentity - A function that compares two photos.
 * - VerifyIdentityInput - The input type for the verifyIdentity function.
 * - VerifyIdentityOutput - The return type for the verifyIdentity function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyIdentityInputSchema = z.object({
  profilePhotoUrl: z.string().describe("The URL of the user's existing profile photo."),
  selfieDataUri: z.string().describe("A selfie taken by the user, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type VerifyIdentityInput = z.infer<typeof VerifyIdentityInputSchema>;

const VerifyIdentityOutputSchema = z.object({
  isMatch: z.boolean().describe("Whether or not the two photos appear to be the same person."),
  confidence: z.number().describe("Confidence score between 0 and 1."),
  reason: z.string().describe("A brief reason for the match determination."),
});
export type VerifyIdentityOutput = z.infer<typeof VerifyIdentityOutputSchema>;

export async function verifyIdentity(input: VerifyIdentityInput): Promise<VerifyIdentityOutput> {
  return verifyIdentityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyIdentityPrompt',
  input: { schema: VerifyIdentityInputSchema },
  output: { schema: VerifyIdentityOutputSchema },
  prompt: `You are a professional security and facial recognition assistant for MatchFlow, a dating app.

Your task is to compare the user's existing profile photo and their new verification selfie to determine if they belong to the same person.

Profile Photo: {{media url=profilePhotoUrl}}
New Selfie: {{media url=selfieDataUri}}

Analyze the facial features, bone structure, and overall appearance. Account for differences in lighting, angles, and facial expressions.

Output whether they match (isMatch), your confidence level, and a brief reason.`,
});

const verifyIdentityFlow = ai.defineFlow(
  {
    name: 'verifyIdentityFlow',
    inputSchema: VerifyIdentityInputSchema,
    outputSchema: VerifyIdentityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
