import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Coffee, AlertCircle } from 'lucide-react';
import { apiClient } from '../api';

const BUSINESS_TYPES = [
  { value: 'coffee_shop', label: '☕ Coffee Shop', emoji: '☕' },
  { value: 'restaurant', label: '🍽️ Restaurant', emoji: '🍽️' },
  { value: 'bakery', label: '🥐 Bakery', emoji: '🥐' },
  { value: 'cafe', label: '🍰 Cafe', emoji: '🍰' },
  { value: 'fast_food', label: '🍔 Fast Food', emoji: '🍔' },
  { value: 'bar', label: '🍺 Bar/Pub', emoji: '🍺' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'type' | 'location' | 'confirm'>('type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'coffee_shop',
    latitude: 49.2827,
    longitude: -123.1207,
    address: 'Vancouver, BC',
    timezone: 'America/Vancouver',
  });

  const handleBusinessTypeSelect = (type: string) => {
    setFormData({ ...formData, business_type: type });
    setStep('location');
  };

  const handleGetLocation = async () => {
    setLoading(true);
    setError('');
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setFormData({
              ...formData,
              latitude,
              longitude,
            });
            // Get address from coordinates (simplified)
            setFormData(prev => ({
              ...prev,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            }));
            setStep('confirm');
            setLoading(false);
          },
          () => {
            setError('Could not access your location. Please enter manually.');
            setLoading(false);
          }
        );
      } else {
        setError('Geolocation not supported. Please enter your location manually.');
        setLoading(false);
      }
    } catch (e) {
      setError('Error getting location');
      setLoading(false);
    }
  };

  const handleManualLocation = () => {
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!formData.business_name.trim()) {
      setError('Please enter your business name');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await apiClient.completeOnboarding({
        business_name: formData.business_name,
        business_type: formData.business_type,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        timezone: formData.timezone,
      });

      if (response.onboarding_complete) {
        // Store location_id for later
        localStorage.setItem('location_id', response.location_id.toString());
        navigate('/');
      } else {
        setError('Onboarding incomplete. Please try again.');
      }
    } catch (e) {
      setError('Error completing onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📊</div>
          <h1 className="text-3xl font-bold text-white mb-2">LocalPulse</h1>
          <p className="text-gray-400">Know your competition before they know you</p>
        </div>

        {/* Step 1: Business Type Selection */}
        {step === 'type' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-6">What type of business do you run?</h2>
            <div className="grid grid-cols-2 gap-3">
              {BUSINESS_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleBusinessTypeSelect(type.value)}
                  className={`p-4 rounded-lg font-medium transition-all transform hover:scale-105 ${
                    formData.business_type === type.value
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.emoji}</div>
                  <div className="text-sm">{type.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 'location' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-6">Where is your business?</h2>
            
            <button
              onClick={handleGetLocation}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              {loading ? 'Getting location...' : 'Use Current Location'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={handleManualLocation}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Enter Location Manually
            </button>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 p-3 rounded">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirmation & Business Name */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="e.g., The Daily Grind"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
              <div className="text-sm">
                <span className="text-gray-400">Business Type: </span>
                <span className="text-white font-medium">
                  {BUSINESS_TYPES.find(t => t.value === formData.business_type)?.label}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Location: </span>
                <span className="text-white font-medium">{formData.address}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Coordinates: </span>
                <span className="text-white font-medium">
                  {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 p-3 rounded">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Setting up...' : 'Complete Onboarding'}
            </button>

            <button
              onClick={() => setStep('location')}
              disabled={loading}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2 rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Your competitive intelligence starts here.</p>
        </div>
      </div>
    </div>
  );
}
