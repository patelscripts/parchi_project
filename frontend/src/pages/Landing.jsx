import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, User, Building2, Activity, ShieldCheck } from 'lucide-react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import TrendChart from '../components/TrendChart';

const Landing = () => {
  const mockTrendData = [
    { date: 'Jan', value: 0.8 },
    { date: 'Mar', value: 0.9 },
    { date: 'May', value: 1.1 },
    { date: 'Jul', value: 1.2 },
    { date: 'Sep', value: 1.3 },
    { date: 'Nov', value: 1.5 },
  ];

  const mockSeries = [{ key: 'value', color: '#5ea8a8', label: 'Creatinine' }];
  const mockThreshold = { value: 1.3, label: '1.3 mg/dL' };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="flex items-center justify-center px-4 py-12 text-center">
          <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-heading font-bold text-text-heading leading-tight mb-6">
                See the trend in your reports <br />
                <span className="text-primary">before a single one looks abnormal</span>
              </h1>
              <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                Parchi helps you track key health markers over time. By analyzing your
                historical lab reports, we visualize directions and trends, giving you
                and your doctor a clearer picture of your health journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-start">
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-primary text-white rounded-xl font-medium text-lg hover:bg-primary-dark transition-all shadow-soft hover:shadow-md flex items-center justify-center gap-2"
                >
                  Get Started for Free <ArrowRight size={20} />
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white text-text-main border border-border-hairline rounded-xl font-medium text-lg hover:bg-gray-50 transition-all"
                >
                  Log In to Account
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary-light/30 rounded-full blur-3xl"></div>
              <div className="relative bg-white p-6 rounded-2xl shadow-soft border border-border-hairline w-full">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-heading font-semibold text-text-heading">Health Trend Analysis</h3>
                    <p className="text-xs text-text-muted">Tracking: Serum Creatinine</p>
                  </div>
                  <div className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">
                    Trend: Rising
                  </div>
                </div>
                <TrendChart
                  data={mockTrendData}
                  series={mockSeries}
                  threshold={mockThreshold}
                  thresholdSource="KDIGO Reference"
                />
                <div className="mt-8 pt-6 border-t border-border-hairline flex justify-between items-center">
                  <div className="text-xs text-text-muted">
                    Last report: <span className="font-medium text-text-main">Nov 2026</span>
                  </div>
                  <div className="text-xs font-medium text-primary">
                    Projected crossing in 3 months
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Explore Section - Links to all pages */}
        <div className="bg-white py-20 border-y border-border-hairline">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-heading font-bold text-text-heading mb-4">Explore Parchi</h2>
              <p className="text-text-secondary max-w-xl mx-auto">
                Experience how Parchi transforms raw lab data into actionable health trends for both patients and clinics.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Patient Dashboard',
                  desc: 'View your health trends and upload reports.',
                  icon: <User className="text-primary" />,
                  link: '/patient-dashboard',
                  color: 'bg-primary-light'
                },
                {
                  title: 'Clinic Portal',
                  desc: 'Manage linked patients and monitor trends.',
                  icon: <Building2 className="text-secondary" />,
                  link: '/clinic-dashboard',
                  color: 'bg-secondary-light'
                },
                {
                  title: 'Account Creation',
                  desc: 'Join Parchi as a patient or clinic.',
                  icon: <ShieldCheck className="text-success" />,
                  link: '/signup',
                  color: 'bg-green-100'
                },
                {
                  title: 'Health Insights',
                  desc: 'See how we visualize lab data trends.',
                  icon: <Activity className="text-accent" />,
                  link: '/patient-dashboard',
                  color: 'bg-teal-100'
                }
              ].map((item, i) => (
                <Link
                  key={i}
                  to={item.link}
                  className="group p-6 bg-white border border-border-hairline rounded-2xl hover:border-primary transition-all shadow-soft hover:shadow-md flex flex-col items-start gap-4"
                >
                  <div className={`p-3 rounded-xl ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="w-full">
                    <h3 className="font-heading font-semibold text-text-heading mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-text-muted">{item.desc}</p>
                  </div>
                  <div className="mt-auto flex items-center text-xs font-medium text-primary group-hover:gap-2 transition-all">
                    Explore <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
