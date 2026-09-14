import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-border-hairline pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="font-heading text-2xl font-semibold text-primary lowercase block mb-4">
              parchi
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Helping patients and clinics track health trends through precise lab data analysis.
              Understand your health. Track your progress. Stay informed.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-text-heading mb-4 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/patient-dashboard" className="text-sm text-text-muted hover:text-primary transition-colors">Patient Trends</Link></li>
              <li><Link to="/clinic-dashboard" className="text-sm text-text-muted hover:text-primary transition-colors">Clinic Portal</Link></li>
              <li><Link to="/signup" className="text-sm text-text-muted hover:text-primary transition-colors">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-text-heading mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-text-heading mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">FAQ</a></li>
              <li><Link to="/forgot-password" className="text-sm text-text-muted hover:text-primary transition-colors">Account Recovery</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border-hairline flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Parchi Healthcare. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-text-muted hover:text-primary transition-colors"><span className="sr-only">Twitter</span>🐦</a>
            <a href="#" className="text-text-muted hover:text-primary transition-colors"><span className="sr-only">LinkedIn</span>💼</a>
            <a href="#" className="text-text-muted hover:text-primary transition-colors"><span className="sr-only">GitHub</span>💻</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
