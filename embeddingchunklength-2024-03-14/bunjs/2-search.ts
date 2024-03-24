import { Glob } from "bun";
import * as path from 'path';

const similarity = require('compute-cosine-similarity')
import ollama from "ollama";
type Embeddings = { text: string, embed: number[], file: string }[];
const questions = [
  { q: "How do you get to the end of the line in the repl", a: "keyboardcontrol.txt" },
  { q: "What is function calling?", a: "functioncalling.txt" },
  { q: "How do i output an answer from ollama in well formed JSON", a: "functioncalling.txt" },
  { q: "how can we get a response from a model to be more consistent?", a: "functioncalling.txt" },
  { q: "how do you find the list of shortcuts in the repl", a: "keyboardcontrol.txt" },
  { q: "how does ollama run", a: "ollamaarchitecture.txt" },
  { q: "how many lines in the linux shell script are for CUDA", a: "ollamaarchitecture.txt" },
  { q: "how many binaries are there", a: "ollamaarchitecture.txt" },
  { q: "what is keep alive", a: "ollamaarchitecture.txt" },
  { q: "can I surf those waves", a: "ollamaarchitecture.txt" },
  { q: "what is gpus=all", a: "ollamaindocker.txt" },
  { q: "what is the volume mount", a: "ollamaindocker.txt" },
  { q: "how do you run the client from a docker exec command", a: "ollamaindocker.txt" },
  { q: "is a container the same thing as an image", a: "ollamaindocker.txt" },
  { q: "tell me about the right way to expense nerf ammunition at datadog", a: "ollamaindocker.txt" },
  { q: "Why is GPU pass-through not possible on Mac with Docker", a: "ollamaindocker.txt" },
  { q: "How do you manage models when running Ollama in Docker", a: "ollamaindocker.txt" },
  { q: "Why might someone prefer to use Docker to run Ollama", a: "ollamaindocker.txt" },
  { q: "What is the basic command to run Ollama in Docker", a: "ollamaindocker.txt" },
  { q: "On which platforms can Ollama run", a: "ollamaarchitecture.txt" },
  { q: "How does Ollama differentiate between running as a server and as a client", a: "ollamaarchitecture.txt" },
  { q: "What is the role of the server in Ollama's architecture", a: "ollamaarchitecture.txt" },
  { q: "Can Ollama run services in the cloud", a: "ollamaarchitecture.txt" },
  { q: "Does Ollama use your interactions to improve the model automatically", a: "ollamaarchitecture.txt" },
  { q: "What is the purpose of the save command in Ollama", a: "ollamaarchitecture.txt" }
]

async function getFileNames() {
  const fileNames: string[] = []
  const glob = new Glob("embedding*.json");
  for await (const file of glob.scan(".")) {
    fileNames.push(file)
  }
  return fileNames.sort((a, b) => {
    const [la, oa] = extractAndParse(a);
    const [lb, ob] = extractAndParse(b);

    if (la !== lb) {
      return la - lb;
    }
    return oa - ob;
  })
}
function extractAndParse(filename: string): [number, number] {
  const matches = filename.match(/l(\d+)-o(\d+)/);
  if (!matches) {
    throw new Error('Filename format is incorrect');
  }
  return [parseInt(matches[1], 10), parseInt(matches[2], 10)];
}


const allFiles = await getFileNames();
for await (const q of questions) {
  console.log(q)
  let success = 0;
  let fail = 0;
  const embedquestion = (await ollama.embeddings({ model: 'nomic-embed-text', prompt: q.q })).embedding;
  const bestMatches: {file: string, score: number}[] = [];
  for await (const file of allFiles) {
    const embeddings: Embeddings = await Bun.file(file).json();

    try {
    const sortedEmbeddings = embeddings.sort((a, b) => similarity(b.embed, embedquestion) - similarity(a.embed, embedquestion));
    const simscore = similarity(sortedEmbeddings[0].embed, embedquestion)
    if (sortedEmbeddings[0].file === q.a) {
      success++;
      
      console.log(`${file}: Success (${simscore}).`)
      bestMatches.push({ file: file, score: simscore})
    } else {
      fail++;
      console.log(`${file}: Fail (${simscore}).`)
    }
    } catch {};
  }
  console.log(`Success: ${success} - Fail: ${fail}`);
  console.log(`Best 5 matches: ${bestMatches.sort((a, b) => b.score - a.score).slice(0, 5).map(m => `${m.file} - ${m.score.toFixed(3)}`).join(', ')}`)
  console.log(`worst 5 matches: ${bestMatches.sort((a, b) => a.score - b.score).slice(0, 5).map(m => `${m.file} - ${m.score.toFixed(3)}`).join(', ')}`)
  console.log('---')
}
