import { Glob } from "bun";
import ollama from "ollama";
import { XMLParser } from "fast-xml-parser";


function timeToSeconds(time: string): number {
  const [hours, minutes, seconds] = time.split(':').map(parseFloat);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return Math.round(totalSeconds);
}

function chunkSubtitles(subs: subtitleJson[], chunkSize: number, chunkOverlap: number): subtitleJson[] {
  const chunkedSubs: subtitleJson[] = [];
  const maxSubs = subs.length - 1;
  let i = 0;
  while (i < maxSubs - chunkSize) {
    const index = i;
    const start = subs[index].start;
    const text = subs.slice(i, i + chunkSize).reduce((a, b) => { a.text += ` ${b.text}`; return a; }).text;
    chunkedSubs.push({
      start, text, embed: [], videoID: subs[index].videoID, videoTitle: subs[index].videoTitle
    })
    i = i + chunkSize - chunkOverlap;
  }

  return chunkedSubs;
}

function getTitleAndID(filename: string): { title: string, id: string } {
  let title = "";
  let id = "";
  const regex = /^(.*?)\s+\[(.*?)\]\..*?$/;
  const matches = filename.match(regex);
  if (matches && matches.length >= 3) {
    title = matches[1];
    id = matches[2];
  }
  return { title, id }
}


function parseXML(xmlstring: string, id: string, title: string): subtitleJson[] {
  const subtitles: subtitleJson[] = []
  const parser = new XMLParser({ ignoreAttributes: false });
  let st: [] = parser.parse(xmlstring).tt.body.div.p;
  for (const p of st) {
    const text = p["#text"];

    const start = timeToSeconds(p["@_begin"]);
    subtitles.push({ start, text, embed: [], videoID: id, videoTitle: title })
  }
  return subtitles
}

type subtitleJson = {
  start: number;
  text: string;
  embed: number[];
  videoID: string;
  videoTitle: string;
}

const glob = new Glob("*.ttml");
const subtitleFiles: string[] = []

const allSubtitles: subtitleJson[] = [];
for await (const file of glob.scan("./captions")) {
  let seconds = 0
  const { title, id } = getTitleAndID(file)

  console.log("Title:", title);
  console.log("ID:", id);
  const xmlSubtitlesText = (await Bun.file(`./captions/${file}`).text()).replaceAll("<br />", " ");
  const subtitles = parseXML(xmlSubtitlesText, id, title);

  const chunkedSubtitles = chunkSubtitles(subtitles, 10, 5);

  for await (const chunk of chunkedSubtitles) {
    const { embedding } = await ollama.embeddings({ model: 'nomic-embed-text', prompt: chunk.text });
    chunk.embed = embedding
  }
  allSubtitles.push(...chunkedSubtitles);

  const outputfile = "./embeddedSubtitles.json";
  await Bun.write(outputfile, JSON.stringify(allSubtitles, null, 2));

}
