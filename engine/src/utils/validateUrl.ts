export default function validateUrl(input: string) {
  try {
    const url = new URL(input);

    if (!(url.protocol === "https:") && !(url.protocol === "http:")) {
      return {result: false, error: "È un URL, ma il protocollo non è permesso: solo http e https"};
    }
  } catch {
    return {result: false, error: "URL non valido"};
  }

  return {result: true};
}