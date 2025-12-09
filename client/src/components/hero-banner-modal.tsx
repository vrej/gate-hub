import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { heroBannerSchema } from "@shared/schema";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface HeroBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  heroBanner?: any;
}

type HeroBannerForm = {
  title: string;
  subtitle: string;
  brandName: string;
  isActive: boolean;
};

export default function HeroBannerModal({ isOpen, onClose, heroBanner }: HeroBannerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<HeroBannerForm>({
    resolver: zodResolver(heroBannerSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      brandName: "",
      isActive: true,
    },
  });

  // Reset form when modal opens/closes or heroBanner changes
  useEffect(() => {
    if (isOpen && heroBanner) {
      form.reset({
        title: heroBanner.title || "",
        subtitle: heroBanner.subtitle || "",
        brandName: heroBanner.brandName || "",
        isActive: heroBanner.isActive ?? true,
      });
    }
  }, [isOpen, heroBanner, form]);

  const updateMutation = useMutation({
    mutationFn: (data: HeroBannerForm) =>
      apiRequest("PUT", `/api/hero-banner/${heroBanner?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-banner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-banner/admin"] });
      toast({
        title: "Success",
        description: "Hero banner updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update hero banner",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HeroBannerForm) => {
    updateMutation.mutate(data);
  };

  const watchedValues = form.watch();

  const previewContent = (
    <div className="gradient-bg py-12 sm:py-16 rounded-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            <span className="text-brand">{watchedValues.brandName || "WhyBrands"}</span>{" "}
            {watchedValues.title?.replace(watchedValues.brandName || "WhyBrands", "").trim() || "Application Portal"}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            {watchedValues.subtitle || "Find and request access to approved software applications for your department."}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto mx-4 modal-scrollbar">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
            <span>Edit Hero Banner</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Update the hero banner content that appears on the main page.
          </p>
        </DialogHeader>

        {showPreview && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview:</h3>
            {previewContent}
          </div>
        )}
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandName" className="text-sm font-medium">Brand Name *</Label>
            <Input
              id="brandName"
              placeholder="WhyBrands"
              {...form.register("brandName")}
              className="h-9"
            />
            {form.formState.errors.brandName && (
              <p className="text-xs text-red-600">
                {form.formState.errors.brandName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
            <Input
              id="title"
              placeholder="Application Portal"
              {...form.register("title")}
              className="h-9"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-600">
                {form.formState.errors.title.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              This will be combined with the brand name to create the full title.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle" className="text-sm font-medium">Subtitle *</Label>
            <Textarea
              id="subtitle"
              placeholder="Find and request access to approved software applications for your department."
              className="resize-none text-sm"
              rows={3}
              {...form.register("subtitle")}
            />
            {form.formState.errors.subtitle && (
              <p className="text-xs text-red-600">
                {form.formState.errors.subtitle.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", !!checked)}
            />
            <Label htmlFor="isActive" className="text-sm font-medium">
              Active
            </Label>
            <p className="text-xs text-gray-500">
              Only one hero banner can be active at a time.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 bg-brand hover:bg-brand-dark"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Hero Banner"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
