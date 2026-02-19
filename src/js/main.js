import '../css/style.css';
import LenisScroll from './components/LenisScroll.js';
import Cursor from './components/Cursor.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Components
  const scroll = new LenisScroll();
  const cursor = new Cursor();

  console.log('TH Studio initialized. Anomaly active.');
});
