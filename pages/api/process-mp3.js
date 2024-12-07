import { OpenAIWhisperAudio } from '@langchain/community/document_loaders/fs/openai_whisper_audio';
import fs from 'fs';
const { publishToTopic, LINKEDIN_PODCAST_MP3_TOPIC } = require("../../util/publish-to-topic");

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const MP3Cutter = require('mp3-cutter');
const path = require('path');

require('dotenv').config();

const MAX_SIZE_MB = 25;

// Download the MP3 file
async function downloadMP3(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Split the MP3 into chunks less than 25 MB
async function splitMP3(filePath) {
  let files = [];

  const maxSizeBytes = MAX_SIZE_MB * 1024 * 1024;

  // Get the size of the file
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats.size;

  console.log('fileSizeInBytes: '+ fileSizeInBytes);

  if (fileSizeInBytes <= maxSizeBytes) {
    console.log('File is already less than 25 MB, no need to split.');
    return;
  }

  // Calculate the number of chunks needed
  const numberOfChunks = Math.ceil(fileSizeInBytes / maxSizeBytes);
  console.log(`Splitting the file into ${numberOfChunks} chunks...`);

  const chunkDurationInSeconds = await getChunkDurationInSeconds(filePath, numberOfChunks);

  console.log('chunkDurationInSeconds: ', chunkDurationInSeconds);

  for (let i = 0; i < numberOfChunks; i++) {
    const start = i * chunkDurationInSeconds;
    const end = (i + 1) * chunkDurationInSeconds;

    console.log(`start and end: ${start} ${end}`);

    const outputFileName = path.join(
      path.dirname(filePath),
      `chunk_${i + 1}_${path.basename(filePath)}`
    );
    
    MP3Cutter.cut({
      src: filePath,
      target: outputFileName,
      start,
      end,
    });

    console.log(`Chunk ${i + 1} saved as ${outputFileName}`);

    files.push(outputFileName);
  }

  return files;
}

// Helper function to get chunk duration in seconds based on file size
async function getChunkDurationInSeconds(filePath, numberOfChunks) {
  const MP3_DURATION_PER_MB = 24; // Approximate average duration of 1MB of MP3
  const totalDuration = MP3_DURATION_PER_MB * numberOfChunks * MAX_SIZE_MB;
  const chunkDuration = totalDuration / numberOfChunks;

  return chunkDuration;
}

// Main function to handle the download and splitting process
async function processMP3(url, downloadPath) {
  try {
    // Download the MP3 file
    console.log('Downloading MP3...');
    await downloadMP3(url, downloadPath);
    console.log('Download complete.');

    // Split the MP3 file into chunks
    let mp3Files = await splitMP3(downloadPath);
    console.log('Splitting complete.');

    console.log(mp3Files);

    return mp3Files;
  } catch (error) {
    console.error('Error processing MP3:', error);
  }
}

// Removes a single file from disc
async function removeFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
    } else {
      console.log('File deleted successfully');
    }
  });
}

// Cleans up all downloaded and split files
async function cleanUpFiles(filePath, fileChunks) {
  removeFile(filePath);

  for(let i = 0; i < fileChunks.length; i++) {
    removeFile(fileChunks[i]);
  }
}

// Function to transcribe the MP3 file using Whisper API
async function transcribeAudio(mp3Url) {
  let transcriptions = [];
  const filePath = process.cwd() + '/files/' + uuidv4() + '.mp3';
  let mp3Files = await processMP3(mp3Url, filePath);

  // Transcribe all the MP3 chunks
  for (let i = 0; i < mp3Files.length; i++) {
    let mp3FileChunkName = mp3Files[i];

    console.log('Transcribing ', mp3FileChunkName);
    
    const loader = new OpenAIWhisperAudio(mp3FileChunkName);
    const docs = await loader.load();

    console.log(docs);

    let transcriptionText = docs[0].pageContent;
    transcriptions.push(transcriptionText);

    // Write transcription to Kafka
    publishToTopic(LINKEDIN_PODCAST_MP3_TOPIC, [ { mp3Url, transcriptionText } ]);

    // only doing one transcription for now
    break;
  }

  cleanUpFiles(filePath, mp3Files);
}

export default async function handler(req, res) {
  // Check for the HTTP method if needed, e.g., if it's a POST or GET request
  if (req.method === 'POST') {
    let body = JSON.parse(req.body);

    for(let i = 0; i < body.length; i++) {
      let mp3Url = body[i].mp3Url;

      console.log(mp3Url);

      transcribeAudio(mp3Url);
    }    

    // Return a JSON response with ok: true
    res.status(200).json({ ok: true });
  } else {
    // Handle other HTTP methods, e.g., if a GET request is made instead of POST
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}