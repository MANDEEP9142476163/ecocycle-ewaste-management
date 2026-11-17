import React from 'react';
import { Link } from 'react-router-dom';
import { Recycle, Mail, Phone, MapPin, ShieldCheck, Heart } from 'lucide-react';

const PublicFooter = () => {
  return (
    <footer className="bg-forest-950 text-slate-300 pt-16 pb-12 border-t border-forest-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Col 1: Brand Info */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                <Recycle className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">EcoCycle</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Smart Electronic Waste Management System engineered for circular electronics recovery, safe recycling, and certified zero-landfill electronic disposal.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-forest-900/60 p-3 rounded-lg border border-forest-800">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>SAI-III Society Internship Academic Project</span>
            </div>
          </div>

          {/* Col 2: Quick Navigation */}
          <div>
            <h4 className="text-white font-semibold text-base mb-5 tracking-wide">Platform Links</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How Pickup Works</a></li>
              <li><a href="#categories" className="hover:text-emerald-400 transition-colors">E-Waste Categories</a></li>
              <li><a href="#impact" className="hover:text-emerald-400 transition-colors">Environmental Impact</a></li>
              <li><a href="#about" className="hover:text-emerald-400 transition-colors">About the Project</a></li>
              <li><Link to="/login" className="hover:text-emerald-400 transition-colors">System Portal Sign In</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Citizen Registration</Link></li>
            </ul>
          </div>

          {/* Col 3: Portal Access Roles */}
          <div>
            <h4 className="text-white font-semibold text-base mb-5 tracking-wide">Role Portals</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/login?role=admin" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Administrator Console</span>
                  <span className="text-xs bg-forest-800 text-emerald-300 px-2 py-0.5 rounded">Admin</span>
                </Link>
              </li>
              <li>
                <Link to="/login?role=employee" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Inspector & Collector Portal</span>
                  <span className="text-xs bg-forest-800 text-emerald-300 px-2 py-0.5 rounded">Staff</span>
                </Link>
              </li>
              <li>
                <Link to="/login?role=user" className="hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Consumer / Citizen Portal</span>
                  <span className="text-xs bg-forest-800 text-emerald-300 px-2 py-0.5 rounded">User</span>
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition-colors">
                  Submit Pickup Request
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Operations */}
          <div>
            <h4 className="text-white font-semibold text-base mb-5 tracking-wide">Operations Contact</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>IIIT Bhagalpur, Bihar, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>+91 9876543210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>ecocycle.project@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-forest-900 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} EcoCycle System. Developed for SAI-III Society Internship on "Strategies of Electronic Waste Management".</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" /> for a greener planet
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
