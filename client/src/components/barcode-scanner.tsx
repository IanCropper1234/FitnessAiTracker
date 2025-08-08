import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (foodData: any) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScanSuccess }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Initialize camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera for better barcode scanning
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasPermission(true);
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan barcodes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setHasPermission(null);
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !isScanning) return;

    try {
      setIsLoading(true);
      
      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Could not get canvas context');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(videoRef.current, 0, 0);
      
      // Convert to blob and send to barcode detection service
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Could not capture image');
        
        // For now, we'll use manual barcode input since browser barcode detection
        // requires additional libraries. In a production app, you'd integrate
        // with libraries like ZXing or QuaggaJS
        const barcode = prompt('Enter the barcode number from the package:');
        
        if (barcode && barcode.length > 0) {
          await lookupBarcode(barcode);
        }
      }, 'image/jpeg', 0.8);
      
    } catch (error) {
      console.error('Error capturing barcode:', error);
      toast({
        title: "Scan Failed",
        description: "Could not scan barcode. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const lookupBarcode = async (barcode: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/food/barcode/${barcode}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Product Not Found",
            description: "This barcode is not in our database. Try searching manually.",
            variant: "destructive"
          });
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const foodData = await response.json();
      
      toast({
        title: "Product Found!",
        description: `Found: ${foodData.name}`,
      });
      
      onScanSuccess(foodData);
      onClose();
      
    } catch (error) {
      console.error('Error looking up barcode:', error);
      toast({
        title: "Lookup Failed",
        description: "Could not find product information. Please try searching manually.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualInput = () => {
    const barcode = prompt('Enter barcode manually:');
    if (barcode && barcode.length > 0) {
      lookupBarcode(barcode);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative bg-black  overflow-hidden aspect-video">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="ios-loading-dots flex items-center gap-1">
                  <div className="dot w-2 h-2 bg-white rounded-full"></div>
                  <div className="dot w-2 h-2 bg-white rounded-full"></div>
                  <div className="dot w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            )}
            
            {hasPermission === false ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                <Camera className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-center text-sm">Camera access is required to scan barcodes</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={startCamera}
                >
                  Request Camera Access
                </Button>
              </div>
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            )}
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-green-500  w-64 h-32 opacity-75">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 -tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 -tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 -bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 -br-lg"></div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground text-center">
            Position the barcode within the frame and tap scan
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={captureAndScan}
              disabled={!isScanning || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <div className="ios-loading-dots flex items-center gap-1 mr-2">
                  <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                  <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                  <div className="dot w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              Scan Barcode
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleManualInput}
              disabled={isLoading}
            >
              Manual Input
            </Button>
          </div>

          {/* Close button */}
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Close Scanner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}