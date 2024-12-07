import cache from "../../util/cache";
const { publishToTopic, LINKEDIN_GENERATION_REQUEST_TOPIC } = require("../../util/publish-to-topic");

export default async function handler(req, res) {
    // Check for the HTTP method if needed, e.g., if it's a POST or GET request
    if (req.method === 'POST') {
      let postBody = req.body;
      let mp3Url = postBody.mp3Url;
      let episodeDescription = postBody.episodeDescription;
      let regenerate = postBody.regenerate;

      const cachedValue = cache.get(mp3Url);

      if (regenerate || !cachedValue) {
        cache.del(mp3Url);

        publishToTopic(LINKEDIN_GENERATION_REQUEST_TOPIC, [ { mp3Url, episodeDescription } ]);
      }

      res.status(200).json({ ok: true });
    } else {
      // Handle other HTTP methods, e.g., if a GET request is made instead of POST
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }