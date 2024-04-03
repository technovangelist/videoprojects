import { Glob } from "bun";
import ollama from "ollama";
import { chunkTextBySentences } from "matts-llm-tools"
const chunklengths = [2, 5, 8, 10, 15, 20];
const chunkoverlaps = [0, 1, 3, 5, 10];

const glob = new Glob("*.txt")
const sourcefilePath = "../../scripts"
for (const length of chunklengths) {
  console.log(`Chunk Length: ${length}`)
  for (const overlap of chunkoverlaps) {
    console.log(`Chunk Overlap: ${overlap}`)
    if (overlap < length - 1) {
      const allChunks: {text: string, embed: number[], file: string}[] = []
      for await (const file of glob.scan(sourcefilePath)) {
        console.log(`Text File: ${file}`)
        const scriptText = await Bun.file(`${sourcefilePath}/${file}`).text()
        const chunks = chunkTextBySentences(scriptText, length, overlap)
        for await (const chunk of chunks) {
          const embed = (await ollama.embeddings({ model: 'nomic-embed-text', prompt: chunk })).embedding
          const chunkjson = { text: chunk, embed: embed, file: file }
          allChunks.push(chunkjson)
        }
      }
      const jstring = JSON.stringify(allChunks);
      // console.log(jstring)
      await Bun.write(`embedding-s-l${length}-o${overlap}.json`, jstring);
    }
  }
}