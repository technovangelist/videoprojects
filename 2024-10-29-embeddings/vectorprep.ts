import Ollama from "npm:ollama";
import { ChromaClient } from "npm:chromadb";
import { questions, models, scripts } from "./config.ts";

const client = new ChromaClient({ path: "http://localhost:8000" });

const sourceScriptLines: string[] = [];
for (const script of scripts) {
  const sourceScript = Deno.readTextFileSync(script);
  sourceScriptLines.push(
    ...(sourceScript.split("\n").filter((line) => line.trim().length > 0)),
  );
}


for await (const model of models) {
  try {
    await client.deleteCollection({ name: `${model.name}-with-questions` });
  } catch (_error) {
    console.log(`Collection ${model.name}-with-questions did not exist`);
  }
    try {
    await client.deleteCollection({ name: `${model.name}-without-questions` });
  } catch (_error) {
    console.log(`Collection ${model.name}-without-questions did not exist`);
  }
  const collectionwithquestions = await client.getOrCreateCollection({
    name: `${model.name}-with-questions`,
    metadata: { "hnsw:space": "cosine" },
  });
  const collectionwithoutquestions = await client.getOrCreateCollection({
    name: `${model.name}-without-questions`,
    metadata: { "hnsw:space": "cosine" },
  });
  const sourceembeddings: { source: string; embed: number[] }[] = [];
  const questionembeddings: { source: string; embed: number[] }[] = [];
  for await (const line of sourceScriptLines) {
    const embedresponse = await Ollama.embed({
      model: model.model,
      input: `${model.dprefix}${line}`,
    });
    sourceembeddings.push({ source: line, embed: embedresponse.embeddings[0] });
  }
    for await (const q of questions) {
    const embedresponse = await Ollama.embed({
      model: model.model,
      input: `${model.dprefix}${q}`,
    });
    questionembeddings.push({ source: q, embed: embedresponse.embeddings[0] });
  }

  const embeds = sourceembeddings.map((e) => e.embed);
  const docs = sourceembeddings.map((e) => e.source);
  const qembeds = questionembeddings.map((e) => e.embed);
  const qdocs = questionembeddings.map((e) => e.source);
  const sourceids = docs.map((_, index) => `${model.name}-source${index}`);
  const qids = qdocs.map((_, index) => `${model.name}-question${index}`);
  await collectionwithoutquestions.add({ ids: sourceids, embeddings: embeds, documents: docs });

  await collectionwithquestions.add({ ids: [...sourceids, ...qids], embeddings: [...embeds, ...qembeds], documents: [...docs, ...qdocs] });
}
