import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileJson, Package, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../hooks/useToast';

interface DownloadButtonProps {
  jobId: number;
  applicationId: number;
  candidateName: string;
  variant?: 'dropdown' | 'simple';
}

type DownloadType = 'resume' | 'report' | 'json' | 'package';

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  jobId,
  applicationId,
  candidateName,
  variant = 'dropdown',
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const buttonRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Calculate dropdown position to prevent cutoff
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If not enough space below (need ~280px for dropdown), show above
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [showDropdown]);

  const handleDownload = async (type: DownloadType) => {
    setIsDownloading(true);
    setShowDropdown(false);

    try {
      const response = await api.get(
        `/jobs/${jobId}/applications/${applicationId}/download`,
        {
          params: { file_type: type },
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Set filename based on type
      const timestamp = new Date().toISOString().split('T')[0];
      const safeName = candidateName.replace(/\s+/g, '_');

      let filename = '';
      switch (type) {
        case 'resume':
          filename = `${safeName}_Resume_${timestamp}.pdf`;
          break;
        case 'report':
          filename = `${safeName}_AI_Report_${timestamp}.pdf`;
          break;
        case 'json':
          filename = `${safeName}_Explanation_${timestamp}.json`;
          break;
        case 'package':
          filename = `${safeName}_Complete_Package_${timestamp}.zip`;
          break;
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${type === 'package' ? 'complete package' : type} successfully!`);
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.detail || `Failed to download ${type}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (variant === 'simple') {
    return (
      <button
        onClick={() => handleDownload('package')}
        disabled={isDownloading}
        className="flex items-center space-x-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Download</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isDownloading}
        className="flex items-center space-x-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Download</span>
        <svg
          className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Menu - FIXED POSITIONING */}
          <div
            className={`absolute right-0 w-64 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl z-20 overflow-hidden ${
              dropdownPosition === 'top' ? 'bottom-full mb-2' : 'mt-2'
            }`}
          >
            <div className="p-2 space-y-1">
              {/* Resume Only */}
              <button
                onClick={() => handleDownload('resume')}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all text-left"
              >
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm">Resume Only</p>
                  <p className="text-white/60 text-xs">Original resume file</p>
                </div>
              </button>

              {/* AI Report */}
              <button
                onClick={() => handleDownload('report')}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all text-left"
              >
                <FileText className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm">AI Report (PDF)</p>
                  <p className="text-white/60 text-xs">Formatted screening report</p>
                </div>
              </button>

              {/* Explanation JSON */}
              <button
                onClick={() => handleDownload('json')}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all text-left"
              >
                <FileJson className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm">Explanation (JSON)</p>
                  <p className="text-white/60 text-xs">Raw screening data</p>
                </div>
              </button>

              {/* Complete Package */}
              <button
                onClick={() => handleDownload('package')}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-all text-left border-t border-white/10 mt-2 pt-3"
              >
                <Package className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm">Complete Package (ZIP)</p>
                  <p className="text-white/60 text-xs">Resume + Report + JSON</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};