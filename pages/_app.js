import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.css'; // Add this line
import '../public/static/css/styles.css'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap');
  }, []);
  
  return <Component {...pageProps} />;
}

export default MyApp