import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PageTransition } from '../../components/animation/PageTransition';
import { Sparkles, Upload, Camera, FileText, Image as ImageIcon, ShieldCheck, Zap } from 'lucide-react';

export const AnalysisPage = () => {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'label'
  const [isDragging, setIsDragging] = useState(false);

  return (
    <PageTransition className="space-y-8 max-w-4xl mx-auto pb-16">
      <PageHeader
        title="Food Analysis"
        description="Upload food package photos or nutrition labels for deep multimodal analysis powered by Google Gemini AI."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 pb-4 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'image'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Analyze Food Image</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('label')}
          className={`flex items-center gap-2 pb-4 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'label'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Analyze Nutrition Label</span>
        </button>
      </div>

      {/* Upload Area */}
      <Card className="p-8 md:p-12 text-center rounded-3xl border-slate-200/80 shadow-2xs">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
          className={`border-2 border-dashed rounded-3xl p-8 md:p-14 transition-all flex flex-col items-center justify-center ${
            isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300 bg-slate-50/50'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-2xs">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">
            {activeTab === 'image' ? 'Upload Food Photo or Package' : 'Upload Nutrition Label Photo'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6 font-medium">
            Drag and drop your image here, or click to browse files from your device.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button variant="primary" className="rounded-xl font-bold gap-2">
              <Upload className="w-4 h-4" />
              <span>Browse Files</span>
            </Button>
            <Button variant="outline" className="rounded-xl font-bold gap-2">
              <Camera className="w-4 h-4" />
              <span>Take Photo</span>
            </Button>
          </div>
          <p className="text-[11px] text-slate-400 mt-6 font-medium">
            Supported formats: JPEG, PNG, WEBP (Max size: 10MB)
          </p>
        </div>
      </Card>

      {/* Gemini Info Banner */}
      <Card className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border border-emerald-900/40 p-6 sm:p-7 rounded-3xl shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm">Multimodal AI Intelligence</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              When connected, Google Gemini extracts ingredients, verifies nutritional accuracy against package labels, detects hidden allergens, and generates tailored health recommendations instantly.
            </p>
          </div>
        </div>
      </Card>
    </PageTransition>
  );
};
