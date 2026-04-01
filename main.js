/* ============================================
   MARUTHI PSCC POLES – MAIN JS
   ============================================ */

// NAVBAR SCROLL
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
});

// MOBILE MENU
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// SCROLL ANIMATION (AOS-lite)
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

// COUNTER ANIMATION
function animateCounters() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      if (target >= 1000000) {
        el.textContent = (current / 1000000).toFixed(2) + 'M+';
      } else {
        el.textContent = current.toLocaleString('en-IN') + suffix;
      }
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounters(); counterObserver.disconnect(); }});
}, { threshold: 0.5 });
const firstStat = document.querySelector('.stat-num[data-target]');
if (firstStat) counterObserver.observe(firstStat.closest('.hero-stats') || firstStat);

// ============================================
// ENQUIRY FORM SUBMISSION
// Saves to GitHub Gist + Sends Email via EmailJS
// ============================================

const EMAILJS_SERVICE_ID = 'service_maruthi';
const EMAILJS_TEMPLATE_ID = 'template_enquiry';
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY'; // Replace after setup

const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN'; // Replace with your GitHub PAT
const GITHUB_GIST_ID = 'YOUR_GIST_ID';   // Replace after creating a Gist
const RECIPIENT_EMAIL = 'pusukuri.ramarao.75@gmail.com';

async function saveEnquiryToGitHub(data) {
  // First try to get existing gist content
  let existing = [];
  try {
    const getRes = await fetch(`https://api.github.com/gists/${GITHUB_GIST_ID}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (getRes.ok) {
      const gist = await getRes.json();
      const content = gist.files['enquiries.json']?.content;
      if (content) existing = JSON.parse(content);
    }
  } catch(e) { console.warn('Could not read existing gist', e); }

  // Append new entry
  existing.push({ ...data, timestamp: new Date().toISOString() });

  // Update gist
  const res = await fetch(`https://api.github.com/gists/${GITHUB_GIST_ID}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      description: 'Maruthi PSCC Poles – Enquiry Submissions',
      files: {
        'enquiries.json': { content: JSON.stringify(existing, null, 2) }
      }
    })
  });
  return res.ok;
}

async function sendEmailViaEmailJS(data) {
  // Load EmailJS if not loaded
  if (typeof emailjs === 'undefined') {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: RECIPIENT_EMAIL,
    from_name: data.name,
    from_company: data.company,
    from_phone: data.phone,
    from_email: data.email,
    enquiry_type: data.enquiry_type,
    message: data.message,
    reply_to: data.email
  });
}

// FORM HANDLER
const enquiryForm = document.getElementById('enquiryForm');
if (enquiryForm) {
  enquiryForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = enquiryForm.querySelector('.form-submit');
    const msgEl = document.getElementById('formMessage');

    // Collect data
    const data = {
      name: enquiryForm.name.value.trim(),
      company: enquiryForm.company.value.trim(),
      phone: enquiryForm.phone.value.trim(),
      email: enquiryForm.email.value.trim(),
      enquiry_type: enquiryForm.enquiry_type.value,
      message: enquiryForm.message.value.trim()
    };

    // Validate
    if (!data.name || !data.phone || !data.email || !data.enquiry_type || !data.message) {
      showMsg(msgEl, 'error', '⚠️ Please fill all required fields.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';

    let githubOk = false, emailOk = false, errors = [];

    // Save to GitHub
    try {
      githubOk = await saveEnquiryToGitHub(data);
    } catch(e) {
      errors.push('GitHub save');
      console.error('GitHub error:', e);
    }

    // Send Email
    try {
      await sendEmailViaEmailJS(data);
      emailOk = true;
    } catch(e) {
      errors.push('email');
      console.error('EmailJS error:', e);
    }

    btn.disabled = false;
    btn.textContent = 'Submit Enquiry →';

    if (githubOk || emailOk) {
      showMsg(msgEl, 'success', '✅ Enquiry sent successfully! We will contact you within 24 hours.');
      enquiryForm.reset();
    } else {
      showMsg(msgEl, 'error', '❌ Submission failed. Please call us directly or email info@maruthipsccpoles.com');
    }
  });
}

function showMsg(el, type, text) {
  if (!el) return;
  el.textContent = text;
  el.className = 'form-message ' + type;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 8000);
}

// PARTICLE BACKGROUND (optional, lightweight)
function createParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = Array.from({length: 50}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 2 + 1,
    alpha: Math.random() * 0.4 + 0.1
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,200,80,${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
}
createParticles();

// ACTIVE NAV LINK
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    a.classList.add('active');
  } else {
    a.classList.remove('active');
  }
});
