import '../css/style.css';
import Cursor from './components/Cursor.js';
import Scene from './gl/Scene.js';

document.addEventListener('DOMContentLoaded', () => {
  new Cursor();
  new Scene();
  // Cookie Banner Logic
  const cookieBanner = document.getElementById('cookie-banner');
  const btnAccept = document.getElementById('cookie-accept');
  const btnDecline = document.getElementById('cookie-decline');

  if (cookieBanner && !localStorage.getItem('th-cookie-consent')) {
    // Show banner after a tiny delay for smooth animation
    setTimeout(() => {
      cookieBanner.classList.add('visible');
    }, 1000);

    const hideBanner = (consent) => {
      localStorage.setItem('th-cookie-consent', consent);
      cookieBanner.classList.remove('visible');
    };

    if (btnAccept) btnAccept.addEventListener('click', () => hideBanner('accepted'));
    if (btnDecline) btnDecline.addEventListener('click', () => hideBanner('declined'));
  }

  console.log('TH Studio — ready.');
});
