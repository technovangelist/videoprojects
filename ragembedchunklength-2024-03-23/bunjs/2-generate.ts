import {Ollama} from "ollama";
import { getFileNames, embeddingFileSort } from "../../sharedtools/bunjs/index";
const similarity = require('compute-cosine-similarity')

const ollama = new Ollama({host: "http://mattollama:11434"})

type Embeddings = { text: string, embed: number[], file: string, score: number }[];

const rawquestions = [
  "What does num_ctx do?",
  "Where does Ollama store models?",
  "Is there a docker image for Ollama?",
  "What models work with different programming languages?",
  "What environment variable do I use to share the Ollama server to other clients"
]

const questions: Embeddings = []

for await (const q of rawquestions) {
  const embedding = (await ollama.embeddings({ model: 'nomic-embed-text', prompt: q })).embedding;
  questions.push({ text: q, embed: embedding, file: "questions", score: 0 });
}

const allEmbeddingFiles = await getFileNames(".", "embedding*.json", embeddingFileSort)
const allAnswers: { question: string, answers: { text: string, sourcefile: string, score: number, embed: number[] }[] }[] = []

for (const q of questions) {
  console.log(q.text);
  const answers: { text: string, sourcefile: string, score: number, embed: number[] }[] = [];
  for await (const file of allEmbeddingFiles) {
    const embeddings: Embeddings = await Bun.file(file).json();
    for (const e of embeddings) {
      if (e.embed.length > 0) {
        e.score = similarity(e.embed, q.embed);
      }
    }
    const sortedEmbeddings = embeddings.filter(a => a.score > 0.5).sort((a, b) => {
      try {
        return similarity(b.embed, q.embed) - similarity(a.embed, q.embed)
      } catch (error) {
        console.log(`****\n${error}****\n${a.file}, ${a.embed.length} should be = to ${q.embed.length}`);
        return 0
      }
    });

    let acc = "";
    let ecount = 0;
    for (const e of sortedEmbeddings) {

      acc += e.text;
      if (acc.split(" ").length < 1000) {
        ecount++
      } else {
        break;
      }
    }

    const topx = sortedEmbeddings.slice(0, ecount || 1).map(e => e.text);
    const prompt = `${q.text} The following text has been extracted from a database due to it's probable relevance to the question. Use the material if it is relevant to come up with an answer and don't use anything else. The answer should be as succinct and brief as possible to answer the question :\n\n${topx.join('\n\n')}`
    console.log(`Query to the Model: \n${prompt}\n====\n`);
    console.log(`embeddings included: ${ecount || 1}`);
    try {
      const answer = (await ollama.generate({ model: 'dolphin-mixtral', prompt: prompt, stream: false })).response
      answers.push({ text: answer, sourcefile: file, score: 0, embed: [] })
      console.log(`\nAnswer\n\n${answer}`);
      console.log("\n---\n")

    } catch (error) {
      console.log(error)
    }

  }
  allAnswers.push({ question: q.text, answers: answers })

}

for await (const q of allAnswers) {
  for await (const a of q.answers) {
    console.log(`Generating embedding for ${a.text.substring(0, 30)}...`)
    const embed = (await ollama.embeddings({ model: 'nomic-embed-text', prompt: a.text })).embedding
    a.embed = embed;
  }
}
await Bun.write(`answers.json`, JSON.stringify(allAnswers, null, 2));
