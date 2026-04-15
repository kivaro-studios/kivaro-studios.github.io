const contactForm = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');

const getContactText = (key) => {
  if (window.kivaroSite) return window.kivaroSite.t(`contact.status.${key}`);
  return '';
};

if (contactForm && formStatus) {
  contactForm.addEventListener('submit', async (event) => {
    const endpoint = contactForm.getAttribute('action') || '';

    if (endpoint.includes('your-form-id')) {
      event.preventDefault();
      formStatus.textContent = getContactText('configure');
      return;
    }

    event.preventDefault();
    formStatus.textContent = getContactText('sending');

    try {
      const formData = new FormData(contactForm);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      contactForm.reset();
      formStatus.textContent = getContactText('success');
    } catch (error) {
      formStatus.textContent = getContactText('error');
    }
  });
}
