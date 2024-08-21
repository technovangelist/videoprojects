import ollama from "ollama";
import inquirer, { QuestionCollection} from "inquirer";

const qrepeat = 5;

const allmodels = await ollama.list();

function processModelNames(
	allmodels: { name: string; details: { parameter_size: string } }[],
) {
	// Extract names and process
	const names = allmodels
		.map((model) => `${model.name}:${model.details.parameter_size}`)
		.map((name) => {
      const splitname = name.split(":")
      return `${splitname[0]} - ${splitname[2]}`
    } )
		.filter((value, index, self) => self.indexOf(value) === index)
		.sort();
	return names;
}

async function getSelectedModel(names: string[]) {
	const questions: QuestionCollection = [
		{
			type: "list",
			name: "selectedName",
			message: "Select a model name:",
			choices: names,
		},
	];
	const answer = await inquirer.prompt(questions);
	return answer.selectedName;
}

async function getSelectedQuants(name: string, size: string,  allmodels: { name: string, details: { parameter_size: string, quantization_level: string}}[]) {
  const modelNames = allmodels.filter((model) => model.name.split(":")[0] === name && model.details.parameter_size === size).map((model) => model.name);

  return modelNames;
}
async function getUserPrompt(): Promise<string> {
	const questions: QuestionCollection = [
		{
			type: "input",
			name: "userPrompt",
			message: "Enter a prompt you want to test:",
		},
	];
	const answer = await inquirer.prompt(questions);
	return answer.userPrompt;
}

const names = processModelNames(allmodels.models);

const selected = await getSelectedModel(names);
const modelName = selected.split(" - ")[0];
const selectedSize = selected.split(" - ")[1];


const quants = await getSelectedQuants(modelName, selectedSize, allmodels.models);

const userPrompt = await getUserPrompt();

for (const quant of quants) {
  for (let index = 0; index < qrepeat; index++) {
    let format = ""
    if (userPrompt.toLowerCase().includes("json")) {
      format = "json"
    }
    const output = await ollama.generate({model: quant, prompt: userPrompt, format: format});
    console.log(`\n${quant} round ${index + 1}:\n${output.response}\nGenerated in ${(output.eval_duration / 1000000000).toFixed(2)} seconds\n`);
    if (index < qrepeat - 1) {
      console.log('--------\n');
    }
  }
  console.log('========\n');
}