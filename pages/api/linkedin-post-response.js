import cache from "../../util/cache";

export default async function handler(req, res) {
    // Check for the HTTP method if needed, e.g., if it's a POST or GET request
    if (req.method === 'POST') {
      console.log(req.body);
      let body = JSON.parse(req.body);
  
      for(let i = 0; i < body.length; i++) {
        let mp3Url = body[i].mp3Url;
        let linkedInPost = body[i].linkedInPost;

        console.log('about to set the cache');
        
        // Cache the result
        // setCache(mp3Url, linkedInPost);

        cache.set(mp3Url, linkedInPost);

        console.log(cache.keys());
      }    
  
      // Return a JSON response with ok: true
      res.status(200).json({ ok: true });
    } else {
      // Handle other HTTP methods, e.g., if a GET request is made instead of POST
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }