import config from "./config.json";
import {convert} from "html-to-text";

export function getConfig(): { embedmodel: string, mainmodel: string } {
  return config
}

export async function readText(path: string): Promise<string> {
  // test if path is a local file or a remote URL
  const protocol = path.split("://")[0];
  if (protocol === "http" || protocol === "https") {
    const text = await fetch(path).then(x => x.text());
    return convert(text)
    // get the text out of 'text' which is the full html
  } else {
    return Bun.file(path).text()
  }

}
