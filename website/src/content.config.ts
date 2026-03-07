import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const spec = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "../spec" }),
  schema: z.object({}).passthrough(),
});

export const collections = { spec };
