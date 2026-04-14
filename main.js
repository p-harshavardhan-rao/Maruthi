function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });

document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
