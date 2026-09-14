import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CORE_ANALYTES = ['creatinine', 'bun', 'acr', 'hba1c', 'egfr'];

const VerifyTable = ({ drafts, onVerify, onValueChange, loading }) => {
  const [showOthers, setShowOthers] = useState(false);

  const coreDrafts = drafts.filter(d =>
    CORE_ANALYTES.some(core => d.analyteName.toLowerCase().includes(core))
  );
  const otherDrafts = drafts.filter(d =>
    !CORE_ANALYTES.some(core => d.analyteName.toLowerCase().includes(core))
  );

  const renderRows = (items) => items.map((draft) => (
    <tr key={draft._id} className="border-b border-border-hairline hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-text-main">
        {draft.analyteName}
        <span className="block text-[10px] text-text-muted font-normal">{draft.rawLabel}</span>
      </td>
      <td className="py-3 px-4">
        <input
          type="number"
          step="0.01"
          value={draft.value}
          onChange={(e) => onValueChange(draft._id, e.target.value)}
          className="w-24 px-2 py-1 text-sm font-mono border border-border-hairline rounded focus:ring-1 focus:ring-primary outline-none"
        />
      </td>
      <td className="py-3 px-4 text-sm text-text-muted font-mono">
        {draft.unit}
      </td>
      <td className="py-3 px-4 text-right">
        <button
          onClick={() => onValueChange(draft._id, draft.extractedValue)}
          className="text-xs text-primary hover:underline"
        >
          Reset to AI
        </button>
      </td>
    </tr>
  ));

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded border border-amber-200">
              Draft — please review
            </span>
            <h3 className="font-heading text-lg font-medium text-text-main">Verify Extracted Values</h3>
          </div>
        </div>

        <div className="space-y-6">
          {/* Core Analytes Table */}
          <div className="overflow-hidden rounded-xl border border-border-hairline">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr className="text-xs font-medium text-text-muted border-b border-border-hairline">
                  <th className="py-3 px-4">Core Marker</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {coreDrafts.length > 0 ? renderRows(coreDrafts) : (
                  <tr>
                    <td colSpan="4" className="py-4 px-4 text-center text-xs text-text-muted italic">
                      No core markers detected in this report.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Others Section */}
          {otherDrafts.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowOthers(!showOthers)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                {showOthers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showOthers ? 'Show Less' : `Watch More (${otherDrafts.length} other values)`}
              </button>

              {showOthers && (
                <div className="overflow-hidden rounded-xl border border-border-hairline animate-in fade-in slide-in-from-top-2 duration-200">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr className="text-xs font-medium text-text-muted border-b border-border-hairline">
                        <th className="py-3 px-4">Other Marker</th>
                        <th className="py-3 px-4">Value</th>
                        <th className="py-3 px-4">Unit</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderRows(otherDrafts)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            disabled={loading}
            onClick={onVerify}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Verify & Save All'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyTable;
