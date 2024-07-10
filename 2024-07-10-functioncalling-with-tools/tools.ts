export type Tool = {
	name: string;
	description: string;
	parameters: ToolParameter[];
};

type ToolParameter = {
	name: string;
	description: string;
	type: string;
	required: boolean;
};

type FunctionParameter = {
	parameterName: string;
	parameterValue: string;
};


const cityToLatLonTool: Tool = {
	name: "CityToLatLon",
	description: "Get the latitude and longitude for a given city",
	parameters: [
		{
			name: "city",
			description: "The city to get the latitude and longitude for",
			type: "string",
			required: true,
		},
	],
};

const weatherFromLatLonTool: Tool = {
	name: "WeatherFromLatLon",
	description: "Get the weather for a location",
	parameters: [
		{
			name: "latitude",
			description: "The latitude of the location",
			type: "number",
			required: true,
		},
		{
			name: "longitude",
			description: "The longitude of the location",
			type: "number",
			required: true,
		},
	],
};

const latlonToCityTool: Tool = {
	name: "LatLonToCity",
	description: "Get the city name for a given latitude and longitude",
	parameters: [
		{
			name: "latitude",
			description: "The latitude of the location",
			type: "number",
			required: true,
		},
		{
			name: "longitude",
			description: "The longitude of the location",
			type: "number",
			required: true,
		},
	],
};

const webSearchTool: Tool = {
	name: "WebSearch",
	description: "Search the web for a query",
	parameters: [
		{
			name: "query",
			description: "The query to search for",
			type: "string",
			required: true,
		},
	],
};

const weatherFromLocationTool: Tool = {
	name: "WeatherFromLocation",
	description: "Get the weather for a location",
	parameters: [
		{
			name: "location",
			description: "The location to get the weather for",
			type: "string",
			required: true,
		},
	],
};

async function CityToLatLon(city: string) {
	const output = await fetch(
		`https://nominatim.openstreetmap.org/search?q=${city}&format=json`,
	);
	const json = await output.json();
	return [json[0].lat, json[0].lon];
}
async function LatLonToCity(latitude: string, longitude: string) {
	const output = await fetch(
		`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
	);
	const json = await output.json();
	console.log(json.display_name);
}



async function WeatherFromLatLon(latitude: string, longitude: string) {
	const output = await fetch(
		`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=1`,
	);

	const json = await output.json();
  console.log(`${json.current.temperature_2m} degrees Farenheit`);
}

async function WeatherFromLocation(location: string) {
  const latlon = await CityToLatLon(location);
  await WeatherFromLatLon(latlon[0], latlon[1]);
}

async function WebSearch(query: string) {
	const output = await fetch(
		`http://localhost:3333/search?q=${query}&format=json`,
	);
	const json = await output.json();
	console.log(`${json.results[0].title}\n${json.results[0].content}\n`);
}

export const toolsString = JSON.stringify(
	{
		tools: [
			weatherFromLocationTool,
			weatherFromLatLonTool,
			webSearchTool,
			latlonToCityTool,
		],
	},
	null,
	2,
);

function getValueOfParameter(
	parameterName: string,
	parameters: FunctionParameter[],
) {
	return parameters.filter((p) => p.parameterName === parameterName)[0]
		.parameterValue;
}

export async function executeFunction(
	functionName: string,
	parameters: FunctionParameter[],
) {
	switch (functionName) {
		case "WeatherFromLocation":
			return await WeatherFromLocation(getValueOfParameter("location", parameters));
		case "WeatherFromLatLon":
			return await WeatherFromLatLon(
				getValueOfParameter("latitude", parameters),
				getValueOfParameter("longitude", parameters),
			);
		case "WebSearch":
			return await WebSearch(getValueOfParameter("query", parameters));
		case "LatLonToCity":
			return await LatLonToCity(
				getValueOfParameter("latitude", parameters),
				getValueOfParameter("longitude", parameters),
			);
	}
}
