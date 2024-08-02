import ollama from "ollama";

async function WeatherFromCity(city: string) {
	const output = await fetch(
		`https://nominatim.openstreetmap.org/search?q=${city}&format=json`,
	);
	const json = await output.json();
	const lat = json[0].lat;
	const lon = json[0].lon;
	return await WeatherFromLatLon(lat, lon);
}

async function WeatherFromLatLon(latitude: string, longitude: string) {
	const output = await fetch(
		`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=1`,
	);

	const json = await output.json();
	return `${json.current.temperature_2m} degrees Farenheit`;
}

const model = "firefunction-v2";
const prompt = "What is the weather in Paris?";
const messages = [{ role: "user", content: prompt }];

const response = await ollama.chat({
	model: model,
	messages: messages,
	stream: false,
	tools: [
		{
			type: "function",
			function: {
				name: "WeatherFromCity",
				description: "Get the weather for a given city",
				parameters: {
					type: "object",
					properties: {
						city: {
							type: "string",
							description: "The city to get the weather for",
						},
					},
					required: ["city"],
				},
			},
		},
		{
			type: "function",
			function: {
				name: "WeatherFromLatLon",
				description: "Get the weather for a specific latitude and longitude",
				parameters: {
					type: "object",
					properties: {
						latitude: {
							type: "string",
							description: "latitude for the location",
						},
						longitude: {
							type: "string",
							description: "longitude for the location",
						},
					},
					required: ["latitude", "longitude"],
				},
			},
		},
	],
});

messages.push(response.message);

if (!response.message.tool_calls || response.message.tool_calls.length === 0) {
	// console.log("The model didn't use the function. Its response was:");
	// console.log(response.message.content);
} else {
	for (const t of response.message.tool_calls) {
		// console.log(
		// 	`The model used the function ${t.function.name} with parameters ${JSON.stringify(t.function.arguments)}`,
		// );
		let functionoutput = "";
		switch (t.function.name) {
			case "WeatherFromCity":
				functionoutput = await WeatherFromCity(t.function.arguments.city);
				break;
			case "WeatherFromLatLon":
				functionoutput = await WeatherFromLatLon(
					t.function.arguments.latitude,
					t.function.arguments.longitude,
				);
				break;
		}
		messages.push({ role: "tool", content: functionoutput });
		const response2 = await ollama.chat({
			model: model,
			messages: messages,
			stream: false,
		});

		console.log(JSON.stringify(messages, null, 2));
		console.log(response2.message.content);
    console.log(`This used the model: ${model}`);
	}

	// console.log(response.message.content);
}
