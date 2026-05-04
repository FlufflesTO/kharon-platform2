import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const standardsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/standards' }),
  schema: z.object({
    code: z.string(),
    title: z.string(),
    category: z.enum(['Fire Detection','Suppression','Security & Access','Integration & Building']),
    mandate: z.string(),
    requirement: z.string(),
    operationalRisk: z.string(),
    liability: z.string()
  })
});

const solutionsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/solutions' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    coreRisk: z.string(),
    engineeringApproach: z.string(),
    standards: z.array(reference('standards')),
    lifecycle: z.object({
      design: z.string(),
      install: z.string(),
      integrate: z.string(),
      maintain: z.string(),
      validate: z.string()
    }),
    hardwarePartners: z.array(z.string()).optional()
  })
});

const environmentsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/environments' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    riskProfile: z.string(),
    mitigationStrategy: z.string(),
    governingStandards: z.array(reference('standards')),
    requiredSolutions: z.array(reference('solutions'))
  })
});

const projectsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    clientEnvironment: reference('environments'),
    completionDate: z.coerce.date(),
    operationalChallenge: z.string(),
    engineeredSolution: z.string(),
    solutionsImplemented: z.array(reference('solutions')),
    standardsValidated: z.array(reference('standards'))
  })
});
const fabricationsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/fabrications' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    useCase: z.string(),
    materialSpecs: z.string().optional(),
    coverImage: z.string().optional(),
    relatedSolutions: z.array(reference('solutions'))
  })
});
export const collections = {
  standards: standardsCollection,
  solutions: solutionsCollection,
  environments: environmentsCollection,
  projects: projectsCollection,
  fabrications: fabricationsCollection
};
