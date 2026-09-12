// Three r178 ships ES modules. Keep the existing game modules' THREE API and
// resolve this module's load event only after its dependency has executed.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.min.js';
window.THREE = THREE;
