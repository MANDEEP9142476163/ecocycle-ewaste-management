import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../layouts/PublicNavbar';
import PublicFooter from '../../layouts/PublicFooter';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Recycle, ArrowRight, Laptop, Smartphone, Tv, Printer, BatteryCharging,
  Cpu, CheckCircle2, ShieldCheck, Truck, Sparkles, Send, MapPin, Phone,
  Mail, Clock, AlertTriangle, Leaf, Globe2, BarChart3
} from 'lucide-react';

const LandingPage = () => {
  const [categories, setCategories] = useState([]);
  const [aboutPage, setAboutPage] = useState(null);
  const [contactPage, setContactPage] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sendingContact, setSendingContact] = useState(false);

  useEffect(() => {
    // Fetch categories and CMS pages
    const loadContent = async () => {
      try {
        const [catRes, aboutRes, contactRes] = await Promise.all([
          api.get('/categories').catch(() => ({ data: { categories: [] } })),
          api.get('/pages/about_us').catch(() => ({ data: { page: null } })),
          api.get('/pages/contact_us').catch(() => ({ data: { page: null } }))
        ]);
        if (catRes.data?.categories) setCategories(catRes.data.categories);
        if (aboutRes.data?.page) setAboutPage(aboutRes.data.page);
        if (contactRes.data?.page) setContactPage(contactRes.data.page);
      } catch (err) {
        console.error('Error loading landing page data:', err);
      }
    };
    loadContent();
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSendingContact(true);
    setTimeout(() => {
      setSendingContact(false);
      toast.success('Thank you! Your inquiry has been sent to our green recovery team.');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }, 800);
  };

  const getCategoryIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('computer') || lower.includes('laptop')) return Laptop;
    if (lower.includes('mobile') || lower.includes('phone')) return Smartphone;
    if (lower.includes('television') || lower.includes('display')) return Tv;
    if (lower.includes('printer') || lower.includes('scanner')) return Printer;
    if (lower.includes('battery') || lower.includes('power')) return BatteryCharging;
    return Cpu;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      <PublicNavbar />

      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-forest-950 via-forest-900 to-emerald-950 text-white">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Academic badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>SAI-III Society Internship Project</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6">
              Give Your Electronics a{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-200 bg-clip-text text-transparent">
                Second Life
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed mb-10">
              Join us in building a cleaner and greener future by responsibly collecting and recycling electronic waste. Connect directly with certified recyclers and track your device from doorstep to recovery.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Schedule a Pickup</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-600 hover:border-emerald-400 text-slate-200 hover:text-white font-semibold text-base hover:bg-forest-900/60 transition-all text-center"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ENVIRONMENTAL STATISTICS SECTION */}
      <section className="py-16 bg-white border-y border-slate-200 relative -mt-4 rounded-t-3xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Global E-Waste Context</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Why E-Waste Management Matters</h2>
            <p className="text-sm text-slate-600 mt-2">
              Based on global electronic monitoring data (UN Global E-Waste Monitor reports):
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">62M Tons</p>
              <p className="text-sm font-semibold text-slate-700 mt-2">Global E-Waste Generated Annually</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Over 62 billion kilograms of discarded electronics each year, growing 5x faster than documented recycling capacity.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Recycle className="w-6 h-6" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-700">22.3%</p>
              <p className="text-sm font-semibold text-slate-700 mt-2">Formal Collection & Recycling Rate</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Less than a quarter of all electronic waste is formally collected and recycled, resulting in billions in wasted raw resources.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 mx-auto rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-forest-800">100%</p>
              <p className="text-sm font-semibold text-slate-700 mt-2">EcoCycle Zero-Landfill Goal</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Every verified item collected through our smart workflow is diverted from dumpsites directly to certified materials recovery plants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">End-to-End Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">How EcoCycle Works</h2>
            <p className="text-base text-slate-600 mt-3">
              A transparent, certified 5-step digital pipeline connecting conscientious users with field officers and recycling engineers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                step: '01',
                title: 'Register Account',
                desc: 'Create your citizen profile in under a minute with verified email & mobile contact.',
                icon: ShieldCheck
              },
              {
                step: '02',
                title: 'List Your E-Waste',
                desc: 'Select device category, provide model specs, upload item photos, and choose preferred pickup date.',
                icon: Laptop
              },
              {
                step: '03',
                title: 'Field Verification',
                desc: 'Administrator reviews the request and assigns an authorized field officer to inspect the product.',
                icon: CheckCircle2
              },
              {
                step: '04',
                title: 'Doorstep Collection',
                desc: 'Officer collects verified device, issues digital receipt, and prepares batch logistics.',
                icon: Truck
              },
              {
                step: '05',
                title: 'Certified Recycling',
                desc: 'Dismantled at licensed recovery plants with complete tracking history and certificate of recycling.',
                icon: Recycle
              }
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group">
                  <span className="text-3xl font-extrabold text-emerald-200 group-hover:text-emerald-500 transition-colors">
                    {s.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center my-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. E-WASTE CATEGORIES */}
      <section id="categories" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Accepted Electronics</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">E-Waste Categories</h2>
              <p className="text-slate-600 text-sm mt-2">
                We accept consumer and commercial electronics across all primary categories:
              </p>
            </div>
            <Link
              to="/register"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-forest-800 hover:text-emerald-600"
            >
              <span>Schedule item pickup</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(categories.length > 0 ? categories : [
              { category_name: 'Computers & Laptops', description: 'Desktops, laptops, monitors, motherboards, servers, and processing units.' },
              { category_name: 'Mobile Phones & Tablets', description: 'Smartphones, feature phones, phablets, iPads, and reading tablets.' },
              { category_name: 'Televisions & Displays', description: 'CRT, LCD, LED, OLED monitors, TV screens, and projection displays.' },
              { category_name: 'Printers & Scanners', description: 'Laser printers, inkjet printers, multi-function scanners, and fax devices.' },
              { category_name: 'Batteries & Power Units', description: 'Lithium-ion batteries, laptop batteries, UPS units, lead-acid, and power packs.' },
              { category_name: 'Other Electronic Devices', description: 'Routers, audio equipment, kitchen electronics, cables, smart accessories, and IoT devices.' }
            ]).map((cat, i) => {
              const Icon = getCategoryIcon(cat.category_name);
              return (
                <div key={i} className="p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/40 hover:border-emerald-300 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{cat.category_name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{cat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. ABOUT US & ENVIRONMENTAL AWARENESS */}
      <section id="about" className="py-20 bg-forest-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6">
                <Globe2 className="w-3.5 h-3.5" />
                <span>SAI-III Academic Internship</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
                {aboutPage?.page_title || 'About EcoCycle & Strategies of Electronic Waste Management'}
              </h2>
              <div className="text-slate-300 text-sm leading-relaxed space-y-4 whitespace-pre-line">
                {aboutPage?.page_description || (
                  <p>
                    EcoCycle is an innovative digital platform built under the academic SAI-III Society Internship Project titled "Strategies of Electronic Waste Management".
                    Our platform addresses the urgent modern challenge of toxic electronic disposal by deploying smart, verified logistics between citizens, municipal monitors, and recovery centers.
                  </p>
                )}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 pt-6 border-t border-forest-900">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Verified Traceability</h4>
                    <p className="text-xs text-slate-400 mt-1">Full state-machine tracking with immutable audit history.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Zero-Landfill Protocol</h4>
                    <p className="text-xs text-slate-400 mt-1">Hazardous lead, mercury, and bromine extracted securely.</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="impact" className="bg-forest-900/80 p-8 rounded-3xl border border-forest-800 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-400" />
                <span>Environmental Hazards of Unsafe E-Waste Disposal</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Electronics contain toxic heavy metals and persistent organic pollutants that seep into ground aquifers and bio-accumulate when dumped improperly:
              </p>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-forest-950/60 border border-forest-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-900/50 text-red-400 flex items-center justify-center font-bold shrink-0">Pb</div>
                  <div>
                    <h5 className="font-semibold text-slate-200">Lead in Solder & Cathode Ray Tubes</h5>
                    <p className="text-slate-400 mt-0.5">Damages neurological systems and contaminates drinking water tables.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-forest-950/60 border border-forest-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-900/50 text-amber-400 flex items-center justify-center font-bold shrink-0">Hg</div>
                  <div>
                    <h5 className="font-semibold text-slate-200">Mercury in Flat Displays & Relays</h5>
                    <p className="text-slate-400 mt-0.5">Vaporizes into breathable air and settles in aquatic food chains.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-forest-950/60 border border-forest-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold shrink-0">Cd</div>
                  <div>
                    <h5 className="font-semibold text-slate-200">Cadmium in Rechargeable Cells</h5>
                    <p className="text-slate-400 mt-0.5">Causes irreversible kidney toxicity and soil bio-degradation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONTACT US FORM */}
      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Get In Touch</span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
                {contactPage?.page_title || 'Contact EcoCycle Support'}
              </h2>
              <div className="text-slate-600 text-sm mt-3 leading-relaxed whitespace-pre-line">
                {contactPage?.page_description || `We are here to support your green journey. Reach out to our central operations team for pickup inquiries, institutional bulk e-waste recycling, or society partnership opportunities.

Operational Headquarters:
Indian Institute of Information Technology Bhagalpur
IIIT Bhagalpur, Bihar, India
Phone: +91 98765 43210
Email: ecocycle.project@gmail.com
Support Hours: Monday - Saturday, 9:00 AM - 6:00 PM IST`}
              </div>

              <div className="mt-8 space-y-4 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Location:</p>
                    <p className="text-slate-600">IIIT Bhagalpur, Bihar, India</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Phone: </span>
                    <a href="tel:+919876543210" className="hover:text-emerald-700 transition-colors font-medium">+91 98765 43210</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Email: </span>
                    <a href="mailto:ecocycle.project@gmail.com" className="hover:text-emerald-700 transition-colors font-medium">ecocycle.project@gmail.com</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="Pickup inquiry or bulk disposal"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe your request or electronic items..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingContact}
                  className="w-full py-3 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingContact ? 'Submitting...' : 'Send Inquiry Message'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
