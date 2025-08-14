import { useState } from "react";
import { ObjectUploader } from "./ObjectUploader";
import { UserIcon, Camera } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UploadResult } from "@uppy/core";

interface ProfileImageUploaderProps {
  user: {
    id: number;
    name: string;
    email: string;
    profileImageUrl?: string;
    customProfileImageUrl?: string;
  };
}

export function ProfileImageUploader({ user }: ProfileImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Determine which image to display - prioritize custom uploaded image
  const displayImage = user.customProfileImageUrl || user.profileImageUrl;

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("/api/objects/upload", {
        method: "POST"
      }) as any;
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error("Failed to get upload URL:", error);
      throw new Error("Failed to get upload URL");
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (!result.successful || result.successful.length === 0) {
      toast({
        title: "Upload Failed",
        description: "No files were uploaded successfully.",
        variant: "destructive",
      });
      return;
    }

    const uploadedFile = result.successful[0];
    const imageURL = (uploadedFile as any).uploadURL;

    setIsUploading(true);
    
    try {
      await apiRequest("/api/user/profile-image", {
        method: "PUT",
        body: JSON.stringify({ imageURL }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Invalidate user profile cache to refetch updated data
      await queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Profile Image Updated",
        description: "Your profile image has been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to update profile image:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group">
      {displayImage ? (
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            src={displayImage}
            alt={`${user.name}'s profile`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const icon = document.createElement('div');
                icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600 dark:text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                parent.appendChild(icon);
              }
            }}
          />
        </div>
      ) : (
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
      )}

      {/* Upload overlay - shows on hover */}
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ObjectUploader
          maxNumberOfFiles={1}
          maxFileSize={5242880} // 5MB
          onGetUploadParameters={handleGetUploadParameters}
          onComplete={handleUploadComplete}
          buttonClassName="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
        >
          <Camera className="w-3 h-3 text-white" />
        </ObjectUploader>
      </div>

      {/* Loading overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}