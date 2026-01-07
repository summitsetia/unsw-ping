import societies from "../societies.json" with { type: "json" };
import { cosineSimilarity, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const societiesList = societies.map((s) => s.title);

const { embeddings: societiesEmbeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: societiesList,
});

function bestSimilarityForSociety(
  societyEmbedding: number[],
  interestsEmbeddings: number[][]
) {
  let bestScore: number | null = null;

  for (const interestEmbedding of interestsEmbeddings) {
    const score = cosineSimilarity(interestEmbedding, societyEmbedding);

    if (bestScore === null || score > bestScore) {
      bestScore = score;
    }
  }

  return bestScore ?? -1;
}

export const findSocieties = async (interests: string[]) => {
  if (!interests.length) return [];

  const { embeddings: interestsEmbeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: interests,
  });

  const scored: { society: (typeof societies)[number]; score: number }[] = [];

  for (let i = 0; i < societiesEmbeddings.length; i++) {
    const societyEmbedding = societiesEmbeddings[i];

    const score = bestSimilarityForSociety(societyEmbedding, interestsEmbeddings);

    scored.push({
      society: societies[i],
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 5);
};
