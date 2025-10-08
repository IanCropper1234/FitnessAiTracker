import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number; // bytes, default 10MB
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (file: File, uploadURL?: string) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      alert(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Get upload parameters
      const { url } = await onGetUploadParameters();

      // Upload file directly
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Pass the upload URL to the completion handler
      onComplete?.(file, url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleButtonClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        className={`${buttonClassName || ''} ios-button touch-target transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${isUploading ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-sm' : ''}`}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : children}
      </Button>
    </div>
  );
}