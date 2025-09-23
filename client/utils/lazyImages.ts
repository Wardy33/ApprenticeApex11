export function enableLazyImages() {
  if (typeof window === 'undefined') return;
  const imgs = document.querySelectorAll('img');
  imgs.forEach((img) => {
    if (!img.getAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    if (!img.getAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
  });
}


