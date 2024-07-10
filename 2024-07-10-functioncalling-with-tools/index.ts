import ollama from "ollama";
import {toolsString, executeFunction} from "./tools";

const promptandanswer = async (prompt: string) => {
	const response = await ollama.generate({
		model: "llama3",
		system: systemPrompt,
		prompt: prompt,
		stream: false,
		format: "json",
	});

	console.log(`\n${prompt}\n`);
 // console.log(response.response.trim());
  const responseObject = JSON.parse(response.response.trim());
  executeFunction(responseObject.functionName, responseObject.parameters);
};

const systemPrompt = `You are a helpful assistant that takes a question and finds the most appropriate tool or tools to execute, along with the parameters required to run the tool. Respond as JSON using the following schema: {"functionName": "function name", "parameters": [{"parameterName": "name of parameter", "parameterValue": "value of parameter"}]}. The tools are: ${toolsString}`;

await promptandanswer("What is the weather in London?");
await promptandanswer("What is the weather at 41.881832, -87.640406?");
await promptandanswer("who is the current ceo of tesla?");
await promptandanswer("what is located at 41.881832, -87.640406?");

