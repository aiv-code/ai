import { useState, useCallback } from 'react';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { dataSourcesApi } from '../../api/dataSourcesApi';

export function FileUpload({ acceptedTypes, onUploadComplete, maxSizeMB = 50 }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file) => {
    // Check file type
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    const acceptedExts = acceptedTypes.split(',').map(ext => ext.trim());
    
    if (!acceptedExts.some(ext => fileExt === ext || ext === '*')) {
      throw new Error(`File type not supported. Accepted types: ${acceptedTypes}`);
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }

    return true;
  };

  const uploadFile = async (file) => {
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      validateFile(file);

      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await dataSourcesApi.uploadFile(formData);
      
      clearInterval(progressInterval);
      setProgress(100);
      setUploadedFile(response);

      if (onUploadComplete) {
        onUploadComplete(response);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  }, [acceptedTypes, maxSizeMB]);

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  }, [acceptedTypes, maxSizeMB]);

  const handleReset = () => {
    setUploadedFile(null);
    setError(null);
    setProgress(0);
  };

  if (uploadedFile) {
    return (
      <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                {uploadedFile.file_name}
              </p>
              <p className="text-xs text-green-700">
                {(uploadedFile.file_size / 1024).toFixed(2)} KB uploaded
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-green-700 hover:text-green-900"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="file-upload-input"
        />
        
        <label
          htmlFor="file-upload-input"
          className="cursor-pointer flex flex-col items-center space-y-4"
        >
          <Upload className={`w-12 h-12 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
          
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Drop file here' : 'Drag and drop file here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Accepted: {acceptedTypes} (max {maxSizeMB}MB)
            </p>
          </div>
        </label>

        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">{progress}%</p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}


