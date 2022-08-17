// btoa is only deprecated for Node.js, and the Buffer class alternative is not available in the browser
export const toBase64Json = (obj: any) => window.btoa(JSON.stringify(obj));