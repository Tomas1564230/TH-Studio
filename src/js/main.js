import '../css/style.css';
import LenisScroll from './components/LenisScroll.js';
import Cursor from './components/Cursor.js';
import Scene from './gl/Scene.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Components
  const scroll = new LenisScroll();
  const cursor = new Cursor();
  const scene = new Scene();

  // Add fade-in for Hero content
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    setTimeout(() => {
      heroContent.style.transition = "opacity 1s ease, transform 1s ease";
      heroContent.style.opacity = "1";
      heroContent.style.transform = "translateY(0)";
    }, 500);
  }

  console.log('TH Studio initialized. Premium Agency Mode.');
});
