import React, { Component, useState } from 'react';
import Parser from 'rss-parser';
import Layout from '../components/Layout';

const PodcastFeedPage = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [error, setError] = useState(null);
  const parser = new Parser();

  const fetchPodcastEpisodes = async () => {
    setError(null);
    setEpisodes([]);
    try {
      const feed = await parser.parseURL(feedUrl);
      setEpisodes(feed.items);
    } catch (err) {
      setError('Failed to parse RSS feed. Please check the URL and try again.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPodcastEpisodes();
  };

  const handleCardClick = async (mp3Url) => {
    try {
      alert(mp3Url);
      // const response = await fetch('/api/post-mp3-url', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ mp3Url }),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to post MP3 URL');
      // }

      console.log('MP3 URL posted successfully:', mp3Url);
    } catch (error) {
      console.error('Error posting MP3 URL:', error);
    }
  };

  return (
    <Layout title="Podcast LinkedIn Post Generator">
      <div class="row">
        <div class="col-12 text-center">
          <h1>Podcast RSS Feed Parser</h1>
        </div>
        <div class="col-12 text-center">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter RSS feed URL"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
            />
            <button type="submit" className="btn btn-success">Fetch Episodes</button>
          </form>
        </div>
      </div>
      

      {error && <p className="error">{error}</p>}

      <div className="episode-list row">
        {episodes.length > 0 &&
          episodes.map((episode, index) => (
            <div
              key={index}
              className="episode-card col-3"
              onClick={() => handleCardClick(episode.enclosure?.url)}
            >
              <h3>{episode.title}</h3>
              <p>{episode.contentSnippet || episode.description}</p>
            </div>
          ))}
      </div>
    </Layout>
  );
  
}

export default function Index() {
  return (
    <Layout>
      <PodcastFeedPage />
    </Layout>
  );
}
