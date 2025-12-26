import Header from '@/components/Header';
import Footer from '@/components/Footer';
import servicesFile from '@/data/services';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ServiceWorks from '@/components/ServiceWorks';

export default function ServiceDetail({ params }) {
  const id = parseInt(params.id, 10);
  const service = (servicesFile && servicesFile.services) ? servicesFile.services.find((s) => s.id === id) : null;
  if (!service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto py-20">
          <h2 className="text-2xl font-bold">Service not found</h2>
          <p className="mt-4">We couldn't find that service.</p>
          <Link href="/services" className="mt-6 inline-block text-accent">Back to services</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto py-12">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/services" className="text-gray-600 flex items-center gap-2"><ArrowLeft /> Back</Link>
          <h1 className="text-3xl font-bold">{service.name || service.title}</h1>
        </div>

        {service.images && service.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {service.images.map((img, idx) => (
              <img key={idx} src={img} alt={`img-${idx}`} className="w-full h-96 object-cover rounded" />
            ))}
          </div>
        )}


        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Works</h3>
          <ServiceWorks works={service.works || []} publish={service.publishWork} serviceId={service.id} />
        </div>

      </main>
      <Footer />
    </div>
  );
}