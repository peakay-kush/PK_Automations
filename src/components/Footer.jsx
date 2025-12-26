'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-montserrat font-bold text-lg mb-4 text-accent">PK Automations</h3>
            <p className="text-light text-sm leading-relaxed">
              Your trusted partner in electronics, automation, and innovation. We deliver quality products and services since 2015.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-montserrat font-bold text-lg mb-4 text-accent">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-accent transition">Home</Link></li>
              <li><Link href="/shop" className="hover:text-accent transition">Shop</Link></li>
              <li><Link href="/services" className="hover:text-accent transition">Services</Link></li>
              <li><Link href="/student-hub" className="hover:text-accent transition">Student Hub</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-montserrat font-bold text-lg mb-4 text-accent">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tutorials" className="hover:text-accent transition">Tutorials</Link></li>
              <li><Link href="/about" className="hover:text-accent transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition">Contact</Link></li>
              <li><a href="#faq" className="hover:text-accent transition">FAQ</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-montserrat font-bold text-lg mb-4 text-accent">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <a href="tel:+254712345678" className="hover:text-accent transition">+254 712 345 678</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <a href="mailto:info@pkautomations.com" className="hover:text-accent transition">info@pkautomations.com</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition">
              <Facebook size={20} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition">
              <Twitter size={20} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition">
              <Instagram size={20} />
            </a>
            <a href="https://wa.me/254712345678" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition">
              <MessageCircle size={20} />
            </a>
          </div>

          <p className="text-sm text-light">
            © 2025 PK Automations. All rights reserved. | <a href="#privacy" className="hover:text-accent transition">Privacy Policy</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function MessageCircle(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
