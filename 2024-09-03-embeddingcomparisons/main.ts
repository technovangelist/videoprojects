import turndown from "npm:turndown";
import { exists } from "https://deno.land/std@0.197.0/fs/mod.ts";
import ollama from "ollama";
import { LocalIndex } from "vectra";

const mainModel = "llama3.1";
const sourceDocURL = "https://arxiv.org/html/2408.17024v1";
const sourceDocCharLimit = 50000;

const questions = [
	"What is Inkuba-Instruct?",
	"What is InkubaLM",
	"How many parameters does TinyLlama have?",
];

type answer = {
	question: string;
	answer: string;
	embedmodel: string;
	scores: string[];
};
const emodels = [
	"nomic-embed-text",
	"mxbai-embed-large",
	"all-minilm",
	"snowflake-arctic-embed",
	"bge-m3",
	"bge-large",
	mainModel,
];
const answers: answer[] = [];

for await (const q of questions) {
	console.log(`Pre Embedding Question: ${q}`);
	answers.push({
		question: q,
		answer: await askQuestion(q, ""),
		embedmodel: "none",
		scores: [],
	});
}
await cleanUp();

const sourceDoc = await (await fetch(sourceDocURL)).text();
const converter = new turndown();
const sourceDocMD = converter.turndown(sourceDoc);
console.log(
	`Aquired Source Doc: ${sourceDocMD.length} characters, limiting to ${sourceDocCharLimit} characters`,
);
const sourceDocChunks = splitTextIntoChunks(
	sourceDocMD,
	1000,
	sourceDocCharLimit,
);

await pullModels(emodels);

const vdbs = emodels.map((m) => ({ name: m, index: new LocalIndex(`./${m}`) }));

for await (const vdb of vdbs) {
	if (!(await vdb.index.isIndexCreated())) {
		await vdb.index.createIndex();
	}
	console.log(`\nAdding content to ${vdb.name}`);
	await addItems(sourceDocChunks, vdb.name, vdb.index);

	for await (const q of questions) {
		const embedding = (await getEmbedding(q, vdb.name))[0];
		const scoreresults = await vdb.index.queryItems(embedding, 20);
		const results = await vdb.index.queryItems(embedding, 10);
		const scores = scoreresults.map((r) => r.score.toFixed(2));
		const resulttext = results
			.map((r) => r.item.metadata.text)
			.join("\n\n---\n");
		console.log(`Answering Question: ${q}`);
		const a = await askQuestion(q, resulttext);
		answers.push({
			question: q,
			answer: a,
			embedmodel: vdb.name,
			scores: scores,
		});
	}
}

console.log("Processing Complete\n\nAnswers:\n");
for await (const q of questions) {
	console.log(`\n===\nQuestion: ${q}\n`);
	const qa = answers.filter((a) => a.question === q);

	for (const a of qa) {
		console.log(`---\nModel: ${a.embedmodel}\n`);
		console.log(`${a.answer}\n`);
		if (a.scores.length > 0) {
			console.log(`Scores: ${a.scores.length}:: ${a.scores.join(",")}\n`);
		}
	}
}

async function cleanUp() {
	for (const m of emodels) {
		if (await exists(`./${m}`)) {
			await Deno.remove(`./${m}`, { recursive: true });
		}
	}
}
async function getEmbedding(
	text: string[] | string,
	emodel: string,
): Promise<number[][]> {
	const output = await ollama.embed({ model: emodel, input: text });
	return output.embeddings;
}

async function addItems(text: string[], emodel: string, vdb: LocalIndex) {
	const t0 = performance.now();
	const embeddings = await getEmbedding(text, emodel);
	const embedtime = performance.now() - t0;
	console.log(
		`Batch Embedding Time for first ${sourceDocCharLimit} characters: ${(embedtime / 1000).toFixed(2)}s`,
	);
	const t1 = performance.now();
	for await (const t of text) {
		await getEmbedding(t, emodel);
	}
	const embedtime2 = performance.now() - t1;
	console.log(
		`Non-Batch Embedding Time for first ${sourceDocCharLimit} characters: ${(embedtime2 / 1000).toFixed(2)}s`,
	);
	for (const [index, e] of embeddings.entries()) {
		await vdb.insertItem({
			vector: e,
			metadata: { text: text[index] },
		});
	}
}

async function pullModels(emodels: string[]) {
	const { models: localmodels } = await ollama.list();
	const models2dl = emodels.filter(
		(model) =>
			!localmodels.find(
				(localmodel) => localmodel.name.split(":")[0] === model,
			),
	);
	for (const model of models2dl) {
		console.log(`Pulling ${model}`);
		await ollama.pull({ model: model });
	}
	console.log("All models pulled");
}

function splitTextIntoChunks(
	text: string,
	chunkSize = 500,
	limit = 50000,
): string[] {
	const limitedText = text.slice(0, limit);
	const chunks: string[] = [];
	let index = 0;
	while (index < limitedText.length) {
		let endIndex = Math.min(index + chunkSize, limitedText.length);
		if (endIndex < limitedText.length) {
			const lastSpace = limitedText.lastIndexOf(" ", endIndex);
			if (lastSpace > index) {
				endIndex = lastSpace;
			}
		}

		chunks.push(limitedText.slice(index, endIndex).trim());
		index = endIndex + 1;
	}

	return chunks;
}

async function askQuestion(question: string, relatedtext: string) {
	let prompt = question;
	if (relatedtext.length > 0) {
		prompt = `${question} Use only the information in the following text to answer the question: ${relatedtext}`;
	}
	const output = await ollama.generate({
		model: mainModel,
		prompt: prompt,
		options: { num_ctx: 8192 },
	});
	return output.response;
}
