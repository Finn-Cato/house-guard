// Homey web embeds this page in an iframe and handles its own dark-mode
// inversion. Standalone mobile webviews need the app's own dark palette.
if (window.self === window.top) {
  document.documentElement.classList.add('pg-standalone');
}
