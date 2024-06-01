import ollama from "ollama";
import * as djson from "dirty-json";
import { getTopic, getDetails, videoSearchTool, videoDetailsTool } from "./videoSearchTool.ts";
import { titleprompt, descriptionprompt, announcementprompt } from "./prompts.ts";

// const topic = await getTopic();
// const details = await getDetails(topic);
const topic = "ai models local ollama"
const details = "You are going to create a new model for ollama. use the modelfile to create an AI model in creative ways and do interesting things using parameters, system prompt, and more.";

const videos = await videoSearchTool(topic, 50)
let scoredVideos = []
for (const video of videos) {
  const videodetails = await videoDetailsTool(video);
  scoredVideos.push(videodetails);
}

scoredVideos = scoredVideos.sort((a, b) => b.score - a.score).slice(0, 15);
scoredVideos.forEach((video, index) => {
  console.log(`Video ${index + 1}: ${video.score}`);
  console.log(video.videoString)
});

const rawtitlelist = await ollama.generate({
  model: "llama3",
  system: titleprompt, 
  format: "json",
  prompt: `topic: ${topic}\nDescription: ${details}\nSuccessful titles:\n${scoredVideos.map(video => video.title).join("\n")}. Output as JSON, using this template: {titles: ['title1', 'title2']}`,
})
const titlelist = JSON.parse(rawtitlelist.response);

console.log(`Successful Titles for the topic: ${topic}\n\n${titlelist.titles.map((s: string) => `- ${s}`).join("\n")}\n\n`);

const rawnewdescription = await ollama.generate({
  model: "llama3",
  system: descriptionprompt,
  format: "json",
  prompt: ` topic: ${topic}\nDescription: ${details}\n Output as JSON, using this template: \n\n{'output': 'description of the video'} `
});
const newdescription = djson.parse(rawnewdescription.response).output;
console.log(`Description for the video based on: ${details}\n${newdescription}\n\n`);

const rawemail = await ollama.generate({
  model: "llama3",
  system: announcementprompt,
  format: "json",
  prompt: `topic: ${topic}\nDescription: ${newdescription}\nOutput as JSON, using this template: \n{'output': 'text of the email'}`,
});
const email = djson.parse(rawemail.response).output;

console.log(`Email for the video based on the generated description: \n${email}\n\n`);







