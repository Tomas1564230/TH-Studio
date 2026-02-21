import '../css/style.css';
import LenisScroll from './components/LenisScroll.js';
import Cursor from './components/Cursor.js';
import Scene from './gl/Scene.js';

document.addEventListener('DOMContentLoaded', () => {
  new LenisScroll();
  new Cursor();
  new Scene();

  console.log('TH Studio — clean rebuild. Dual layer: creative behind, corporate inverse-clipped on top.');
});
