# Podcast to LinkedIn Generator
This application uses LangChain, Whisper, GPT, Kafka, and Flink to convert a podcast episode into a LinkedIn post.

This project demonstrates how to create an AI-powered application that de-couples the data engineering and AI parts of the service from the user-facing application tier using an event-driven design. This is a requirement for building scalable systems, whether based on AI or not.

<p align="center">
  <img src="/images/app-screenshot.png" />
</p>

## How it works
The application parses podcasts from the URL of the podcast feed. When a user clicks on a podcast listing, the app asks the server to check a backend cache for an existing LinkedIn post. If one is found, it’s returned and displayed.

If no LinkedIn post exists, the backend writes an event to a Kafka topic, including the MP3 URL and episode description. This triggers the workflow to generate the LinkedIn post.

The diagram below illustrates the full architecture of this event-driven system.

<p align="center">
  <img src="/images/app-architecture.png" />
</p>

[Confluent Cloud's](https://www.confluent.io/) Data Stream Platform is used to move, process events, and call out to GPT for inference. The user-facing part of the web
application doesn't know anything about AI.

# What you'll need
In order to set up and run the application, you need the following:

* [Node v22.5.1](https://nodejs.org/en) or above
* A [Confluent Cloud](https://www.confluent.io/) account
* The [Confluent CLI](https://docs.confluent.io/confluent-cli/current/install.html)
* An [OpenAI](https://platform.openai.com/docs/overview) API key
* A [LangChain](https://www.langchain.com/) API key

## Getting set up

### Get the starter code
In a terminal, clone the sample code to your project's working directory with the following command:

```shell
git clone https://github.com/thefalc/podcast-to-linkedin-generator.git
```

### Setting up Confluent Cloud

The LinkedIn generator app uses Confluent Cloud to move and operate on data in real-time and handle the heavy lifting for the AI workflow.

### Create the LinkedIn post request topic

The web app publishes messages with the podcast URL and episode description to a Kafka topic
called `linkedin-generation-request`.

In your Confluent Cloud account.

* Go to your Kafka cluster and click on **Topics** in the sidebar.
* Name the topic as `linkedin-generation-request`.
* Set other configurations as needed, such as the number of partitions and replication factor, based on your requirements.
* Go to **Schema Registry**
* Click **Add Schema** and select **linkedin-generation-request** as the subject
* Choose JSON Schema as the schema type
* Paste the schema from below into the editor

```json
{
  "properties": {
    "episodeDescription": {
      "connect.index": 1,
      "oneOf": [
        {
          "type": "null"
        },
        {
          "type": "string"
        }
      ]
    },
    "mp3Url": {
      "connect.index": 0,
      "oneOf": [
        {
          "type": "null"
        },
        {
          "type": "string"
        }
      ]
    }
  },
  "title": "Record",
  "type": "object"
}
```
* Save the schema

### Create the HTTP sink connector to process URLs and generate transcripts

Now that LinkedIn post requests are flowing into the `linkedin-generation-request` topic,
you now need to setup an HTTP sink connector to start the process URLs and generate podcast transcripts.

* Under **Connectors**, click **+ Add Connector**
* Search for "http" and select the **HTTP Sink** connector
* Select the **linkedin-generation-request** topic
* In **Kafka credentials**, select **Service account** and use you existing service account and click **Continue**
* Enter the URL for where the `process-mp3` endpoint is running under the `/pages/api` folder. This will be
similar to `https://YOUR-PUBLIC-DOMAIN/api/process-mp3`. If running locally, you can use [ngrok](https://ngrok.com/)
to create a publicly accessible URL. Click **Continue**
* Under **Configuration**, select **JSON** and click **Continue**
* For **Sizing**, leave the defaults and click **Continue**
* Name the connector `linkedin-process-request` and click **Continue**

Once the connector is created, under the **Settings** > **Advanced configuration** make sure the **Request Body Format** is set to **json**.

### Create the Podcast transcription topic

The `/process-mp3` endpoint publishes messages with the audio transcription to a Kafka topic called `linkedin-podcast-mp3`.

In your Confluent Cloud account.

* Go to your Kafka cluster and click on **Topics** in the sidebar.
* Name the topic as `linkedin-podcast-mp3`.
* Set other configurations as needed, such as the number of partitions and replication factor, based on your requirements.
* Go to **Schema Registry**
* Click **Add Schema** and select **linkedin-podcast-mp3** as the subject
* Choose JSON Schema as the schema type
* Paste the schema from below into the editor

```json
{
  "properties": {
    "mp3Url": {
      "connect.index": 0,
      "oneOf": [
        {
          "type": "null"
        },
        {
          "type": "string"
        }
      ]
    },
    "transcriptionText": {
      "connect.index": 1,
      "oneOf": [
        {
          "type": "null"
        },
        {
          "type": "string"
        }
      ]
    }
  },
  "title": "Record",
  "type": "object"
}
```
* Save the schema

### Create the Podcast request complete topic

We will use Flink to combine the episode descriptions and transcripts into a post for LinkedIn and write those into a topic called `linkedin-request-complete`. First, let's create the topic.

In your Confluent Cloud account.

* Go to your Kafka cluster and click on **Topics** in the sidebar.
* Name the topic as `linkedin-request-complete`.
* Set other configurations as needed, such as the number of partitions and replication factor, based on your requirements.
* Go to **Schema Registry**
* Click **Add Schema** and select **linkedin-request-complete** as the subject
* Choose JSON Schema as the schema type
* Paste the schema from below into the editor

```json
{
  "properties": {
    "linkedInPost": {
      "connect.index": 1,
      "oneOf": [
        {
          "type": "null"
        },
        {
          "type": "string"
        }
      ]
    },
    "mp3Url": {
      "connect.index": 0,
      "oneOf": [
        {
          "type": "null"
        },
        {
          "type": "string"
        }
      ]
    }
  },
  "title": "Record",
  "type": "object"
}
```
* Save the schema

### Create the HTTP sink connector to write the LinkedIn post to cache

Our stream processing via Flink SQL should be populating the `linkedin-request-complete` topic with LinkedIn posts. As a final step you  need to setup an HTTP sink connector to take the LinkedIn generated posts and write them into the cache.

* Under **Connectors**, click **+ Add Connector**
* Search for "http" and select the **HTTP Sink** connector
* Select the **linkedin-generation-request** topic
* In **Kafka credentials**, select **Service account** and use you existing service account and click **Continue**
* Enter the URL for where the `linked-post-response` endpoint is running under the `/pages/api` folder. This will be
similar to `https://YOUR-PUBLIC-DOMAIN/api/linked-post-response`. Click **Continue**
* Under **Configuration**, select **JSON** and click **Continue**
* For **Sizing**, leave the defaults and click **Continue**
* Name the connector `linkedin-process-response` and click **Continue**

Once the connector is created, under the **Settings** > **Advanced configuration** make sure the **Request Body Format** is set to **json** and set the **Input Kafka record value format** under **Configuration** to **JSON_SR**.

### Flink SQL and LLM setup

Flink SQL is used to generate the LinkedIn post from the episode descriptions in `linkedin-generation-request` and
the transcripts in the `linkedin-podcast-mp3` topic.

#### Connecting Flink to OpenAI

To extract questions from the text pulled from the source URLs with Flink, we need to Flink to be able to call a LLM. The first step is to create a connection between Flink and OpenAI (or whatever model you're using).

In your terminal, execute the following.

```bash
confluent flink connection create openai-connection \
--cloud aws \
--region us-east-1 \
--type openai \
--endpoint https://api.openai.com/v1/chat/completions \
--api-key REPLACE_WITH_YOUR_KEY
```

Make sure the region value matches the region for where you're running Confluent Cloud.

Next, in your Confluent Cloud account.

* In your Kafka cluster, go to the **Stream processing** tab
* Click **Create workspace**
* Create a model using the connection you created in the previous step

```sql
CREATE MODEL `linkedin_post_generation`
INPUT (text STRING)
OUTPUT (response STRING)
WITH (
  'openai.connection'='openai-connection',
  'provider'='openai',
  'task'='text_generation',
  'openai.model_version' = 'gpt-4',
  'openai.system_prompt' = 'You are an in AI, databases, and data engineering.
    You need to write a LinkedIn post based on the following podcast transcription and description.
    The post should summarize the key points, be concise, direct, free of jargon, but thought-provoking.
    The post should demonstrate a deep understanding of the material, adding your own takes on the material.
    Speak plainly and avoid language that might feel like a marketing person wrote it.
    Avoid words like "delve", "thought-provoking".
    Make sure to mention the guest by name and the company they work for.
    Keep the tone professional and engaging, and tailor the post to a technical audience. Use emojis sparingly.'
);
```

* Click **Run**

#### Generate the LinkedIn post

Now that the model is created, we are ready to use Flink's built-in `ml_predict` to call the  model and the LinkedIn post.

To keep things readable, first we are going to create a view that joins the episode description, podcast transcript, and some instructional text that will serve as the prompt to send to the LLM.

In the same workspace that you used to create your model, enter the following and click **Run**.

```sql
CREATE VIEW podcast_prompt AS
SELECT
    mp3.key AS key,
    mp3.mp3Url AS mp3Url,
    CONCAT(
        'Generate a concise LinkedIn post that highlights the main points of the podcast while mentioning the guest and their company.',
        CHR(13), CHR(13),
        'Podcast Description:', CHR(13),
        rqst.episodeDescription, CHR(13), CHR(13),
        'Podcast Transcript:', CHR(13),
        mp3.transcriptionText
    ) AS prompt
FROM 
  `linkedin-podcast-mp3` AS mp3
JOIN 
    `linkedin-generation-request` AS rqst
ON 
    mp3.mp3Url = rqst.mp3Url
WHERE 
    mp3.transcriptionText IS NOT NULL;
```

Next, combine the view and the model to populate the `linkedin-request-complete` topic. Enter the following SQL statement and click **Run**.

```sql
INSERT INTO `linkedin-request-complete`
SELECT
    podcast.key,
    podcast.mp3Url,
    prediction.response
FROM 
    `podcast_prompt` AS podcast
CROSS JOIN 
    LATERAL TABLE (
        ml_predict(
            'linkedin_post_generation', 
            podcast.prompt
        )
    ) AS prediction;
```

### Configure the application

In the root directory, create a `.env` file with the following information.

```bash
OPENAI_API_KEY='REPLACE_ME'
LANGCHAIN_TRACING_V2='true'
LANGCHAIN_API_KEY='REPLACE_ME'
```

In your Confluent Cloud account.

* Go to your Kafka cluster and click on **Clients** in the sidebar.
* Click on **Create Client** and select **Node.js**
* Generate a new API key and secret for your Kafka cluster if you haven't already. Make a note of the API key and secret, as you'll need these for authentication.
* Open a text editor, and create a file named `client.properties`.
* Copy the configuration snippet into your editor and save the file into the root project directory

### Run the application

1. In a terminal, navigate to your project directory. Run the app with the following command:

```shell
npm install
npm run dev
```
2. From your browser, navigate to http://localhost:3000 and you should see the LinkedIn generator app page.
3. Enter a podcast feed URL, e.g. https://feeds.megaphone.fm/SWUET7254106891, and click Fetch Episodes.
4. Click on one of the episodes and if everything is set up correctly, you should see a generated LinkedIn post.