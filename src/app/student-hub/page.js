'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/utils/auth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';       
import { products as staticProducts, tutorials as staticTutorials, services as staticServices } from '@/data/products';
import AdminSectionControls from '@/components/AdminSectionControls';
import AdminInlineControls from '@/components/AdminInlineControls';
import AdminEditButton from '@/components/AdminEditButton';
import ImageWithFade from '@/components/ImageWithFade';
import { ArrowRight, Book, Code, Lightbulb, Users, Settings, Image as ImageIcon, Zap, Heart, BookOpen } from 'lucide-react';
import Link from 'next/link';

const servicesIcons = { Zap, Heart, Code, Settings, BookOpen };

export default function StudentHub() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pageData, setPageData] = useState(null);
  const [servicesList, setServicesList] = useState([]);
  // dynamic/fallback states for tutorials & products used by Student Hub
  const [productsState, setProducts] = useState(staticProducts);
  const [tutorialsState, setTutorials] = useState(staticTutorials);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login?redirect=/student-hub');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // fetch services, tutorials and products (public endpoints) and home page data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sres = await fetch('/api/services');
        if (sres.ok) {
          const json = await sres.json();
          if (mounted) setServicesList(Array.isArray(json) ? json : staticServices);
        } else {
          if (mounted) setServicesList(staticServices);
        }
      } catch (e) { if (mounted) setServicesList(staticServices); }

      try {
        const pres = await fetch('/api/pages/home');
        if (pres.ok) {
          const pj = await pres.json();
          if (mounted) setPageData(pj);
        }
      } catch (e) { /* ignore */ }

      // fetch tutorials (dynamic) so admin-uploaded thumbnails appear here
      try {
        const tres = await fetch('/api/tutorials');
        if (tres.ok) {
          const tj = await tres.json();
          const arr = Array.isArray(tj) ? tj : (tj.tutorials || []);
          if (mounted) setTutorials(arr.length ? arr : staticTutorials);
        } else {
          if (mounted) setTutorials(staticTutorials);
        }
      } catch (e) { if (mounted) setTutorials(staticTutorials); }

      // fetch products (dynamic) so uploaded product images show in Student Hub
      try {
        const presP = await fetch('/api/products');
        if (presP.ok) {
          const pj = await presP.json();
          if (mounted) setProducts(Array.isArray(pj) ? pj : staticProducts);
        } else {
          if (mounted) setProducts(staticProducts);
        }
      } catch (e) { if (mounted) setProducts(staticProducts); }
    })();

    const updHandler = (e) => {
      const d = (e && e.detail) || {};
      if (d.type === 'service') {
        // refresh services
        (async () => { try { const r = await fetch('/api/services'); if (r.ok) { const j = await r.json(); setServicesList(Array.isArray(j) ? j : staticServices); } } catch (err) { setServicesList(staticServices); } })();
      }

      if (d.type === 'page' && d.id === 'home') {
        (async () => { try { const r = await fetch('/api/pages/home'); if (r.ok) { const j = await r.json(); setPageData(j); } } catch (err) {} })();
      }

      // refresh tutorials and products on relevant admin updates
      if (d.type === 'tutorial') {
        (async () => { try { const r = await fetch('/api/tutorials'); if (r.ok) { const j = await r.json(); const arr = Array.isArray(j) ? j : (j.tutorials || []); setTutorials(arr.length ? arr : staticTutorials); } } catch (err) { setTutorials(staticTutorials); } })();
      }

      if (d.type === 'product') {
        (async () => { try { const r = await fetch('/api/products'); if (r.ok) { const j = await r.json(); setProducts(Array.isArray(j) ? j : staticProducts); } } catch (err) { setProducts(staticProducts); } })();
      }
    };
    window.addEventListener('adminUpdated', updHandler);

    return () => { mounted = false; window.removeEventListener('adminUpdated', updHandler); };
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  // use dynamic/fetched products & tutorials when available (fallback to static imports)
  const studentProducts = productsState.filter(p => ['DIY Kits', 'Training', 'Services'].includes(p.category));
  const studentTutorials = tutorialsState.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Header */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-16">
          <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-montserrat font-bold mb-4">Student Hub</h1>
            <p className="text-light text-xl max-w-2xl">
              Your one-stop platform for learning, building, and mastering electronics and engineering projects
            </p>
          </div>

          {/* Single page-level editor for Student Hub (edits home page Student Hub section) */}
          <div className="mt-2"><AdminEditButton type="page" id="home" label="Edit" /></div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services-section" className="py-16 bg-light">
        <div className="container mx-auto">
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-3xl font-montserrat font-bold mb-12 text-center">What We Offer Students</h2>
            <div className="ml-4"><AdminEditButton type="page" id="home" field="manageServices" label="Manage Services" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesList.slice(0,5).map((service) => {
              const IconComponent = servicesIcons[service.icon] || Lightbulb;
              return (
                <div key={service.id} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition text-center relative overflow-hidden">
                  <div className="absolute top-3 right-3 z-10">
                    <AdminInlineControls type="service" id={service.id} />
                  </div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                    {service.image ? <img src={service.image} alt="" className="w-10 h-10" /> : <IconComponent size={32} className="text-white" />}
                  </div>
                  <h3 className="font-montserrat font-bold text-lg mb-2">{service.name || service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Tutorials */}
      <section className="py-16">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4"><h2 className="text-3xl font-montserrat font-bold">Featured Tutorials</h2><AdminEditButton type="page" id="home" field="studentHubTitle" label="Edit" /></div>
            <Link href="/tutorials" className="text-accent hover:text-orange-600 font-bold flex items-center gap-2">
              View All <ArrowRight size={20} />
            </Link>
          </div>

          {/* Admin controls for tutorials in Student Hub */}
          <AdminSectionControls type="tutorial" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {studentTutorials.map((tutorial) => (
              <div key={tutorial.id} className="bg-light rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
                <div className="h-40 bg-primary overflow-hidden relative" style={{ contain: 'paint' }}>
                  <div className="absolute top-3 right-3 z-10">
                    <AdminInlineControls type="tutorial" id={tutorial.id} />
                  </div>
                  { (tutorial.thumbnail || tutorial.image) ? (
                    <ImageWithFade src={tutorial.thumbnail || tutorial.image} alt={tutorial.title} className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-500 p-4">
                      <ImageIcon size={36} />
                    </div>
                  ) }
                </div>
                <div className="p-6">
                  <h3 className="font-montserrat font-bold text-lg mb-2">{tutorial.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{tutorial.excerpt}</p>
                  <Link
                    href={`/tutorial/${tutorial.id}`}
                    className="text-accent hover:text-orange-600 font-bold flex items-center gap-2"
                  >
                    Read More <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Kits */}
      <section className="py-16 bg-light">
        <div className="container mx-auto">
          <h2 className="text-3xl font-montserrat font-bold mb-12 text-center">Student Project Kits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentProducts.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-montserrat font-bold mb-6">{(pageData && pageData.consultationTitle) ? pageData.consultationTitle : 'Book a Project Consultation'}</h2>
                <AdminEditButton type="page" id="home" field="manageConsultation" label="Manage Consultation" />
              </div>
              <p className="text-light text-lg mb-6">{(pageData && pageData.consultationContent) ? pageData.consultationContent : 'Need help with your project? Our expert engineers are ready to assist you with guidance, code review, and solutions.'}</p>
              <ul className="space-y-4 mb-8">
                {(pageData && Array.isArray(pageData.consultationBullets) ? pageData.consultationBullets : [
                  '1-hour personalized consultation',
                  'Code review and optimization',
                  'Circuit simulation support',
                  'Documentation and mentoring'
                ]).map((b, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-sm">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="bg-accent hover:bg-orange-600 text-primary font-bold py-3 px-8 rounded-lg transition inline-flex items-center gap-2"
              >
                Book Consultation <ArrowRight size={20} />
              </Link>
            </div>
            <div className="bg-white rounded-lg p-8 flex items-center justify-center h-96 shadow-lg relative">
              <img
                src={(pageData && pageData.consultationImage) ? pageData.consultationImage : 'https://via.placeholder.com/400x300?text=Consultation'}
                alt="Consultation"
                className="rounded-lg w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-16">
        <div className="container mx-auto">
          <div className="flex items-center justify-center mb-6"><h2 className="text-3xl font-montserrat font-bold mb-12 text-center">Simulation Tools Support</h2><div className="ml-4"><AdminEditButton type="page" id="home" field="studentHubBullets" label="Edit" /></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(() => {
              const defaultTools = [
                { name: 'Proteus', desc: 'Circuit design and PCB layout' },
                { name: 'Multisim', desc: 'SPICE circuit simulation' },
                { name: 'Arduino IDE', desc: 'Microcontroller programming' },
                { name: 'Keil uVision', desc: 'Embedded systems development' }
              ];

              const raw = (pageData && Array.isArray(pageData.studentHubBullets) && pageData.studentHubBullets.length > 0) ? pageData.studentHubBullets : defaultTools;
              return raw.map((t, idx) => {
                const tool = (typeof t === 'string') ? { name: t, desc: '' } : (t || { name: '', desc: '' });
                return (
                  <div key={idx} className="bg-light rounded-lg p-6 text-center hover:shadow-lg transition">
                    <h3 className="font-montserrat font-bold text-lg text-primary mb-2">{tool.name}</h3>
                    <p className="text-gray-600">{tool.desc}</p>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* Testimonials from Students */}
      <section className="py-16 bg-light">
        <div className="container mx-auto">
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-3xl font-montserrat font-bold mb-12 text-center">Student Success Stories</h2>
            <div className="ml-4">
              <AdminEditButton type="page" id="home" field="studentTestimonials" label="Manage Stories" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(pageData && Array.isArray(pageData.studentTestimonials) ? pageData.studentTestimonials : [
              { name: 'Alex Kipkorir', project: 'Smart Home IoT System', story: 'With PK Automations guidance, I completed my final year project and got a distinction!' },
              { name: 'Maria Nakinyete', project: 'Biomedical Monitoring Device', story: 'Their biomedical expertise helped me develop and test my patient monitoring system.' },
              { name: 'David Omondi', project: 'Robotics Project', story: 'The project consultation and component selection made my drone project a success.' }
            ]).map((student, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition">
                <h3 className="font-montserrat font-bold text-lg text-primary mb-2">{student.name}</h3>
                <p className="text-accent font-bold text-sm mb-3">{student.project}</p>
                <p className="text-gray-700 italic">"{student.story}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
