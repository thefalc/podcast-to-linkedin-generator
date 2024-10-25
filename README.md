# Podcast to LinkedIn Generator
This application uses Langchain, Whisper, and GPT to convert a podcast episode into a LinkedIn post.

<p align="center">
  <img src="/images/app-screenshot.png" />
</p>

## How it works
The application parses podcasts from the URL of the podcast feed. Clicking on an individual card
representing a show, automaticaly downloads the MP3 file, splits it into chunks 25 MBs or less,
transcribes the chunks using Whisper, then submits the transcription, podcast description, and 
instructions in a system message to GPT-4 to auto generate a post.

Currently, only the first chunk of audio is used (about 10 minutes) of the podcast. This is to reduce
cost and the time to generate the post. Even with 10 minutes of transcription, the results are
quite good.

If you want to adjust the instructions, you can find the system message in **/util/prompt-constants.js**.

## What you'll need

* An OpenAI account and API key
* A Langchain account and API key

## Getting set up
In a terminal, clone the sample code to your project's working directory with the following command:

```shell
git clone https://github.com/thefalc/podcast-to-linkedin-generator.git
```

### Configure the application

1. Create a .env file in the root directory.
2. Add your OPENAI_API_KEY and LANGCHAIN_API_KEY values to this file.
3. Add LANGCHAIN_TRACING_V2='true' to this file.

### Run the application

1. In a terminal, navigate to your project directory. Run the app with the following command:

```shell
npm install
npm run dev
```
2. From your browser, navigate to http://localhost:3000 and you should see the LinkedIn generator app page.
3. Enter a podcast feed URL, e.g. https://feeds.megaphone.fm/SWUET7254106891, and click Fetch Episodes.
4. Click on one of the episodes and if everything is set up correctly, you should see a generated LinkedIn post.