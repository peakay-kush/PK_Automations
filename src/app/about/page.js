'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import AdminInlineControls from '@/components/AdminInlineControls';
import AdminSectionControls from '@/components/AdminSectionControls';
import { useEffect, useState } from 'react';

export default function About() {
  const [teamData, setTeamData] = useState([]);
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchTeam = async () => {
      try {
        const res = await fetch('/api/team');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setTeamData(data || []);
      } catch (e) {
        if (mounted) setTeamData([]);
      }
    };

    const fetchPage = async () => {
      try {
        const res = await fetch('/api/pages/about');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setPageData(data || null);
      } catch (e) {
        if (mounted) setPageData(null);
      }
    };

    fetchTeam();
    fetchPage();

    const onUpdated = (e) => {
      if (e && e.detail && e.detail.type === 'team') fetchTeam();
      if (e && e.detail && e.detail.type === 'page' && e.detail.id === 'about') fetchPage();
      // always refresh team when any admin change occurs to keep UI fresh
      if (e && e.detail && e.detail.type === 'team') fetchTeam();
    };
    window.addEventListener('adminUpdated', onUpdated);
    return () => { mounted = false; window.removeEventListener('adminUpdated', onUpdated); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Header (hero removed) */}
      <section className="bg-primary text-white py-6 relative">
        <div className="container mx-auto p-4" style={{ maxWidth: 'min(1200px, 95%)' }}>
          <h1 className="text-3xl md:text-4xl font-montserrat font-bold">{pageData && pageData.title ? pageData.title : 'About PK Automations'}</h1>
          <p className="text-light mt-2">{pageData && pageData.subtitle ? pageData.subtitle : 'Innovating since 2015'}</p>
        </div>
        <div className="absolute top-3 right-3 z-10">
          <AdminInlineControls type="page" id="about" />
        </div>
      </section>

      <div className="container mx-auto mt-6">
        <AdminSectionControls type="page" />
      </div>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-montserrat font-bold mb-6">Our Story</h2>
            {pageData && pageData.content ? (
              pageData.content.split(/\n\n+/).map((p, i) => (
                <p key={i} className="text-gray-700 mb-4 text-lg">{p}</p>
              ))
            ) : (
              <>
                <p className="text-gray-700 mb-4 text-lg">
                  PK Automations was founded in 2025 with a simple mission: to make advanced electronics and automation solutions accessible to everyone.
                </p>
                <p className="text-gray-700 mb-4 text-lg">
                  What started as a small electronics shop has grown into a comprehensive service provider offering everything from quality components to custom engineering solutions.
                </p>
                <p className="text-gray-700 text-lg">
                  Today, we serve thousands of customers including students, businesses, and organizations across East Africa.
                </p>
              </>
            )}
          </div>
          <div className="bg-light rounded-lg p-8 flex items-center justify-center h-96">
            <img
              src={(pageData && pageData.heroImage) ? pageData.heroImage : "https://via.placeholder.com/400x300?text=Our+Story"}
              alt="Our Story"
              className="rounded-lg w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-light">
        <div className="container mx-auto">
          <h2 className="text-3xl font-montserrat font-bold text-center mb-12">Our Commitment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="font-montserrat font-bold text-xl text-primary mb-4">Our Mission</h3>
              <p className="text-gray-700">
                {pageData && pageData.mission ? pageData.mission : 'To provide high-quality electronics components, innovative solutions, and expert guidance that empower individuals and businesses to innovate and automate.'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="font-montserrat font-bold text-xl text-primary mb-4">Our Vision</h3>
              <p className="text-gray-700">
                {pageData && pageData.vision ? pageData.vision : 'To be the leading electronics and automation solutions provider in East Africa, known for quality, innovation, and customer excellence.'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="font-montserrat font-bold text-xl text-primary mb-4">Our Values</h3>
              <ul className="text-gray-700 space-y-2">
                {(pageData && Array.isArray(pageData.values) && pageData.values.length) ? (
                  pageData.values.map((v, i) => <li key={i}>✓ {v}</li>)
                ) : (
                  <>
                    <li>✓ Quality & Excellence</li>
                    <li>✓ Customer First</li>
                    <li>✓ Innovation & Learning</li>
                    <li>✓ Reliability & Trust</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container mx-auto">          <div className="mb-6">
            <AdminSectionControls type="team" />
          </div>
          <h2 className="text-3xl font-montserrat font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(teamData || []).map((member) => (
              <div key={member.id} className="text-center relative bg-white rounded-lg p-6 shadow-lg">
                <div className="absolute top-3 right-3 z-10">
                  <AdminInlineControls type="team" id={member.id} />
                </div>
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="font-montserrat font-bold text-lg text-primary">{member.name}</h3>
                <p className="text-accent font-bold">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-montserrat font-bold text-center mb-12">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: '10+ Years', desc: 'Industry Experience' },
              { title: '5000+', desc: 'Happy Customers' },
              { title: '20+', desc: 'Service Categories' },
              { title: '24/7', desc: 'Customer Support' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-montserrat font-bold text-accent mb-2">{item.title}</div>
                <p className="text-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-montserrat font-bold mb-6">Ready to Work With Us?</h2>
          <p className="text-gray-700 text-lg mb-8 max-w-2xl mx-auto">
            Whether you need products, services, or consultation, we're here to help bring your ideas to life.
          </p>
          <Link
            href="/contact"
            className="bg-accent hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition inline-flex items-center gap-2"
          >
            Get in Touch <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
