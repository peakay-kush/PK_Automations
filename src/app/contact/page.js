'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import AdminEditButton from '@/components/AdminEditButton';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [pageData, setPageData] = useState(null);

  // Load editable page data (admin-editable fields live in src/data/pages.json)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/pages/contact');
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) {
          setPageData(json);
          // DEBUG: show quickAnswers in console to verify data coming from the API
          try { console.debug('[contact] quickAnswers', json && json.quickAnswers); } catch (e) {}
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Prefill form from query params (support ?topic=request-quote... or ?topic=book-consultation...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get('topic');
      if (!topic) return;
      if (topic === 'request-quote') {
        const type = params.get('type') || 'service';
        const serviceId = params.get('serviceId');
        const workIdx = params.get('workIdx');
        const attachmentIdx = params.get('attachmentIdx');
        const subject = `Request Quote - ${type}${serviceId ? ` #${serviceId}` : ''}`;
        const message = `Hello, I would like a quote for ${type}${serviceId ? ` (Service ID: ${serviceId})` : ''}${workIdx ? `, Work #${workIdx}` : ''}${attachmentIdx ? `, Attachment #${attachmentIdx}` : ''}. Please provide pricing and lead time.`;
        setFormData((f) => ({ ...f, subject, message }));
      }

      if (topic === 'book-consultation') {
        const tutorialId = params.get('tutorialId');
        const topicIdx = params.get('topicIdx');
        const mediaIdx = params.get('mediaIdx');
        const subject = `Book Consultation${tutorialId ? ` - Tutorial #${tutorialId}` : ''}`;
        const message = `Hello, I'd like to book a consultation regarding ${tutorialId ? `tutorial #${tutorialId}` : 'this tutorial'}${topicIdx ? `, topic #${topicIdx}` : ''}${mediaIdx ? ` (media #${mediaIdx})` : ''}. Please share availability and pricing.`;
        setFormData((f) => ({ ...f, subject, message }));
      }
    } catch (e) {
      // ignore if URLSearchParams not available
    }
  }, []);

  // Helper: infer a sensible question for legacy answer-only entries
  function inferQuestionFromAnswer(a) {
    if (!a || typeof a !== 'string') return '';
    const s = a.toLowerCase();
    if (s.match(/\b(am|pm)\b/) || s.includes('hours') || s.includes('open')) return 'What are your business hours?';
    if (s.includes('ship') || s.includes('shipping')) return 'Do you ship outside Kenya?';
    if (s.includes('return') || s.includes('money-back') || s.includes('refund')) return 'What is your return policy?';
    if (s.includes('wholesale') || s.includes('bulk') || s.includes('discount')) return 'Do you offer bulk discounts?';
    return '';
  }

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to a server
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Header */}
      <section className="bg-primary text-white py-12 relative">
        <div className="container mx-auto">
          <h1 className="text-4xl font-montserrat font-bold">Contact Us</h1>
          <p className="text-light mt-2">We'd love to hear from you. Get in touch with our team today.</p>
        </div>
        <div className="absolute top-3 right-3 z-10">
          <AdminEditButton type="page" id="contact" label="Edit" />
        </div>
      </section>



      {/* Contact Content */}
      <section className="flex-grow py-20">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-montserrat font-bold mb-8">Send us a Message</h2>

              {submitted && (
                <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
                  Thank you! We'll get back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-primary font-bold mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent outline-none transition"
                    placeholder="Your Name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-primary font-bold mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent outline-none transition"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-primary font-bold mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent outline-none transition"
                      placeholder="+254 712 345 678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-primary font-bold mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent outline-none transition"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-primary font-bold mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent outline-none transition resize-none"
                    placeholder="Your message here..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-accent hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-montserrat font-bold mb-8">Get in Touch</h2>

              <div className="space-y-6 mb-12">
                <div className="bg-light rounded-lg p-6 flex gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-primary mb-1">Phone</h3>
                    <p className="text-gray-700">{(pageData && (pageData.contactPhone || pageData.phone)) || '+254 112 961 056'}</p>
                    <p className="text-gray-600 text-sm">Mon-Fri, 8am-5pm EAT</p>
                  </div>
                </div>

                <div className="bg-light rounded-lg p-6 flex gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-primary mb-1">Email</h3>
                    <p className="text-gray-700">{(pageData && (pageData.contactEmail || pageData.email)) || 'pk.automations.ke@gmail.com'}</p>
                    <p className="text-gray-600 text-sm">We reply within 24 hours</p>
                  </div>
                </div>

                <div className="bg-light rounded-lg p-6 flex gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-primary mb-1">Location</h3>
                    <p className="text-gray-700">{(pageData && pageData.location) ? pageData.location.split('\n').map((l, i) => <span key={i} className="block">{l}</span>) : (<><span className="block">Nairobi, Kenya</span><span className="block">Munyu Road Business Center</span></>)}</p>
                  </div>
                </div>

                <div className="bg-light rounded-lg p-6 flex gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-primary mb-1">WhatsApp</h3>
                    <a
                      href={pageData && pageData.whatsapp ? `https://wa.me/${(pageData.whatsapp||'').replace(/[^0-9]/g,'')}` : 'https://wa.me/254112961056'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-orange-600 font-bold"
                    >
                      Chat with us now
                    </a>
                    <p className="text-gray-600 text-sm">Quick responses</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-light rounded-lg h-96 overflow-hidden relative">
                <iframe
                  title="PK Automations Location"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={(pageData && pageData.mapEmbed) ? pageData.mapEmbed : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.823146906827!2d36.80177742346897!3d-1.3029340628620405!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f119e76de2f8f%3A0x8c2b5c2c2c2c2c2c!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2ske!4v1700000000000"}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="py-16 bg-light">
        <div className="container mx-auto">
          <h2 className="text-3xl font-montserrat font-bold text-center mb-12">Quick Answers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {((pageData && pageData.quickAnswers) ? pageData.quickAnswers : [
              'What are your business hours?|Mon-Fri: 8am-5pm, Sat: 9am-2pm EAT',
              'Do you ship outside Kenya?|Yes, we ship across East Africa with tracking',
              'What is your return policy?|30-day money-back guarantee on most products',
              'Do you offer bulk discounts?|Yes! Contact us for wholesale pricing'
            ]).map((raw, idx) => {
              // support string "Q|A", object { q,a }, or legacy answer-only strings
              let q = '';
              let a = '';

              if (typeof raw === 'string') {
                if (raw.includes('|')) {
                  const parts = raw.split('|'); q = parts[0].trim(); a = parts[1].trim();
                } else {
                  // legacy answer-only format: infer a question
                  a = raw.trim();
                  q = inferQuestionFromAnswer(a);
                }
              } else if (raw && typeof raw === 'object') {
                q = (raw.q || raw.question || raw.title || '').trim();
                a = (raw.a || raw.answer || raw.text || '').trim();
                if (!q && a) q = inferQuestionFromAnswer(a);
              }

              return (
                <div key={idx} className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-start md:items-center text-left md:text-center min-h-[8rem] transition-transform hover:-translate-y-1">
                  {q ? <div className="text-lg text-gray-700 mb-2 font-semibold">{q}</div> : null}
                  <div className="text-primary font-bold text-xl md:text-2xl leading-snug md:leading-normal">{a}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
