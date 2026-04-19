import { DOMParser } from "@xmldom/xmldom";

export default function isXML(possibleXml: string): boolean {
  let isValid = true;

  // https://www.npmjs.com/package/xmldom
  // xmldom handles invalid XML gracefully, so we need to check for errors
  // in this way, rather than relying on the return value of parseFromString
  // as recommended in this documentation::
  // https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString#error_handling

  try {
    const xmlDoc = new DOMParser({
      onError(level) {
        if (level !== "warning") {
          isValid = false;
        }
      },
    }).parseFromString(possibleXml, "application/xml");

    if (!xmlDoc?.documentElement) isValid = false;
  } catch {
    isValid = false;
  }

  return isValid;
}
