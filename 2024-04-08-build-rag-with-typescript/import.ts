import ollama from "ollama";
import { ChromaClient } from "chromadb";
import { getConfig, readText } from "./utilities";
import { chunkTextBySentences } from "matts-llm-tools";

const chroma = new ChromaClient({ path: "localhost:8000" });
await chroma.deleteCollection({ name: "buildragwithtypescript" });
const collection = await chroma.getOrCreateCollection({ name: "buildragwithtypescript", metadata: { "hnsw:space": "cosine" } });

const { embedmodel, mainmodel } = getConfig();

const docstoimport = (await Bun.file("sourcedocs.txt").text()).split("\n");
for (const doc of docstoimport) {
  console.log(`\nEmbedding chunks from ${doc}\n`)
  const text = await readText(doc)
  const chunks = chunkTextBySentences(text, 7, 0);


  for await (const [index, chunk] of chunks.entries()) {
    const embed = (await ollama.embeddings({ model: embedmodel, prompt: chunk })).embedding
    await collection.add({ ids: [doc + index], embeddings: [embed], metadatas: { source: doc }, documents: [chunk] })
    process.stdout.write(".")
  }
}
