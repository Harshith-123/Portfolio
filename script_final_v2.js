const menuBtn = document.getElementById('menuBtn');
const mobilePanel = document.getElementById('mobilePanel');

menuBtn.addEventListener('click', () => {
  mobilePanel.classList.toggle('open');
});

document.querySelectorAll('.mobile-panel a').forEach(link => {
  link.addEventListener('click', () => mobilePanel.classList.remove('open'));
});

window.addEventListener('click', (event) => {
  if (!mobilePanel.contains(event.target) && !menuBtn.contains(event.target)) {
    mobilePanel.classList.remove('open');
  }
});

const revealItems = document.querySelectorAll('.reveal-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach((item) => observer.observe(item));

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

emailjs.init('PX3FWtX8cihpOy8oG');

const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formNote.textContent = 'Sending...';

  const [name, email, subject, message] = contactForm.querySelectorAll('input, textarea');

  emailjs.send('service_a7qtvtk', 'template_t9t1r5o', {
    from_name: name.value,
    from_email: email.value,
    subject: subject.value,
    message: message.value
  }).then(() => {
    formNote.textContent = 'Message sent successfully!';
    contactForm.reset();
  }).catch(() => {
    formNote.textContent = 'Something went wrong. Please try again.';
  });
});
