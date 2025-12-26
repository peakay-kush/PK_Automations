'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminEditButton from '@/components/AdminEditButton';
import AdminInlineControls from '@/components/AdminInlineControls';
import ProductCard from '@/components/ProductCard';
import TestimonialCard from '@/components/TestimonialCard';
import ImageWithFade from '@/components/ImageWithFade';
import { testimonials, services } from '@/data/products';
import { apiFetch } from '@/utils/api';
import { products as staticProducts } from '@/data/products';
import { ArrowRight, Zap, Heart, Code, Settings, BookOpen } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState(staticProducts);
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/pages/home');
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setPageData(json);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // listen for admin updates so pageData refreshes immediately when 'home' is edited
  useEffect(() => {
    const handler = (e) => {
      const d = (e && e.detail) || {};
      if (d.type === 'page' && d.id === 'home') {
        (async () => {
          try {
            const res = await fetch('/api/pages/home');
            if (res.ok) {
              const json = await res.json();
              setPageData(json);
            }
          } catch (err) { /* ignore */ }
        })();
      }
    };
    window.addEventListener('adminUpdated', handler);
    return () => window.removeEventListener('adminUpdated', handler);
  }, []);

  useEffect(() => {
    // try to fetch the dynamic products from API (includes uploaded images)
    (async () => {
      try {
        const res = await apiFetch('/api/products');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) setProducts(json);
        }
      } catch (e) {
        // keep static fallback
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const servicesIcons = {
    'Zap': Zap,
    'Heart': Heart,
    'Code': Code,
    'Settings': Settings,
    'BookOpen': BookOpen,
  };

  const featuredProducts = (products || staticProducts).slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-accent text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-5 rounded-full -ml-40 -mb-40"></div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="absolute top-3 right-3 z-10"><AdminEditButton type="page" id="home" label="Edit" /></div>
            <h1 className="text-5xl md:text-6xl font-montserrat font-bold mb-6 leading-tight">
              { (pageData && pageData.heroTitle) ? pageData.heroTitle : 'Innovate. Automate. Elevate.' }
            </h1>
            <p className="text-xl md:text-2xl text-light mb-8 leading-relaxed max-w-2xl">
              { (pageData && pageData.heroSubtitle) ? pageData.heroSubtitle : 'Your trusted partner in electronics, automation, and innovation. Quality products and expert services.' }
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={(pageData && pageData.ctaPrimaryHref) ? pageData.ctaPrimaryHref : '/shop'}
                className="bg-accent hover:bg-orange-600 text-primary font-bold py-4 px-8 rounded-lg transition flex items-center justify-center gap-2 text-lg"
              >
                {(pageData && pageData.ctaPrimaryText) ? pageData.ctaPrimaryText : 'Shop Components'} <ArrowRight size={20} />
              </Link>
              <Link
                href={(pageData && pageData.ctaSecondaryHref) ? pageData.ctaSecondaryHref : '/services'}
                className="border-2 border-white hover:bg-white hover:text-primary text-white font-bold py-4 px-8 rounded-lg transition flex items-center justify-center gap-2 text-lg"
              >
                {(pageData && pageData.ctaSecondaryText) ? pageData.ctaSecondaryText : 'Explore Services'} <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-light">
        <div className="container mx-auto">
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-4xl font-montserrat font-bold text-center mb-16">{(pageData && pageData.servicesTitle) ? pageData.servicesTitle : 'Our Services'}</h2>
            <div className="ml-4"><AdminEditButton type="page" id="home" field="servicesTitle" label="Edit" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {services.map((service) => {
              const IconComponent = servicesIcons[service.icon] || Code;
              return (
                <div key={service.id} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition text-center relative overflow-hidden">
                  <div className="absolute top-3 right-3 z-10"><AdminInlineControls type="service" id={service.id} /></div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                    <IconComponent size={32} className="text-white" />
                  </div>
                  <h3 className="font-montserrat font-bold text-lg mb-2">{service.title}</h3>
                  <p className="text-gray-600 text-sm">{service.description.substring(0, 60)}...</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-montserrat font-bold">Featured Products</h2>
            <Link href="/shop" className="text-accent hover:text-orange-600 font-bold flex items-center gap-2">
              View All <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} featured={idx < 3} />
            ))}
          </div>
        </div>
      </section>

      {/* Student Hub Preview */}
      <section className="py-20 text-gray-900">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
          <div className="container mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4"><h2 className="text-4xl font-montserrat font-bold mb-6">{(pageData && pageData.studentHubTitle) ? pageData.studentHubTitle : 'Student Hub'}</h2><AdminEditButton type="page" id="home" field="studentHubSection" label="Edit" /></div>
                <p className="text-gray-700 text-lg mb-6">{(pageData && pageData.studentHubContent) ? pageData.studentHubContent : 'Everything you need to succeed in your engineering projects. Consultation, coding help, simulations, and more.'}</p>
                <ul className="space-y-4 mb-8">
                  {(pageData && Array.isArray(pageData.studentHubBullets) ? pageData.studentHubBullets : [
                    'Project Consultation & Guidance',
                    'DIY Tutorials & Code Samples',
                    'Proteus/Multisim Support',
                    'AutoCAD floor plan drawings',
                    'Custom Project Kits'
                  ]).map((bullet, idx) => {
                    const text = (typeof bullet === 'string') ? bullet : (bullet && (bullet.name || bullet.desc) ? (bullet.name || bullet.desc) : '');
                    return (
                      <li key={idx} className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">✓</span>
                        <span>{text}</span>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href={(pageData && pageData.studentHubCTAHref) ? pageData.studentHubCTAHref : '/student-hub'}
                  className="bg-accent hover:bg-accent/90 text-white font-bold py-3 px-6 rounded-lg transition inline-flex items-center gap-2"
                >
                  {(pageData && pageData.studentHubCTAText) ? pageData.studentHubCTAText : 'Explore Student Hub'} <ArrowRight size={20} />
                </Link>
              </div>
              <div className="bg-white rounded-lg p-8 flex items-center justify-center h-96 shadow-lg">
                <div className="w-full h-full rounded-lg overflow-hidden">
                  <ImageWithFade
                    src={(pageData && pageData.studentHubImage) ? pageData.studentHubImage : 'https://via.placeholder.com/400x300?text=Student+Hub'}
                    alt="Student Hub"
                    className="w-full h-full object-cover object-center"
                    placeholderColor="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-light">
        <div className="container mx-auto">
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-4xl font-montserrat font-bold text-center mb-16">{(pageData && pageData.testimonialsTitle) ? pageData.testimonialsTitle : 'What Our Customers Say'}</h2>
            <div className="ml-4"><AdminEditButton type="page" id="home" field="studentTestimonials" label="Manage Stories" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(pageData && Array.isArray(pageData.studentTestimonials) ? pageData.studentTestimonials : testimonials).map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent to-orange-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-montserrat font-bold mb-6">{(pageData && pageData.ctaSectionTitle) ? pageData.ctaSectionTitle : 'Ready to Get Started?'}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">{(pageData && pageData.ctaSectionText) ? pageData.ctaSectionText : 'Join thousands of customers who trust PK Automations for their electronics and automation needs.'}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="bg-white hover:bg-light text-accent font-bold py-3 px-8 rounded-lg transition"
            >
              {(pageData && pageData.ctaSectionPrimaryText) ? pageData.ctaSectionPrimaryText : 'Start Shopping'}
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white hover:bg-white hover:text-accent text-white font-bold py-3 px-8 rounded-lg transition"
            >
              {(pageData && pageData.ctaSectionSecondaryText) ? pageData.ctaSectionSecondaryText : 'Contact Us'}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
