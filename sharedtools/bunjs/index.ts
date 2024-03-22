import { Glob } from "bun";
import sentencize from "@stdlib/nlp-sentencize";
export async function getFileNames(path: string, namePattern: string, sortFunction: (a: string, b: string) => number = (a, b) => a.localeCompare(b)): Promise<string[]> {
  const files: string[] = []
  const glob = new Glob(namePattern);

  for await (const f of glob.scan(path)) {
    files.push(f)
  }

  return files.sort(sortFunction);
}

export function embeddingFileSort(a: string, b: string): number {
  const [la, oa] = extractAndParseEmbeddingFileNames(a);
  const [lb, ob] = extractAndParseEmbeddingFileNames(b);

  if (la !== lb) {
    return la - lb;
  }
  return oa - ob;
}

export function extractAndParseEmbeddingFileNames(file: string): [number, number] {
  const matches = file.match(/l(\d+)-o(\d+)/);
  if (!matches) {
    throw new Error('Filename format is incorrect');
  }
  return [parseInt(matches[1], 10), parseInt(matches[2], 10)];

}



