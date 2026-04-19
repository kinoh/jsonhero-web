export type TokenType =
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "punct"
  | "whitespace";

export type Token = { type: TokenType; text: string };

const PUNCT = new Set(["{", "}", "[", "]", ":", ",", " "]);
const WS = /\s/;

export function tokenizeJsonLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    const c = line[i];

    if (WS.test(c)) {
      let j = i;
      while (j < line.length && WS.test(line[j])) j++;
      tokens.push({ type: "whitespace", text: line.slice(i, j) });
      i = j;
      continue;
    }

    if (c === '"') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === '"') {
          j++;
          break;
        }
        j++;
      }
      const text = line.slice(i, j);
      let k = j;
      while (k < line.length && WS.test(line[k])) k++;
      const isKey = line[k] === ":";
      tokens.push({ type: isKey ? "key" : "string", text });
      i = j;
      continue;
    }

    if (c === "-" || (c >= "0" && c <= "9")) {
      let j = i + 1;
      while (j < line.length && /[0-9.eE+\-]/.test(line[j])) j++;
      tokens.push({ type: "number", text: line.slice(i, j) });
      i = j;
      continue;
    }

    if (line.startsWith("true", i)) {
      tokens.push({ type: "boolean", text: "true" });
      i += 4;
      continue;
    }
    if (line.startsWith("false", i)) {
      tokens.push({ type: "boolean", text: "false" });
      i += 5;
      continue;
    }
    if (line.startsWith("null", i)) {
      tokens.push({ type: "null", text: "null" });
      i += 4;
      continue;
    }

    if (PUNCT.has(c)) {
      tokens.push({ type: "punct", text: c });
      i++;
      continue;
    }

    // Unknown char: emit as punct so we don't lose it
    tokens.push({ type: "punct", text: c });
    i++;
  }

  return tokens;
}

export function tokenizeJson(jsonString: string): Token[][] {
  return jsonString.split("\n").map(tokenizeJsonLine);
}
