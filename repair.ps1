$ErrorActionPreference = "Stop"

function Write-Utf8File {
  param (
    [string]$Path,
    [string]$Content
  )

  $dir = Split-Path $Path
  if ($dir -and !(Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }

  [System.IO.File]::WriteAllText($Path, $Content, [System.Text.Encoding]::UTF8)
}

Write-Utf8File "src\components\media\ImageBlock.astro" @'
---
interface Props {
  src: string;
  alt: string;
  ratio?: "wide" | "square";
}

const { src, alt, ratio = "wide" } = Astro.props;

const ratioClass = ratio === "square"
  ? "aspect-square"
  : "aspect-video";
---

<figure class="overflow-hidden border border-[var(--color-line)] bg-white">
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    class={`${ratioClass} w-full object-cover`}
  />
</figure>
'@

Write-Utf8File "src\pages\projects\index.astro" @'
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";

const projects = await getCollection("projects");
---

<BaseLayout title="Projects" description="Validated system deployments proving compliance and engineering capability.">
  <section class="kharon-container py-20">
    <h1 class="text-5xl font-bold">System Proof</h1>

    <div class="mt-10 grid gap-6 md:grid-cols-2">
      {projects.map((project) => (
        <article class="border border-[var(--color-line)] bg-white p-6">
          <h2 class="text-xl font-bold">{project.data.title}</h2>
          <p class="mt-3 text-slate-600">{project.data.operationalChallenge}</p>
        </article>
      ))}
    </div>
  </section>
</BaseLayout>
'@

Write-Utf8File "src\pages\fabrications\index.astro" @'
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import ImageBlock from "../../components/media/ImageBlock.astro";
import { getCollection } from "astro:content";

const fabrications = await getCollection("fabrications");
---

<BaseLayout title="Fabrications" description="In-house custom works resolving physical installation constraints.">
  <section class="kharon-container py-20">
    <h1 class="text-5xl font-bold">Fabrications</h1>

    <div class="mt-10 grid gap-6 md:grid-cols-2">
      {fabrications.map((fabrication) => (
        <article class="border border-[var(--color-line)] bg-white p-6">
          {fabrication.data.coverImage && (
            <div class="mb-5">
              <ImageBlock src={fabrication.data.coverImage} alt={fabrication.data.title} />
            </div>
          )}

          <h2 class="text-xl font-bold">{fabrication.data.title}</h2>
          <p class="mt-3 text-slate-600">{fabrication.data.description}</p>
          <p class="mt-4 text-sm"><strong>Use Case:</strong> {fabrication.data.useCase}</p>
        </article>
      ))}
    </div>
  </section>
</BaseLayout>
'@

Write-Utf8File "src\layouts\EnvironmentLayout.astro" @'
---
import BaseLayout from "./BaseLayout.astro";
import ComplianceList from "../components/compliance/ComplianceList.astro";

const { entry, standards, solutions } = Astro.props;
const data = entry.data;
---

<BaseLayout title={data.title} description={data.description}>
  <section class="border-b border-[var(--color-line)] bg-white">
    <div class="kharon-container py-20">
      <p class="text-sm font-bold uppercase text-blue-700">Risk Environment</p>
      <h1 class="mt-4 max-w-4xl text-5xl font-bold">{data.title}</h1>
      <p class="mt-6 max-w-3xl text-xl text-slate-600">{data.description}</p>
    </div>
  </section>

  <section class="kharon-container grid gap-8 py-16 lg:grid-cols-[1.4fr_0.8fr]">
    <article>
      <h2 class="text-2xl font-bold">Risk Profile</h2>
      <p class="mt-4 text-slate-600">{data.riskProfile}</p>

      <h2 class="mt-10 text-2xl font-bold">Mitigation Strategy</h2>
      <p class="mt-4 text-slate-600">{data.mitigationStrategy}</p>

      <div class="mt-8 text-slate-600">
        <slot />
      </div>
    </article>

    <aside class="space-y-6">
      <ComplianceList standards={standards} />

      <div class="border border-[var(--color-line)] bg-white p-6">
        <h2 class="text-xl font-bold">Required Solutions</h2>
        <div class="mt-4 space-y-3">
          {solutions.map((solution) => (
            solution && (
              <a href={`/solutions/${solution.id}`} class="block font-bold text-blue-700">
                {solution.data.title}
              </a>
            )
          ))}
        </div>
      </div>
    </aside>
  </section>
</BaseLayout>
'@

Write-Utf8File "src\pages\solutions\[slug].astro" @'
---
import { getCollection, getEntry, render } from "astro:content";
import SolutionLayout from "../../layouts/SolutionLayout.astro";

export async function getStaticPaths() {
  const entries = await getCollection("solutions");

  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { entry }
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);

const standards = await Promise.all(
  entry.data.standards.map((standard) => getEntry(standard))
);

const fabrications = await getCollection("fabrications");

const relatedFabrications = fabrications.filter((fabrication) =>
  fabrication.data.relatedSolutions.some((solution) => solution.id === entry.id)
);
---

<SolutionLayout entry={entry} standards={standards}>
  <Content />

  {relatedFabrications.length > 0 && (
    <section class="mt-16">
      <h2 class="text-2xl font-bold">Custom Fabrications</h2>

      <div class="mt-6 grid gap-6 md:grid-cols-2">
        {relatedFabrications.map((fabrication) => (
          <article class="border border-[var(--color-line)] bg-white p-6">
            <h3 class="text-xl font-bold">{fabrication.data.title}</h3>
            <p class="mt-3 text-sm text-slate-600">{fabrication.data.description}</p>
            <p class="mt-4 text-sm"><strong>Use Case:</strong> {fabrication.data.useCase}</p>
          </article>
        ))}
      </div>
    </section>
  )}
</SolutionLayout>
'@

Write-Host "Repair complete."