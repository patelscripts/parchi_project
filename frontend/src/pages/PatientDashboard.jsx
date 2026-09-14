import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TrendChart from '../components/TrendChart';
import TrendSummaryCard from '../components/TrendSummaryCard';
import InsufficientDataCard from '../components/InsufficientDataCard';
import { patientService } from '../api/patient';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { reportService } from '../api/reports';
import VerifyTable from '../components/VerifyTable';

const PatientDashboard = () => {
  const [growthData, setGrowthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadStep, setUploadStep] = useState('idle'); // idle | date | upload | verify
  const [uploadState, setUploadState] = useState({
    date: '',
    clinicCode: '',
    reportId: null,
    drafts: [],
  });
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchGrowth();
  }, []);

  const fetchGrowth = async () => {
    setLoading(true);
    try {
      const data = await patientService.getGrowth();
      setGrowthData(data);
    } catch (err) {
      console.error('Error fetching growth data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Please upload a file smaller than 5MB.');
      return;
    }

    // 2. Ensure we have a reportId from the previous step
    if (!uploadState.reportId) {
      alert('System Error: Report record not found. Please go back to the date selection step and try again.');
      setUploadStep('date');
      return;
    }

    setUploadStep('processing');
    try {
      const result = await reportService.extract(uploadState.reportId, file);

      if (result && result.drafts && Array.isArray(result.drafts)) {
        setUploadState(prev => ({ ...prev, drafts: result.drafts }));
        setUploadStep('verify');
      } else {
        throw new Error(result.message || 'The AI could not find any readable lab values in this report.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Extraction failed. Please try again.';
      console.error('Extraction Error Details:', err);
      alert('Extraction Error: ' + errorMessage);
      setUploadStep('upload');
    }
  };

  const handleVerifySubmit = async (records) => {
    setIsVerifying(true);
    try {
      await reportService.verify(records);
      setUploadStep('idle');
      setUploadState({ date: '', clinicCode: '', reportId: null, drafts: [] });
      await fetchGrowth();
    } catch (err) {
      alert('Verification failed: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDateSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await reportService.upload({
        reportDate: uploadState.date,
        clinicCode: uploadState.clinicCode,
      });

      if (result && (result.reportId || result._id)) {
        const reportId = result.reportId || result._id;
        setUploadState(prev => ({ ...prev, reportId }));
        setUploadStep('upload');
      } else {
        throw new Error('Failed to create report record. Please try again.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed. Please try again.';
      alert('Upload Error: ' + errorMessage);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const renderAnalyteSection = (title, keys, combined = false) => {
    // keys: array of analyteKeys
    // combined: if true, use one chart for all keys
    if (!growthData) return null;

    const analytics = keys.map(key => growthData[key]).filter(Boolean);
    if (analytics.length === 0) return null;

    // Logic for 4-report gate
    // If combined, check if any of the group have trend_available
    // Prompt says: "below 4 verified reports for an analyte group... NEVER show trend"
    const hasTrend = analytics.some(a => a.trend.status === 'trend_available');
    const reportsCount = analytics[0]?.trend.reportsUploaded || 0;

    return (
      <div className="mb-12">
        <h2 className="font-heading text-xl font-medium text-text-main mb-6 lowercase">{title}</h2>

        {!hasTrend ? (
          <InsufficientDataCard uploaded={reportsCount} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-border-hairline rounded-xl p-6 shadow-soft">
              {combined ? (
                <TrendChart
                  data={growthData.chartData || []} // Backend should provide aggregated chart data
                  series={[
                    { key: 'creatinine', color: '#0F766E', label: 'Creatinine' },
                    { key: 'bun', color: '#2563EB', label: 'BUN' },
                    { key: 'acr', color: '#14B8A6', label: 'ACR' },
                  ]}
                  threshold={{ value: 1.3, label: '1.3 mg/dL' }}
                  thresholdSource="Standard upper reference limit"
                />
              ) : (
                <TrendChart
                  data={growthData.hba1c?.chartData || []}
                  series={[{ key: 'hba1c', color: '#0F766E', label: 'HbA1c' }]}
                  threshold={{ value: 6.5, label: '6.5%' }}
                  thresholdSource="Standard diagnostic threshold"
                />
              )}
            </div>
            <div className="flex flex-col gap-4">
              {keys.map(key => {
                const data = growthData[key];
                if (!data) return null;
                return (
                  <TrendSummaryCard
                    key={key}
                    analyte={key.toUpperCase()}
                    trend={data.trend}
                    threshold={data.threshold}
                    projection={data.projection}
                    tier={data.tier?.tier}
                    brief={data.brief || 'No summary available.'}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-main">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-text-main">Health Trends</h1>
            <p className="text-sm text-text-muted">Track your markers and discuss trends with your doctor.</p>
          </div>
          <button
            onClick={() => setUploadStep('date')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Upload size={16} />
            Upload Report
          </button>
        </div>

        {renderAnalyteSection('kidney', ['creatinine', 'bun', 'acr'], true)}
        {renderAnalyteSection('diabetes', ['hba1c'], false)}
      </main>

      {/* Upload Modal */}
      {uploadStep !== 'idle' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-soft overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border-hairline flex justify-between items-center">
              <h3 className="font-heading font-semibold text-text-main">Upload Lab Report</h3>
              <button onClick={() => setUploadStep('idle')} className="text-text-muted hover:text-text-main">✕</button>
            </div>

            <div className="p-6 overflow-y-auto">
              {uploadStep === 'date' && (
                <form onSubmit={handleDateSubmit} className="space-y-4 max-w-md mx-auto">
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Report Date</label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-2 rounded-lg border border-border-hairline outline-none text-sm"
                        value={uploadState.date}
                        onChange={(e) => setUploadState({ ...uploadState, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Clinic Code (Optional)</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-border-hairline outline-none text-sm"
                        value={uploadState.clinicCode}
                        onChange={(e) => setUploadState({ ...uploadState, clinicCode: e.target.value })}
                        placeholder="Enter clinic code"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors mt-4">
                    Continue
                  </button>
                </form>
              )}

              {uploadStep === 'upload' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-primary-dark mb-4">
                    <FileText size={32} />
                  </div>
                  <h4 className="font-heading font-medium text-text-main mb-2">Upload your report</h4>
                  <p className="text-sm text-text-muted mb-6">
                    Please upload a <span className="font-semibold text-text-main">PDF, JPG, or PNG</span> image of your lab report.
                  </p>
                  <label className="cursor-pointer px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center gap-2">
                    <Upload size={18} />
                    Select File
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                  </label>
                  <p className="mt-4 text-[11px] text-text-muted italic">
                    Maximum file size: 5MB
                  </p>
                </div>
              )}

              {uploadStep === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary-light border-t-primary rounded-full animate-spin mb-6"></div>
                  <h4 className="font-heading font-medium text-text-main mb-2">Extracting Data...</h4>
                  <p className="text-sm text-text-muted">
                    Our AI is reading your report. This usually takes a few seconds.
                  </p>
                </div>
              )}

              {uploadStep === 'verify' && (
                <VerifyTable
                  drafts={uploadState.drafts}
                  loading={isVerifying}
                  onValueChange={(id, val) => {
                    const newDrafts = uploadState.drafts.map(d => d._id === id ? { ...d, value: val } : d);
                    setUploadState({ ...uploadState, drafts: newDrafts });
                  }}
                  onVerify={() => handleVerifySubmit(uploadState.drafts)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
