export default function validateUrl(input: string) {
  try {
    const url = new URL(input);

    if (!(url.protocol === "https:") && !(url.protocol === "http:")) {
      return {result: false, error: "Only http and https addresses are allowed"};
    }
  } catch {
    return {result: false, error: "Invalid URL"};
  }

  return {result: true};
}