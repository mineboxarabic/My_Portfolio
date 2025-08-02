import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Upload, Trash2, Loader2, Plus } from "lucide-react";

interface MultiImageUploadProps {
  bucket: string;
  imageUrls: string[];
  onUrlsChange: (urls: string[]) => void;
  label: string;
}

const MultiImageUpload = ({ bucket, imageUrls, onUrlsChange, label }: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        
        return publicUrlData.publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      onUrlsChange([...imageUrls, ...newUrls.filter((url): url is string => !!url)]);
      showSuccess(`${newUrls.length} image(s) uploaded successfully!`);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to upload images.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    onUrlsChange(newUrls);
  };

  const handleAddLink = () => {
    if (!linkUrl || !linkUrl.startsWith('http')) {
      showError("Please enter a valid URL.");
      return;
    }
    onUrlsChange([...imageUrls, linkUrl]);
    setLinkUrl("");
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 space-y-2 p-2 border rounded-md">
        <div className="grid grid-cols-3 gap-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img src={url} alt={`Image ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id="multi-image-upload-input"
            type="file"
            multiple
            className="hidden"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button asChild type="button" variant="outline" className="flex-1">
            <Label htmlFor="multi-image-upload-input" className="cursor-pointer">
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Upload Files"}
            </Label>
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Or add image from URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={handleAddLink}>
            <Plus className="h-4 w-4 mr-2" />
            Add URL
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MultiImageUpload;