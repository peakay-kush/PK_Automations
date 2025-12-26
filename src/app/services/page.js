'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import servicesFile from '@/data/services';
import { ArrowRight, Zap, Heart, Code, Settings, BookOpen, Check } from 'lucide-react';
import Link from 'next/link';
import AdminInlineControls from '@/components/AdminInlineControls';
import AdminSectionControls from '@/components/AdminSectionControls';
import AdminEditButton from '@/components/AdminEditButton';

const services = (servicesFile && servicesFile.services) ? servicesFile.services : [];

export default function Services() {
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/pages/services');
        if (r.ok) {
          const pj = await r.json();
          setPageData(pj);
        }
      } catch (err) {}
    })();
  }, []);

  const servicesIcons = {
    'Zap': Zap,
    'Heart': Heart,
    'Code': Code,
    'Settings': Settings,
    'BookOpen': BookOpen,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Header */}
      <section className="bg-primary text-white py-12">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-montserrat font-bold">{(pageData && (pageData.heroTitle || pageData.title)) ? (pageData.heroTitle || pageData.title) : 'Our Services'}</h1>
            <p className="text-light mt-2">{(pageData && pageData.heroSubtitle) ? pageData.heroSubtitle : 'Professional solutions tailored to your needs'}</p>
          </div>
          <div className="mt-2"><AdminEditButton type="page" id="services" label="Edit" /></div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 flex-grow">
        <div className="container mx-auto">
          {/* Admin controls when in edit mode */}
          <AdminSectionControls type="service" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => {
              const IconComponent = servicesIcons[service.icon] || Code;
              return (
                <div key={service.id} className="bg-light rounded-lg p-8 hover:shadow-lg transition relative">
                  <div className="absolute top-3 right-3 z-10">
                    <AdminInlineControls type="service" id={service.id} />
                  </div>

                  <Link href={`/services/${service.id}`} className="block text-inherit no-underline">
                    <div className="w-16 h-16 mb-6 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                      <IconComponent size={32} className="text-white" />
                    </div>

                    <h3 className="font-montserrat font-bold text-2xl mb-3">{service.title || service.name} {service.publishWork ? <span className="ml-2 inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Work</span> : null}</h3>
                    <p className="text-gray-700 mb-6">{service.description}</p>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {(service.features || []).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="text-accent" size={20} />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </Link>

                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="font-montserrat font-bold text-primary">{service.price}</span>
                    <Link
                      href="/contact"
                      className="bg-accent hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2"
                    >
                      Request Quote <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto">
          <h2 className="text-4xl font-montserrat font-bold text-center mb-16">Why Choose PK Automations?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Expert Team', desc: '10+ years of experience in electronics and automation' },
              { title: 'Quality Products', desc: 'Only certified and tested components' },
              { title: 'Affordable Pricing', desc: 'Competitive rates without compromising quality' },
              { title: '24/7 Support', desc: 'Dedicated customer support whenever you need us' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                  <Check className="text-primary" size={24} />
                </div>
                <h3 className="font-montserrat font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-light text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-light">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-montserrat font-bold mb-6">Need a Custom Solution?</h2>
          <p className="text-gray-700 text-lg mb-8 max-w-2xl mx-auto">
            Contact us today to discuss your specific needs and get a personalized quote.
          </p>
          <Link
            href="/contact"
            className="bg-accent hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition inline-flex items-center gap-2"
          >
            Contact Our Team <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
