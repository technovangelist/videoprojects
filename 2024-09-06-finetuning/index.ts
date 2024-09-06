import ollama from "ollama";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

async function readTextFilesFromDirectory(directoryPath: string) {
	try {
		const files = await readdir(directoryPath);
		const fileContents = [];
		for (const file of files) {
			const filePath = join(directoryPath, file);
      const topic = file.substring(0, file.indexOf(" - MainVideo.md"));
			try {
				const content = await readFile(filePath, "utf-8");
				const scriptStart = content.indexOf("## Script\n");
				if (scriptStart > -1) {
					fileContents.push({
						topic: topic,
						content: content.slice(scriptStart + 10),
					});
				} else {
					fileContents.push({ topic: topic, content });
				}
			} catch (error) {
				console.error(`Error reading file ${file}:`, error.message);
			}
		}

		return fileContents;
	} catch (error) {
		console.error("Error reading directory:", error.message);
		return [];
	}
}
const fileParagraphs = []
// Example usage
const directoryPath =
	"/Users/matt/documents/MainVault/Content/deliverables/main";
const fileContents = await readTextFilesFromDirectory(directoryPath);
for (const file of fileContents) {
  const paragraphs = file.content.split("\n").filter(paragraph => paragraph.trim().length > 100)
  for (const paragraph of paragraphs) {
    const summresult = await ollama.generate({model: "llama3.1", prompt: `Summarize just the meaning of the paragraph without any extra text. Do not describe the author or what they said. Now convert that summary to an instruction for the user to write the original paragraph and that it pertains to ${file.topic}. The instruction should be self standing and not rely on anything else.: ${paragraph}\n\nOutput as JSON using the following format: {"instruction": the instruction, "summary": the summary}`, format: "json"})
    // console.log(`---${file.topic}\n${paragraph}\n---\n${summresult.response}\n\n`)
    const instruction = JSON.parse(summresult.response).instruction
    const summary = JSON.parse(summresult.response).summary
    const jsonl = {"text": `[INST]${instruction}[/INST]${paragraph}`}
    console.log(jsonl)
    fileParagraphs.push(JSON.stringify(jsonl))
    }
}

const count = fileParagraphs.length
Bun.write("data/train.jsonl", fileParagraphs.slice(0, count/5*3).join("\n"));
Bun.write("data/valid.jsonl", fileParagraphs.slice(count/5*3, count/5*4).join("\n"));
Bun.write("data/test.jsonl", fileParagraphs.slice(count/5*4, count).join("\n"));
