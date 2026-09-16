import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ScanBarcode, Search, Award, Sparkles, Scale, Heart, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../constants/appConstants';

export const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: ScanBarcode,
      title: 'Barcode Scanning',
      description: 'Scan packaged food barcodes and instantly discover comprehensive product information.',
    },
    {
      icon: Search,
      title: 'Food Search',
      description: 'Search and explore thousands of food products across multiple categories.',
    },
    {
      icon: Award,
      title: 'FoodLens Score',
      description: 'Understand food quality with a transparent, deterministic 0-100 health score.',
    },
    {
      icon: Sparkles,
      title: 'AI Insights',
      description: 'Get intelligent explanations about ingredients, additives, and nutritional value powered by Gemini.',
    },
    {
      icon: Scale,
      title: 'Product Comparison',
      description: 'Compare two food products side-by-side to make informed dietary choices.',
    },
    {
      icon: Heart,
      title: 'Personalized',
      description: 'Get tailored compatibility insights based on your personal dietary preferences and allergies.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-4 text-center max-w-5xl mx-auto overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 mb-6">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Next-Generation AI Food Intelligence</span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          {APP_NAME}
        </h1>
        <p className="text-2xl md:text-3xl font-bold text-emerald-600 tracking-tight mb-6">
          "{APP_TAGLINE}"
        </p>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Understand the food you eat with barcode scanning, nutrition insights, personalized compatibility checks, and AI-powered food intelligence.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={() => navigate('/app/dashboard')} icon={ArrowRight}>
            Start Exploring
          </Button>
          <Button size="lg" variant="outline" onClick={() => {
            const el = document.getElementById('how-it-works');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}>
            How It Works
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">How FoodLens Works</h2>
          <p className="text-slate-600">Three simple steps to smarter, healthier food choices.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="relative p-8 text-center bg-gradient-to-b from-white to-emerald-50/30">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-600/20">
              01
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Scan</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scan a product barcode or search our database for any packaged food item.
            </p>
          </Card>
          <Card className="relative p-8 text-center bg-gradient-to-b from-white to-emerald-50/30">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-600/20">
              02
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Understand</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              View comprehensive nutrition facts, ingredient analysis, allergens, and processing groups.
            </p>
          </Card>
          <Card className="relative p-8 text-center bg-gradient-to-b from-white to-emerald-50/30">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-600/20">
              03
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Decide</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get an instant FoodLens Score and AI-powered insights tailored to your diet.
            </p>
          </Card>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Core Features</h2>
          <p className="text-slate-600">Built with cutting-edge tools to give you complete food transparency.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} hoverable className="p-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feat.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* AI Intelligence Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-8 md:p-16 text-white relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent pointer-events-none"></div>
          <div className="max-w-2xl relative z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              Google Gemini Powered
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 mb-4">
              Advanced AI Food Intelligence at Your Fingertips
            </h2>
            <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
              FoodLens AI analyzes nutrition labels, ingredient lists, and packaging photos using state-of-the-art multimodal AI models to uncover hidden sugars, additives, and allergen risks.
            </p>
            <Button size="lg" onClick={() => navigate('/app/analysis')}>
              Try Food Analysis
            </Button>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
          Ready to Take Control of Your Diet?
        </h2>
        <p className="text-slate-600 max-w-xl mx-auto mb-8">
          Join thousands of health-conscious users scanning and understanding their food every day.
        </p>
        <Button size="lg" onClick={() => navigate('/app/dashboard')}>
          Get Started Now
        </Button>
      </section>
    </div>
  );
};
