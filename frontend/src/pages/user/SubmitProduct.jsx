import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ClipboardList, Upload, Image, ArrowRight, Loader2, Sparkles,
  Calendar, MapPin, Phone, User, DollarSign, CheckCircle2
} from 'lucide-react';

const SubmitProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: '',
    brand: '',
    model_type: '',
    description: '',
    expected_price: '',
    pickup_date: '',
    pickup_address: '',
    state_id: '',
    city_id: '',
    contact_person: user?.name || '',
    contact_number: user?.mobile_number || ''
  });

  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load categories & states
    const loadInit = async () => {
      try {
        const [catsRes, statesRes] = await Promise.all([
          api.get('/categories'),
          api.get('/locations/states')
        ]);
        if (catsRes.data.success) {
          setCategories(catsRes.data.categories);
          if (catsRes.data.categories.length > 0) {
            setFormData(prev => ({ ...prev, category_id: catsRes.data.categories[0].id }));
          }
        }
        if (statesRes.data.success) {
          setStates(statesRes.data.states);
          if (statesRes.data.states.length > 0) {
            const firstStateId = statesRes.data.states[0].id;
            setFormData(prev => ({ ...prev, state_id: firstStateId }));
            fetchCities(firstStateId);
          }
        }
      } catch (err) {
        console.error('Failed to load categories/states:', err);
      }
    };
    loadInit();
  }, []);

  const fetchCities = async (stateId) => {
    try {
      setLoadingLocations(true);
      const res = await api.get('/locations/cities', { params: { state_id: stateId } });
      if (res.data.success) {
        setCities(res.data.cities);
        if (res.data.cities.length > 0) {
          setFormData(prev => ({ ...prev, city_id: res.data.cities[0].id }));
        } else {
          setFormData(prev => ({ ...prev, city_id: '' }));
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleStateChange = (e) => {
    const sId = e.target.value;
    setFormData(prev => ({ ...prev, state_id: sId }));
    fetchCities(sId);
  };

  const handleImageChange = (e, slot) => {
    const file = e.target.files[0];
    if (file) {
      if (slot === 1) {
        setImage1(file);
        setPreview1(URL.createObjectURL(file));
      } else {
        setImage2(file);
        setPreview2(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product_name || !formData.category_id || !formData.pickup_date || !formData.pickup_address || !formData.contact_number) {
      toast.error('Please complete all mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      if (image1) data.append('image_1', image1);
      if (image2) data.append('image_2', image2);

      const res = await api.post('/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success(`E-waste listed successfully with ID ${res.data.productCode}!`);
        navigate('/user/products');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to list e-waste product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">List Your E-Waste Product</h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit electronic waste specifications, upload item photos, and request authorized doorstep collection.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Device Information */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <span>1. Electronic Device Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product / Device Name *</label>
                <input
                  type="text"
                  required
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="e.g. Dell XPS 15 Laptop / Samsung Galaxy S10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-Waste Category *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.category_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand / Manufacturer</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. Apple, HP, Sony, Lenovo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Model / Serial Type</label>
                <input
                  type="text"
                  value={formData.model_type}
                  onChange={(e) => setFormData({ ...formData, model_type: e.target.value })}
                  placeholder="e.g. Model A1989, 500GB HDD"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Product Condition & Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe defects, whether it powers on, cracks, missing parts, or scrap condition..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Scrap / Residual Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.expected_price}
                  onChange={(e) => setFormData({ ...formData, expected_price: e.target.value })}
                  placeholder="e.g. 25.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Pickup Date *</label>
                <input
                  type="date"
                  required
                  value={formData.pickup_date}
                  onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Contact */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>2. Pickup Location & Contact Info</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State *</label>
                <select
                  required
                  value={formData.state_id}
                  onChange={handleStateChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                >
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.state_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City *</label>
                <select
                  required
                  value={formData.city_id}
                  onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                >
                  {cities.map((ct) => (
                    <option key={ct.id} value={ct.id}>{ct.city_name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Full Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.pickup_address}
                  onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                  placeholder="Building, street, apartment number for our field collector"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Product Photographs */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-600" />
              <span>3. Product Photographs (Front & Back/Label)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photo 1 */}
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-4 text-center transition-colors">
                {preview1 ? (
                  <div className="relative h-40 rounded-xl overflow-hidden mb-2">
                    <img src={preview1} alt="Preview 1" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center text-slate-400">
                    <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                    <span className="text-xs font-semibold text-slate-700">Product Image 1</span>
                    <span className="text-[11px] text-slate-400 mt-1">Device front view (JPG, PNG, WEBP)</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 1)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              {/* Photo 2 */}
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-4 text-center transition-colors">
                {preview2 ? (
                  <div className="relative h-40 rounded-xl overflow-hidden mb-2">
                    <img src={preview2} alt="Preview 2" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center text-slate-400">
                    <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                    <span className="text-xs font-semibold text-slate-700">Product Image 2</span>
                    <span className="text-[11px] text-slate-400 mt-1">Serial label or damage area view</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 2)}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              * A unique tracking ID will be generated upon submission.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-sm shadow-md shadow-forest-900/10 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting E-Waste Request...</span>
                </>
              ) : (
                <>
                  <span>Schedule & Submit E-Waste</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitProduct;
