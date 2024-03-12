import ollama from "ollama";
const similarity = require('compute-cosine-similarity')

type subtitleJson = {
  start: number;
  text: string;
  embed: number[];
  videoID: string;
  videoTitle: string;
  similarity: number;
}

const embeds: subtitleJson[] = await Bun.file("./embeddedSubtitles.json").json();

const question = Bun.argv.slice(2).join(" ")

const embeddedPrompt = (await ollama.embeddings({ model: 'nomic-embed-text', prompt: question })).embedding;

const output = embeds.map(e => {
  const cosineSimilarity = similarity(embeddedPrompt, e.embed);
  return { ...e, similarity: cosineSimilarity }
}).sort((a, b) => b.similarity - a.similarity).slice(0, 50);

const counts: Map<string, number> = new Map();
output.forEach(o => {
  counts.set(o.videoID, (counts.get(o.videoID) || 0) + 1);
});

counts.forEach((v, k) => {
  const first = output.find((o) => o.videoID === k);
  if (first) {
    console.log(`\n${first.similarity}`)
    console.log(`${v} matches`)
    console.log(first.videoTitle)
    console.log(`https://YouTube.com/watch?v=${first.videoID}`)

  }
})


