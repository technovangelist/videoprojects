import { walk } from "@std/fs";
import ollama from "ollama";
import { ChromaClient } from "chromadb";

async function main() {
  const directory = "../../scripts";
  const textData = await readTextFiles(directory);

  const chroma = new ChromaClient({ path: "http://localhost:8000" });
  const c = await chroma.listCollections();
  if (c.filter(c => c.name === "buildragwithts").length === 1) {
    await chroma.deleteCollection({ name: "buildragwithts" });
  }
  const collection = await chroma.getOrCreateCollection({ name: "buildragwithts", metadata: { "hnsw:space": "cosine" } });
  console.log(`Collection: ${collection.id}`)
  
  let overallChunkNumber = 1;
  for (const [fileName, content] of Object.entries(textData)) {
    const chunkIdentifiers: string[] = [];
    const chunks = splitIntoChunks(content);
    for (const _ of chunks) {
      chunkIdentifiers.push(`${fileName}-${overallChunkNumber}`);
      overallChunkNumber++;
    }
    const metadatas = Array(chunks.length).fill({ source: fileName });
    const embeddings = await getEmbedding(chunks);

    console.log(`Embedding ${fileName}`);
    await collection.add({ids: chunkIdentifiers, embeddings: embeddings, documents: chunks, metadatas: metadatas});
  }

  
}

main();


async function readTextFiles(
	directory: string,
): Promise<Record<string, string>> {
	const textContents: Record<string, string> = {};

	for await (const entry of walk(directory, { exts: [".txt"] })) {
		if (entry.isFile) {
			const content = await Deno.readTextFile(entry.path);
			textContents[entry.name] = content;
		}
	}
	return textContents;
}

function splitIntoChunks(text: string, chunkSize = 100): string[] {
  const words = text.match(/\S+/g) || [];
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let wordCount = 0;
  for (const word of words) {
    currentChunk.push(word);
    wordCount++;
    if (wordCount >= chunkSize) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
      wordCount = 0;
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  return chunks;
}

async function getEmbedding(chunks: string[]): Promise<number[][]> {
  const response = await ollama.embed({ model: "nomic-embed-text", input: chunks });
  return response.embeddings;
}
