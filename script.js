/* ============================================================
   PromoArcade — Main Script
   Handles: mobile nav, header scroll, contact form, smooth UX
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Mobile Navigation Toggle ----------
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navCta = document.getElementById('navCta');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      if (navCta) navCta.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        if (navCta) navCta.classList.remove('open');
      });
    });
  }

  // ---------- Header Scroll Shadow ----------
  const header = document.getElementById('header');

  if (header) {
    const onScroll = () => {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Contact Form Handler ----------
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic client-side validation
      const name = contactForm.querySelector('#name');
      const email = contactForm.querySelector('#email');
      const message = contactForm.querySelector('#message');

      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        return;
      }

      // Simple email format check
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.value.trim())) {
        return;
      }

      /*
       * NOTE: This form does not send data to a server by default.
       * To make it functional, connect it to:
       *   - A backend endpoint (e.g., /api/contact)
       *   - A third-party form service (e.g., Formspree, Netlify Forms)
       *   - Or a mailto: action
       *
       * For now, it shows a success message as a placeholder.
       */

      const successMsg = document.getElementById('formSuccess');
      if (successMsg) {
        successMsg.style.display = 'block';
      }

      contactForm.reset();

      // Hide success message after a few seconds
      setTimeout(() => {
        if (successMsg) successMsg.style.display = 'none';
      }, 5000);
    });
  }

  // ---------- Smooth Scroll for Anchor Links ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
