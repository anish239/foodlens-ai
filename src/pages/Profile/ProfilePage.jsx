import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { PageTransition } from '../../components/animation/PageTransition';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { User, Mail, ShieldCheck, Check, AlertCircle, Sparkles, Heart, Activity } from 'lucide-react';

const DIET_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'non-vegetarian', label: 'Non-Vegetarian' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'other', label: 'Other' },
];

const GOAL_OPTIONS = [
  { value: 'high-protein', label: 'High Protein' },
  { value: 'low-sugar', label: 'Low Sugar' },
  { value: 'low-sodium', label: 'Low Sodium' },
  { value: 'high-fiber', label: 'High Fiber' },
  { value: 'weight-management', label: 'Weight Management' },
  { value: 'weight-gain', label: 'Weight Gain' },
  { value: 'muscle-building', label: 'Muscle Building' },
  { value: 'balanced-diet', label: 'Balanced Diet' },
];

const ALLERGY_OPTIONS = [
  { value: 'nuts', label: 'Nuts' },
  { value: 'peanuts', label: 'Peanuts' },
  { value: 'milk', label: 'Milk' },
  { value: 'lactose', label: 'Lactose' },
  { value: 'soy', label: 'Soy' },
  { value: 'egg', label: 'Egg' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'fish', label: 'Fish' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'sesame', label: 'Sesame' },
];

const RESTRICTION_OPTIONS = [
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'lactose-free', label: 'Lactose-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'nut-free', label: 'Nut-Free' },
  { value: 'peanut-free', label: 'Peanut-Free' },
  { value: 'soy-free', label: 'Soy-Free' },
  { value: 'egg-free', label: 'Egg-Free' },
];

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [diet, setDiet] = useState(user?.preferences?.diet || null);
  const [goals, setGoals] = useState(user?.preferences?.healthGoals || []);
  const [allergies, setAllergies] = useState(user?.preferences?.allergies || []);
  const [restrictions, setRestrictions] = useState(user?.preferences?.restrictions || []);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await userService.updatePreferences({
        diet,
        healthGoals: goals,
        allergies,
        restrictions,
      });

      if (res.success && res.data.user) {
        updateUser(res.data.user);
        setSuccessMessage('Preferences updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await userService.updateProfile({ name });
      if (res.success && res.data.user) {
        updateUser(res.data.user);
        setSuccessMessage('Profile updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="space-y-8 max-w-4xl mx-auto pb-16">
      <PageHeader
        title="Profile"
        description="Configure your dietary preferences, health goals, and allergen warnings for personalized compatibility checks."
      />

      {successMessage && (
        <Card className="p-4 rounded-2xl bg-emerald-50 border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{typeof successMessage === 'string' ? successMessage : (successMessage?.message || 'Saved successfully')}</span>
        </Card>
      )}

      {error && (
        <Card className="p-4 rounded-2xl bg-rose-50 border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{typeof error === 'string' ? error : (error?.message || 'An error occurred')}</span>
        </Card>
      )}

      {/* User Info Card */}
      <Card className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-7 rounded-3xl border-slate-200/80 shadow-2xs">
        <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-2xl flex items-center justify-center overflow-hidden border border-emerald-200 shadow-2xs">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-emerald-600" />
          )}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h2 className="text-xl font-black text-slate-900">{user?.name}</h2>
          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user?.email}</span>
          </p>
          <div className="pt-2">
            <Badge variant="success" className="gap-1.5 py-1 px-3 text-xs font-bold rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authenticated Account</span>
            </Badge>
          </div>
        </div>
      </Card>

      {/* Profile Details Form */}
      <Card className="space-y-6 p-6 sm:p-7 rounded-3xl border-slate-200/80 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Full Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm rounded-xl"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" isLoading={loading} className="rounded-xl font-bold">
              Update Profile Name
            </Button>
          </div>
        </form>
      </Card>

      {/* Preferences Form */}
      <Card className="space-y-6 p-6 sm:p-7 rounded-3xl border-slate-200/80 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">Dietary Preferences &amp; Health Goals</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            These settings directly power the FoodLens Dietary Compatibility engine.
          </p>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Dietary Preference
            </label>
            <select
              value={diet || ''}
              onChange={(e) => setDiet(e.target.value ? e.target.value : null)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="">Not Specified</option>
              {DIET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Health Goals
            </label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => {
                const selected = goals.includes(goal.value);
                return (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setGoals(goals.filter((g) => g !== goal.value));
                      } else {
                        setGoals([...goals, goal.value]);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {goal.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Allergies
            </label>
            <div className="flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map((allergy) => {
                const selected = allergies.includes(allergy.value);
                return (
                  <button
                    key={allergy.value}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setAllergies(allergies.filter((a) => a !== allergy.value));
                      } else {
                        setAllergies([...allergies, allergy.value]);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {allergy.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Dietary Restrictions
            </label>
            <div className="flex flex-wrap gap-2">
              {RESTRICTION_OPTIONS.map((rest) => {
                const selected = restrictions.includes(rest.value);
                return (
                  <button
                    key={rest.value}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setRestrictions(restrictions.filter((r) => r !== rest.value));
                      } else {
                        setRestrictions([...restrictions, rest.value]);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {rest.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button type="submit" variant="primary" isLoading={loading} className="rounded-xl font-bold">
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>
    </PageTransition>
  );
};
