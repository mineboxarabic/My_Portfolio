import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Upload, Trash2, Loader2, Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageUploadProps {
  bucket: string;
  currentImageUrl: string | null | undefined;
  onUploadSuccess: (url: string) => void;
  onRemove?: () => void;
  label: string;
}

const ImageUpload = ({ bucket, currentImageUrl, onUploadSuccess, onRemove, label }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      if (!publicUrlData.publicUrl) {
        throw new Error("Could not get public URL for the uploaded file.");
      }

      onUploadSuccess(publicUrlData.publicUrl);
      showSuccess("Image uploaded successfully!");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setUploading(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSetLink = () => {
    if (!linkUrl) {
      showError("Please enter a valid URL.");
      return;
    }
    onUploadSuccess(linkUrl);
    setLinkUrl("");
    showSuccess("Image link set successfully!");
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex items-start gap-4 p-2 border rounded-md">
        {currentImageUrl ? (
          <img src={currentImageUrl} alt="Current" className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-400 flex-shrink-0">
            No Image
          </div>
        )}
        <div className="flex-1">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" /> Upload
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link className="mr-2 h-4 w-4" /> Link
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="pt-2">
              <Button type="button" variant="outline" onClick={triggerFileInput} disabled={uploading} className="w-full">
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Choose File"}
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </TabsContent>
            <TabsContent value="link" className="pt-2 space-y-2">
              <Input
                type="url"
                placeholder="https://example.com/image.png"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleSetLink} className="w-full">
                Set Image from Link
              </Button>
            </TabsContent>
          </Tabs>
          {currentImageUrl && onRemove && (
            <Button type="button" variant="destructive" size="sm" onClick={onRemove} className="mt-2 w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Image
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;