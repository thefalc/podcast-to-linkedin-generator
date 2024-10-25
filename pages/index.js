import React, { useEffect, useState } from 'react';
import Parser from 'rss-parser';
import Layout from '../components/Layout';
import TypingPageHeader from '../components/TypingPageHeader';

const PodcastFeedPage = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // State for modal visibility
  const [responseMessage, setResponseMessage] = useState(''); // State for server response
  const [responseMP3Url, setResponseMP3Url] = useState('');
  const [responseEpisodeDescription, setEpisodeDescription] = useState('');
  const [showModal, setShowModal] = useState(false); // State to manage modal visibility
  const [showToast, setShowToast] = useState(false); // State to manage toast visibility

  const parser = new Parser();

  let modalClickEventAdded = false;

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
    setSubmitted(true); // Set submitted to true after form submission
    fetchPodcastEpisodes();
  };

  const handleCardClick = async (mp3Url, episodeDescription, regenerate) => {
    if (regenerate === undefined) {
      regenerate = false;
    }
    setLoading(true);
    setShowModal(true);
    setResponseMessage('');

    try {
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mp3Url, episodeDescription, regenerate }),
      });

      if (!response.ok) {
        throw new Error('Failed to post MP3 URL');
      }

      const responseData = await response.json(); // Assuming the response is JSON
      setResponseMessage(responseData.linkedInPost || 'Successfully processed'); // Display server message
      setResponseMP3Url(responseData.mp3Url);
      setEpisodeDescription(responseData.episodeDescription);

      console.log('MP3 URL posted successfully:', mp3Url);
    } catch (error) {
      setResponseMessage('Error processing podcast. Please try again later.');
      console.error('Error processing podcast:', error);
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(responseMessage).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000); // Hide toast after 2 seconds
    }).catch((err) => console.error("Failed to copy text: ", err));
  };

  const handlePostToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(responseMessage)}`;
    window.open(linkedInUrl, '_blank');
  };

  useEffect(() => {
    const modal = document.getElementById('modal');
    if (modal && !modalClickEventAdded) {
      // Event listener to close the modal when clicking outside of modal content
      modal.addEventListener('click', function(event) {
        modalClickEventAdded = true;
        const modalContent = document.querySelector('.modal-content');
        console.log(modalContent);
        if (modalContent != undefined && !modalContent.contains(event.target)) {
          modalClickEventAdded = false;
          setShowModal(false);
        }
      });
    }
  });

  return (
    <Layout title="Podcast to LinkedIn Post Generator">
      {showModal && (
        <div id="modal" className="modal">
          <div className="modal-content">
            {loading ? (
              <p>Processing podcast... Please wait.</p>
            ) : (
              <div className="row">
                <div className="col-12 text-center">
                  <p>Processing complete. Here's your result:</p>
                </div>
                <div className="col-12">
                  <textarea
                    readOnly
                    value={responseMessage}
                    onFocus={(e) => e.target.select()} // Select text on click for easy copying
                    rows={3}
                  />
                </div>
                <div className="col-12">
                  <button className="btn btn-link" onClick={() => handleCardClick(responseMP3Url, responseEpisodeDescription, true)}>Regenerate</button>
                  <button className="btn btn-link" onClick={handleCopyToClipboard}>Copy to Clipboard</button>
                  <button className="btn btn-success" onClick={handlePostToLinkedIn}>Post to LinkedIn</button>
                </div>
              </div>
            )}
            {loading && (
              <button className="btn btn-link" onClick={() => setShowModal(false)}>Close</button>
            )}
          </div>
        </div>
      )}

      {showToast && (
        <div aria-live="polite" aria-atomic="true" style={{ position: "relative", zIndex: 100000 }}>
        <div className="toast" style={{ position: "absolute", top: 10, right: 10, display: "flex" }}>
          <div className="toast-body">
            Text copied to clipboard!
          </div>
        </div>
      </div>
      )}

      <div className={`container ${submitted ? 'top-align' : 'center-align'}`}>
        <div className="row">
          <div className="col-12 text-center">
            <TypingPageHeader text="Podcast to LinkedIn Post Generator" />
          </div>
          <div className="col-12 text-center">
            <form onSubmit={handleSubmit}>
              <input
                style={{width: 450}}
                type="text"
                placeholder="Enter podcast RSS feed URL"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
              />
              <button type="submit" className="btn btn-success">Fetch Episodes</button>
            </form>
          </div>
        </div>
      </div>

      {error && <p className="error text-center">{error}</p>}

      <div className="episode-list row">
        {episodes.length > 0 &&
          episodes.map((episode, index) => (
            <div
              key={index}
              className="episode-card col-3"
              onClick={() => handleCardClick(episode.enclosure?.url, episode.contentSnippet)}
            >
              <h3>{episode.title}</h3>
              <p className="truncate-text">{episode.contentSnippet || episode.description}</p>
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
