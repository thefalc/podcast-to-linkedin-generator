import cache from "../../util/cache";

export default async function handler(req, res) {
    // Check for the HTTP method if needed, e.g., if it's a POST or GET request
    if (req.method === 'POST') {
      let postBody = req.body;
      let mp3Url = postBody.mp3Url;

      const cachedValue = cache.get(mp3Url);
      if (cachedValue) {
        res.status(200).json({ ok: true, linkedInPost: cachedValue });
      }
      else {
        res.status(200).json({ ok: false });
      }
    } else {
      // Handle other HTTP methods, e.g., if a GET request is made instead of POST
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }