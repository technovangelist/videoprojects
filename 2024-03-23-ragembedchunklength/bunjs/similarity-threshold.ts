// Assuming cosineSimilarity function is already available
// import { cosineSimilarity } from './your_similarity_tools';
import ollama from "ollama";
import cosinesimilarity from 'compute-cosine-similarity';
import cosSimilarity from "cos-similarity";
import { getFileNames, embeddingFileSort } from "../../sharedtools/bunjs/index";
import { createPrompt } from 'bun-promptx'

const rawquestions = [
  "What does num_ctx do?",
  "Where does Ollama store models?",
  "Is there a docker image for Ollama?",
  "What models work with different programming languages?",
  "What environment variable do I use to share the Ollama server to other clients"
]
let nos: number = 0;
type Embeddings = { text: string, embed: number[] }[];
interface TextChunk {
  sourceText: string;
  embed: number[];
  // question?: string;
  // similarity?: number;
}
interface QTextChunk {
  sourceText: string;
  embed: number[];
  question: string;
  similarity: number;
}


const questions: Embeddings = []

for await (const q of rawquestions) {
  const embedding = (await ollama.embeddings({ model: 'nomic-embed-text', prompt: q })).embedding;
  questions.push({ text: q, embed: embedding });
}

const allEmbeddingFiles = await getFileNames(".", "embedding*.json", embeddingFileSort)
const textChunks: TextChunk[] = [];
const qtextChunks: QTextChunk[] = [];
for await (const file of allEmbeddingFiles) {
  const embeddings: { text: string, embed: number[], file: string }[] = await Bun.file(file).json();
  for await (const e of embeddings) {
    textChunks.push({ sourceText: e.text, embed: e.embed })

  }
}
console.log(textChunks.length)

// const approvedScoreCounts = new Map<number, number>;

const approvedScores: number[] = [1];
let quit = false;
let lowestApproved = 1;


async function main() {
  for (const q of questions) {
    for (const chunk of textChunks) {
      if (chunk.embed.length === q.embed.length) {
        const similarity = cosinesimilarity(q.embed, chunk.embed) || 0;
        const similarity2 = cosSimilarity(q.embed, chunk.embed);
        console.log(`sim compare: ${similarity} - ${similarity2}`)
        const newchunk = { sourceText: chunk.sourceText, embed: chunk.embed, question: q.text, similarity: similarity }

        qtextChunks.push(newchunk)
      }
    }
  }

  qtextChunks.sort((a, b) => b.similarity - a.similarity)

  for (const qtc of qtextChunks) {
    if (nos < 5) {
      console.log(`text: ${qtc.sourceText}\n\nembed: ${qtc.embed}\n\nquestion: ${qtc.question}\n\nsimilarity: ${qtc.similarity}\n\n`)
      const approveSimilarity = createPrompt(`\n----\nIs this text relevant for the question: ${qtc.question}\n\n${qtc.sourceText}\nSimilarity is rated at: ${qtc.similarity}\n`);
      if (approveSimilarity.value?.toLowerCase() === 'n') {
        nos += 1;
      } else {
        nos = 0;
        lowestApproved = qtc.similarity;
      }
    } else {
      console.log(`lowest approved is: ${lowestApproved}`)
      break;
    }
  }
}



main();
console.log(qtextChunks.length)
