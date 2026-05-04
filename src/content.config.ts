import { defineCollection, reference, z } from 'astro:content';

const doctrineLifecycle = z.object({
  design: z.string().min(1),
  install: z.string().min(1),
  integrate: z.string().min(1),
  maintain: z.string().min(1),
  validate: z.string().min(1)
});

const standards = defineCollection({
  type: 'content',
  schema: z.object({
    code: z.string().min(1),
    title: z.string().min(1),
    category: z.enum(['Fire Detection','Suppression','Security & Access','Integration & Building']),
    mandate: z.string().min(1),
    requirement: z.string().min(1),
    operationalRisk: z.string().min(1),
    liability: z.string().min(1)
  })
});

const solutions = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(160),
    coreRisk: z.string().min(1),
    engineeringApproach: z.string().min(1),
    standards: z.array(reference('standards')).min(1),
    lifecycle: doctrineLifecycle,
    hardwarePartners: z.array(z.string()).optional()
  })
});

const environments = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(160),
    riskProfile: z.string().min(1),
    mitigationStrategy: z.string().min(1),
    governingStandards: z.array(reference('standards')).min(1),
    requiredSolutions: z.array(reference('solutions')).min(1)
  })
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    completionDate: z.coerce.date(),
    operationalChallenge: z.string().min(1),
    engineeredSolution: z.string().min(1),
    solutionsImplemented: z.array(reference('solutions')).min(1),
    standardsValidated: z.array(reference('standards')).min(1)
  })
});

const fabrications = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    useCase: z.string().min(1),
    materialSpecs: z.string().optional(),
    coverImage: z.string().optional(),
    relatedSolutions: z.array(reference('solutions')).min(1)
  })
});

export const collections = {
  standards,
  solutions,
  environments,
  projects,
  fabrications
};
