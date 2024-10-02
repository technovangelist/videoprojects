import { Readability } from "jsr:@paoramen/cheer-reader";

import ollama from "npm:ollama";
import * as cheerio from "npm:cheerio@1.0.0";

const searchUrl = Deno.env.get("SEARCH_URL");
const query = Deno.args.join(" ");

console.log(`Query: ${query}`);
const urls = await getNewsUrls(query);
const alltexts = await getCleanedText(urls);
await answerQuery(query, alltexts);

async function getNewsUrls(query: string) {
	const searchResults = await fetch(`${searchUrl}?q=${query}&format=json`);
	const searchResultsJson: { results: Array<{ url: string }> } =
		await searchResults.json();
	const urls = searchResultsJson.results
		.map((result) => result.url)
		.slice(0, 1);
	return urls;
}

async function getCleanedText(urls: string[]) {
	const texts = [];
	for await (const url of urls) {
		const getUrl = await fetch(url);
		console.log(`Fetching ${url}`);
		const html = await getUrl.text();
		const text = htmlToText(html);
		texts.push(`Source: ${url}\n${text}\n\n`);
	}
	return texts;
}

function htmlToText(html: string) {
	const $ = cheerio.load(html);

  // Thanks to the comment on the YouTube video from @eliaspereirah for suggesting 
  // using Mozilla Readability. I used a variant that made it easier to use with 
  // cheerio. Definitely simplifies things
		const text = new Readability($).parse();

  // What I had before

	// $("script, source, style, head, img, svg, a, form, link, iframe").remove();
	// $("*").removeClass();
	// $("*").each((_, el) => {
	// 	if (el.type === "tag" || el.type === "script" || el.type === "style") {
	// 		for (const attr of Object.keys(el.attribs || {})) {
	// 			if (attr.startsWith("data-")) {
	// 				$(el).removeAttr(attr);
	// 			}
	// 		}
	// 	}
	// });
	// const text = $("body").text().replace(/\s+/g, " ");

	return text.textContent;
}

async function answerQuery(query: string, texts: string[]) {
	const result = await ollama.generate({
		model: "llama3.2:1b",
		prompt: `${query}. Summarize the information and provide an answer. Use only the information in the following articles to answer the question: ${texts.join("\n\n")}`,
		stream: true,
		options: {
			num_ctx: 16000,
		},
	});
	for await (const chunk of result) {
		if (chunk.done !== true) {
			await Deno.stdout.write(new TextEncoder().encode(chunk.response));
		}
	}
}
