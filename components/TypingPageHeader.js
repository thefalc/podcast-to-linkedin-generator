import React, { useState, useEffect } from 'react';

const TypingPageHeader = ({ text, typingSpeed = 50 }) => {
  const [displayedText, setDisplayedText] = useState(""); // State for the text being displayed

  useEffect(() => {
    let currentIndex = 0;

    // Create an interval to add one character at a time
    const interval = setInterval(() => {
      console.log(currentIndex);
      if (currentIndex < text.length) {
        setDisplayedText((prev) => {
          const newText = prev + text[currentIndex];
          currentIndex++;

          return newText;
        });
      }

      // Clear the interval once the entire text is displayed
      if (currentIndex >= text.length) {
        clearInterval(interval);
      }
    }, typingSpeed);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [text, typingSpeed]);

  return (
    <div>
      <h1>{displayedText}</h1>
    </div>
  );
};

export default TypingPageHeader;