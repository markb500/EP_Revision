// Load definition pairs from stuff/defs.txt (alternating prompt / answer lines).
// Answers may contain HTML (images, <br>, entities).

/**
 * @typedef {{ term: string, definition: string, id: number }} DefinitionPair
 */

/**
 * @param {string} text
 * @returns {DefinitionPair[]}
 */
export function parseDefsText(text) {
  const lines = text
    .split(/\r\n|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length % 2 !== 0) {
    lines.pop();
  }

  /** @type {DefinitionPair[]} */
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    pairs.push({
      id: i / 2,
      term: lines[i],
      definition: lines[i + 1]
    });
  }
  return pairs;
}

/**
 * @param {string} [txtUrl]
 * @returns {Promise<DefinitionPair[]>}
 */
export async function loadDefinitions(txtUrl = 'stuff/defs.txt') {
  const res = await fetch(txtUrl);
  if (!res.ok) {
    throw new Error(`Could not load definitions (${res.status})`);
  }
  const text = await res.text();
  const pairs = parseDefsText(text);
  if (!pairs.length) {
    throw new Error('No definition pairs found in defs.txt');
  }
  return pairs;
}
