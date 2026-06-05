// @ts-nocheck

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconPhoto, IconUpload, IconLoader2, IconCheck, IconZoomIn, IconZoomOut } from "@tabler/icons-react";

interface ProfilePictureCropProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (imageSrc: string, croppedArea: Area) => Promise<void>;
  /** Dialog header title. Defaults to profile-picture copy. */
  title?: string;
  /** Dialog header subtitle. Defaults to profile-picture copy. */
  description?: string;
  /** Success toast shown after onConfirm resolves. */
  successMessage?: string;
  /** Visual crop mask; use 'rect' for logo-style square crops. */
  cropShape?: "round" | "rect";
}

export function ProfilePictureCrop({
  open,
  onOpenChange,
  onConfirm,
  title = "Upload Profile Picture",
  description = "Select and crop your photo to a square.",
  successMessage = "Profile picture updated!",
  cropShape = "round",
}: ProfilePictureCropProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setDone(false);
    });
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      await onConfirm(imageSrc, croppedAreaPixels);
      setDone(true);
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1200);
    } catch {
      setUploading(false);
    }
  };

  const resetState = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setUploading(false);
    setDone(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !uploading) {
      resetState();
    }
    if (!uploading) {
      onOpenChange(isOpen);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200"
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border bg-background shadow-lg",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-200",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-200",
            imageSrc && !uploading ? "h-[min(580px,85vh)]" : "h-auto"
          )}
        >
          <div className="flex items-start justify-between px-6 pt-6 pb-0">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            </div>
            {!uploading && (
              <DialogPrimitive.Close className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </div>

          <Separator className="mx-6 mt-4" />

          <div className="flex flex-1 flex-col overflow-hidden px-6 py-6">
            {uploading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
                {done ? (
                  <>
                    <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                      <IconCheck className="size-8 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium">{successMessage}</p>
                  </>
                ) : (
                  <>
                    <IconLoader2 className="size-10 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Cropping, converting & uploading...
                    </p>
                  </>
                )}
              </div>
            ) : !imageSrc ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
                <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                  <IconPhoto className="size-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Choose a photo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG or WebP. Will be cropped to 1080x1080.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconUpload className="mr-2 size-4" />
                  Select Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <>
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-muted">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape={cropShape}
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <IconZoomOut className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-foreground [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
                  />
                  <IconZoomIn className="size-4 shrink-0 text-muted-foreground" />
                </div>

                <div className="mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setImageSrc(null);
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                  >
                    Choose Different
                  </Button>
                  <Button className="flex-1" onClick={handleConfirm}>
                    Save & Upload
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
