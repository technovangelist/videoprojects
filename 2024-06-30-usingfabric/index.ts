import similarity from "compute-cosine-similarity";
import ollama from "ollama";
import * as readline from "node:readline/promises";
import {
	YoutubeTranscript,
	YoutubeTranscriptDisabledError,
} from "youtube-transcript";
import type { TranscriptResponse } from "youtube-transcript";

const wisdomPrompt =
	"# IDENTITY and PURPOSE\n\nYou extract surprising, insightful, and interesting information from text content. You are interested in insights related to the purpose and meaning of life, human flourishing, the role of technology in the future of humanity, artificial intelligence and its affect on humans, memes, learning, reading, books, continuous improvement, and similar topics.\n\nTake a step back and think step-by-step about how to achieve the best possible results by following the steps below.\n\n# STEPS\n\n- Extract a summary of the content in 25 words, including who is presenting and the content being discussed into a section called SUMMARY.\n\n- Extract 20 to 50 of the most surprising, insightful, and/or interesting ideas from the input in a section called IDEAS:. If there are less than 50 then collect all of them. Make sure you extract at least 20.\n\n- Extract 10 to 20 of the best insights from the input and from a combination of the raw input and the IDEAS above into a section called INSIGHTS. These INSIGHTS should be fewer, more refined, more insightful, and more abstracted versions of the best ideas in the content. \n\n- Extract 15 to 30 of the most surprising, insightful, and/or interesting quotes from the input into a section called QUOTES:. Use the exact quote text from the input.\n\n- Extract 15 to 30 of the most practical and useful personal habits of the speakers, or mentioned by the speakers, in the content into a section called HABITS. Examples include but aren&#x27;t limited to: sleep schedule, reading habits, things the\n\n- Extract 15 to 30 of the most surprising, insightful, and/or interesting valid facts about the greater world that were mentioned in the content into a section called FACTS:.\n\n- Extract all mentions of writing, art, tools, projects and other sources of inspiration mentioned by the speakers into a section called REFERENCES. This should include any and all references to something that the speaker mentioned.\n\n- Extract the most potent takeaway and recommendation into a section called ONE-SENTENCE TAKEAWAY. This should be a 15-word sentence that captures the most important essence of the content.\n\n- Extract the 15 to 30 of the most surprising, insightful, and/or interesting recommendations that can be collected from the content into a section called RECOMMENDATIONS.\n\n# OUTPUT INSTRUCTIONS\n\n- Only output Markdown.\n\n- Write the IDEAS bullets as exactly 15 words.\n\n- Write the RECOMMENDATIONS bullets as exactly 15 words.\n\n- Write the HABITS bullets as exactly 15 words.\n\n- Write the FACTS bullets as exactly 15 words.\n\n- Write the INSIGHTS bullets as exactly 15 words.\n\n- Extract at least 25 IDEAS from the content.\n\n- Extract at least 10 INSIGHTS from the content.\n\n- Extract at least 20 items for the other output sections.\n\n- Do not give warnings or notes; only output the requested sections.\n\n- You use bulleted lists for output, not numbered lists.\n\n- Do not repeat ideas, quotes, facts, or resources.\n\n- Do not start items with the same opening words.\n\n- Ensure you follow ALL these instructions when creating your output.\n\n# INPUT\n\nINPUT:";

type VideoSearchResults = {
	id: string;
	title: string;
	channelId: string;
	channelTitle: string;
	daysSincePublished: number;
	description: string;
	relevance: number;
};

type VideoDetails = {
	videoString: string;
	title: string;
	viewCount: number;
	likeCount: number;
	commentCount: number;
	subscriberCount: number;
	score: number;
	id: string;
	description: string;
	relevance: number;
};

const getTopic = async (): Promise<string> => {
	let output = "";
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	output = await rl.question("Enter the topic: ");
	rl.close();
	return output;
};

const last6months = (): string => {
	const now = new Date();
	const pastDate = new Date(now);
	pastDate.setDate(now.getDate() - 180);
	const formattedDate = pastDate.toISOString();
	return formattedDate;
};

// compare the video found to the query to ensure that its actually relevant
// I had gotten a bunch of irrelevant videos from the yt api
const confirmRelevance = async (
	query: string,
	title: string,
	description: string,
): Promise<number> => {
	const embeddedResults = await ollama.embeddings({
		model: "nomic-embed-text",
		prompt: `Title: ${title},\n\n Description: ${description}`,
	});
	const embeddedQuery = await ollama.embeddings({
		model: "nomic-embed-text",
		prompt: query,
	});

	const relevance =
		similarity(embeddedQuery.embedding, embeddedResults.embedding) || 0;

	return relevance;
};

// You can do this with the official api but it's harder.
const videoTranscript = async (
	videoid: string,
	title: string,
): Promise<TranscriptResponse[]> => {
	let transcript: TranscriptResponse[] = [];
	try {
		transcript = await YoutubeTranscript.fetchTranscript(videoid);
	} catch (error) {
		if (error === YoutubeTranscriptDisabledError) {
			console.log(`Transcripts disabled on ${title}`);
		}
	}
	return transcript;
};

const videoSearchTool = async (
	topic: string,
	maxResults = 50,
): Promise<VideoSearchResults[]> => {
	const results: VideoSearchResults[] = [];
	const encodedTopic = encodeURIComponent(topic);
	const apiKey = Bun.env.YouTubeAPIKey;
	const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodedTopic}&type=video&key=${apiKey}&publishedAfter=${last6months()}`;

	const response = await fetch(url);
	const data = await response.json();

	if (data.items) {
		for (const item of data.items) {
			const id = item.id.videoId;
			const title = item.snippet.title;
			const channelId = item.snippet.channelId;
			const channelTitle = item.snippet.channelTitle;
			const description = item.snippet.description;
			const daysSincePublished = Math.floor(
				(new Date().getTime() -
					new Date(item.snippet.publishedAt.slice(0, 10)).getTime()) /
					(1000 * 60 * 60 * 24),
			);
			const relevance = await confirmRelevance(topic, title, description);
			if (relevance > 0.5) {
				results.push({
					id,
					title,
					channelId,
					channelTitle,
					daysSincePublished,
					description,
					relevance,
				});
			}
		}
	}

	return results;
};

const videoDetailsTool = async (
	video: VideoSearchResults,
): Promise<VideoDetails> => {
	const apiKey = Bun.env.YouTubeAPIKey;
	const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${video.id}&key=${apiKey}`;
	const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${video.channelId}&key=${apiKey}`;

	const videoResponse = await fetch(videoUrl);
	const channelResponse = await fetch(channelUrl);

	const videoData = await videoResponse.json();
	const channelData = await channelResponse.json();

	const title = videoData.items[0].snippet.title;
	const viewCount = videoData.items[0].statistics.viewCount as number;
	const likeCount = videoData.items[0].statistics.likeCount;
	const commentCount = videoData.items[0].statistics.commentCount;
	const subscriberCount = channelData.items[0].statistics.subscriberCount;
	const description = video.description;
	const relevance = video.relevance;
	const videoString = `   - Title: ${title}\n   - Channel: ${video.channelTitle}\n   - View Count: ${Number(viewCount).toLocaleString()}\n   - Days Since Published: ${video.daysSincePublished}\n   - Likes: ${Number(likeCount).toLocaleString()}\n   - Subscriber Count: ${Number(subscriberCount).toLocaleString("en-US")}\n   - Video URL: https://www.youtube.com/watch?v=${video.id}\n   - Relevance: ${video.relevance}\n`;

	// const score = (viewCount / video.daysSincePublished / subscriberCount) + (likeCount * 10) + (commentCount * 100);
	const score =
		(viewCount / subscriberCount) * 0.4 +
		(likeCount / viewCount) * 0.3 +
		(commentCount / viewCount) * 0.2 * (1 / video.daysSincePublished);

	return {
		videoString,
		title,
		viewCount,
		likeCount,
		commentCount,
		subscriberCount,
		score,
		id: video.id,
		description,
		relevance,
	};
};


await ollama.pull({ model: "m/llama3:8b-max" });
await ollama.pull({ model: "nomic-embed-text" });
const topic = await getTopic(); //just asks for the topic
const videos = await videoSearchTool(topic, 50); // get 50 results to play with
let scoredVideos: VideoDetails[] = [];
for (const video of videos) {
	const videodetails = await videoDetailsTool(video);
	scoredVideos.push(videodetails);
}

scoredVideos = scoredVideos.sort((a, b) => b.score - a.score).slice(0, 5);
for (let index = 0; index < scoredVideos.length; index++) {
	let report = "No Transcript Available";
	const video = scoredVideos[index];
	const transcript = await videoTranscript(video.id, video.title);
	console.log(`Video ${index + 1}: ${video.score}`);
	console.log(video.videoString);
	if (transcript.length > 1) {
		report = (
			await ollama.generate({
				model: "m/llama3:8b-max",
				prompt: `${wisdomPrompt}\n\nTranscript: ${transcript.map((t) => t.text).join("")}`,
			})
		).response;
	}
	console.log(`${report} \n\n`);
}
