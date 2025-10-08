import { useState } from 'react';
import './Contact.css';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    hardware: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you within 2-4 hours.');
    setFormData({
      name: '',
      email: '',
      subject: '',
      hardware: '',
      message: ''
    });
  };

  return (
    <div className="contact-page">
      <section className="page-header">
        <div className="container">
          <h1>Get In Touch</h1>
          <p>Ready to optimize your gaming experience? We're here to help you dominate the competition.</p>
        </div>
      </section>

      <section className="contact-hero">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Contact Information</h2>
              <p className="contact-description">
                Our team of PC optimization experts is available 24/7 to help you achieve peak gaming performance. 
                Choose your preferred method of communication below.
              </p>
              
              <div className="contact-methods">
                <div className="contact-method primary-contact">
                  <div className="contact-icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="contact-details">
                    <h3>Email Support</h3>
                    <p>Primary contact method for all inquiries</p>
                    <a href="mailto:support@softhe.io" className="contact-link">support@softhe.io</a>
                    <span className="response-time">Response within 2-4 hours</span>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="contact-icon">
                    <i className="fab fa-discord"></i>
                  </div>
                  <div className="contact-details">
                    <h3>Discord Support</h3>
                    <p>Real-time chat and community support</p>
                    <a href="https://discord.com/users/softhecs" className="contact-link" target="_blank" rel="noreferrer">@softhecs</a>
                    <span className="response-time">Usually online 12-20 GMT+2</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-section">
              <div className="contact-form-container">
                <h2>Send Us a Message</h2>
                <p>Have a specific question? Fill out the form below and we'll get back to you quickly.</p>
                
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <select id="subject" name="subject" value={formData.subject} onChange={handleChange} required>
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="sales">Sales Question</option>
                      <option value="custom">Custom Optimization</option>
                      <option value="billing">Billing Support</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="hardware">Your Hardware (Optional)</label>
                    <input type="text" id="hardware" name="hardware" value={formData.hardware} onChange={handleChange} placeholder="e.g., RTX 4080, i7-13700K, 32GB RAM" />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea id="message" name="message" rows="6" value={formData.message} onChange={handleChange} required placeholder="Tell us about your gaming setup and what you're looking to optimize..."></textarea>
                  </div>
                  
                  <button type="submit" className="btn btn-primary form-submit">
                    <i className="fas fa-paper-plane"></i>
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
