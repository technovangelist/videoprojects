import { Glob } from "bun";
import ollama from "ollama";
const chunklengths = [5, 10, 25, 50, 100, 250, 500, 1000, 5000];
const chunkoverlaps = [0, 3, 5, 10, 25, 50, 100, 500];

function chunker(text: string, wordsPerChunk: number, overlapWords: number): string[] {
  const words = text.match(/[\w']+(?:[.,!?])?|\S/g) || [];

  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
    let endIndex = i + wordsPerChunk;
    const chunk = words.slice(i, endIndex).join(' ');
    chunks.push(chunk);

    if (endIndex >= words.length) break;
  }

  return chunks;
}

const glob = new Glob("*.txt")

for (const length of chunklengths) {
  console.log(`Chunk Length: ${length}`)
  for (const overlap of chunkoverlaps) {
    console.log(`Chunk Overlap: ${overlap}`)
    if (overlap < length) {
      const allChunks = []
      for await (const file of glob.scan("scripts/")) {
        console.log(`Text File: ${file}`)
        const scriptText = await Bun.file(`scripts/${file}`).text()
        const chunks = chunker(scriptText, length, overlap)
        for await (const chunk of chunks) {
          const embed = (await ollama.embeddings({ model: 'nomic-embed-text', prompt: chunk })).embedding
          // const embed = ""
          const chunkjson = { text: chunk, embed: embed, file: file }
          allChunks.push(chunkjson)
        }
      }
      await Bun.write(`embedding-l${length}-o${overlap}.json`, JSON.stringify(allChunks, null, 2));
    }
  }
}