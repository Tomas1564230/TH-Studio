import '../css/style.css';
import Cursor from './components/Cursor.js';
import Scene from './gl/Scene.js';

document.addEventListener('DOMContentLoaded', () => {
  new Cursor();
  new Scene();
  console.log('TH Studio — ready.');
});
