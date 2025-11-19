import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';
import { formatFileSize } from '../../lib/utils';

interface ResumeUploadProps {
  onFileSelect: (file: File) => void;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
}

export const ResumeUpload = ({
  onFileSelect,
  maxSize = 10485760, // 10MB
  acceptedFormats = ['.pdf', '.docx', '.txt'],
}: ResumeUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${formatFileSize(maxSize)}`);
      return false;
    }

    // Check file format
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExt)) {
      setError(`Please upload ${acceptedFormats.join(', ')} files only`);
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setError('');
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center
            transition-all duration-300 cursor-pointer
            ${
              isDragging
                ? 'border-indigo-400 bg-indigo-500/10'
                : 'border-white/30 hover:border-white/50 bg-white/5'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-white/70 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">
            Drop your resume here or click to browse
          </p>
          <p className="text-white/60 text-sm">
            Supported formats: {acceptedFormats.join(', ')} (max {formatFileSize(maxSize)})
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="bg-white/10 border border-white/30 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{selectedFile.name}</p>
                <p className="text-white/60 text-sm">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};