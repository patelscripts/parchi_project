import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TrendChart from '../components/TrendChart';
import TrendSummaryCard from '../components/TrendSummaryCard';
import InsufficientDataCard from '../components/InsufficientDataCard';
import { patientService } from '../api/patient';
import { Upload, FileText, CheckCircle, Activity } from 'lucide-react';
import { reportService } from '../api/reports';
import VerifyTable from '../components/VerifyTable';

const PatientDashboard = () => {
  const [growthData, setGrowthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOtherAnalytes, setShowOtherAnalytes] = useState(false);
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

  const fetchGrowth = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await patientService.getGrowth();

      // Backend returns { patientId, analytes: [...] }
      const growthMap = {};
      if (data && data.analytes) {
        data.analytes.forEach(a => {
          growthMap[a.analyteKey] = a;
        });
      }
      setGrowthData(growthMap);
    } catch (err) {
      console.error('Error fetching growth data:', err);
    } finally {
      if (!silent) setLoading(false);
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
      await fetchGrowth(true); // Call silently to avoid triggering the global "Loading..." screen
      setUploadStep('success'); // Now we can move to the success screen with updated data
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
    if (!growthData) return null;

    const analytics = keys.map(key => growthData[key]).filter(Boolean);
    if (analytics.length === 0) return null;

    const reportsCount = analytics.reduce(
      (max, item) => Math.max(max, item?.trend?.reportsUploaded || 0),
      0
    );
    const hasTrend = analytics.some(a => a.trend.status === 'trend_available');

    // Merge data for combined charts
    let finalChartData = [];
    if (combined) {
      const dateMap = {};
      analytics.forEach(a => {
        (a.chartData || []).forEach(point => {
          if (!dateMap[point.date]) dateMap[point.date] = { date: point.date };
          const key = a.analyteKey;
          dateMap[point.date][key] = point.value;
        });
      });
      finalChartData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
      finalChartData = analytics[0]?.chartData || [];
    }

    return (
      <div className="mb-12">
        <h2 className="font-heading text-xl font-medium text-text-main mb-6 lowercase">{title}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-border-hairline rounded-xl p-6 shadow-soft">
            {hasTrend ? (
              <TrendChart
                data={finalChartData}
                series={combined
                  ? [
                      { key: 'creatinine', color: '#0F766E', label: 'Creatinine' },
                      { key: 'bun', color: '#2563EB', label: 'BUN' },
                      { key: 'acr', color: '#14B8A6', label: 'ACR' },
                    ]
                  : [
                      { key: analytics[0].analyteKey, color: '#0F766E', label: analytics[0].analyteKey.toUpperCase() }
                    ]
                }
                threshold={analytics[0]?.threshold}
                thresholdSource={analytics[0]?.threshold?.source}
              />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                  <Activity size={24} />
                </div>
                <h4 className="font-medium text-text-main mb-1">Trend Analysis Coming Soon</h4>
                <p className="text-sm text-text-muted max-w-xs">
                  We need at least 4 verified reports to calculate a reliable trend line.
                  Currently have {reportsCount} report(s).
                </p>
              </div>
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
      </div>
    );
  };

  const otherAnalytes = growthData
    ? Object.entries(growthData).filter(([key]) => !['creatinine', 'bun', 'acr', 'hba1c', 'egfr'].includes(key))
    : [];

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

        {/* Other Analytes Section */}
        {growthData && (
          <div className="mt-16 border-t border-border-hairline pt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading text-xl font-medium text-text-main lowercase">Other Markers</h2>
              {!showOtherAnalytes && (
                <button
                  onClick={() => setShowOtherAnalytes(true)}
                  className="text-sm font-medium text-primary hover:underline transition-colors"
                >
                  Watch More ↓
                </button>
              )}
            </div>

            {showOtherAnalytes && (
              <div className="bg-white border border-border-hairline rounded-xl overflow-hidden shadow-soft animate-in fade-in slide-in-from-top-2 duration-300">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-border-hairline">
                    <tr className="text-xs font-medium text-text-muted">
                      <th className="py-3 px-6">Marker</th>
                      <th className="py-3 px-6">Latest Value</th>
                      <th className="py-3 px-6">Unit</th>
                      <th className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherAnalytes.length > 0 ? (
                      otherAnalytes.map(([key, data]) => (
                        <tr key={key} className="border-b border-border-hairline last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-6 text-sm font-medium text-text-main">{data.rawLabel || key}</td>
                          <td className="py-3 px-6 text-sm font-mono text-text-main">{data.latestValue}</td>
                          <td className="py-3 px-6 text-sm text-text-muted">{data.unit || '-'}</td>
                          <td className="py-3 px-6">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">
                              {data.trend?.status === 'trend_available' ? 'Trend Available' : 'Single Value'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-sm text-text-muted italic">
                          No other markers found in your reports.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="p-4 bg-gray-50 border-t border-border-hairline text-right">
                  <button
                    onClick={() => setShowOtherAnalytes(false)}
                    className="text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                  >
                    Show Less ↑
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {uploadStep !== 'idle' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
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

              {uploadStep === 'success' && (
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="font-heading text-2xl font-bold text-text-main mb-2">Verification Complete!</h4>
                  <p className="text-text-muted mb-8">Here is the updated trend for your markers.</p>

                  <div className="w-full space-y-8">
                    {uploadState.drafts.map((draft, idx) => {
                      // Map draft analyteName to growthData keys
                      const key = draft.analyteName.toLowerCase();
                      const data = growthData?.[key];
                      if (!data) return null;

                      return (
                        <div key={idx} className="text-left p-6 bg-gray-50 rounded-2xl border border-border-hairline">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="font-heading font-semibold text-text-main capitalize">{key} Trend</h5>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              data.tier?.tier === 'critical' ? 'bg-red-100 text-red-600' :
                              data.tier?.tier === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {data.tier?.tier || 'stable'}
                            </div>
                          </div>

                          <div className="h-48 mb-6">
                            <TrendChart
                              data={data.chartData || []}
                              series={[{
                                key: key,
                                color: key === 'hba1c' ? '#0F766E' : '#2563EB',
                                label: key.toUpperCase()
                              }]}
                              threshold={data.threshold}
                              thresholdSource={data.threshold?.source}
                            />
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-border-hairline shadow-sm">
                            <p className="text-sm text-text-main leading-relaxed italic">
                              "{data.brief || 'No summary available.'}"
                            </p>
                            {data.projection && (
                              <div className="mt-3 pt-3 border-t border-border-hairline text-xs font-medium text-primary">
                                🚀 Projection: {
                                  data.projection.alreadyCrossed
                                    ? 'Value is currently above the reference threshold.'
                                    : data.projection.yearsToThreshold
                                      ? `Projected to reach threshold in ~${data.projection.yearsToThreshold} years.`
                                      : 'Trend is stable for the upcoming year.'
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setUploadStep('idle');
                      setUploadState({ date: '', clinicCode: '', reportId: null, drafts: [] });
                    }}
                    className="mt-10 px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
