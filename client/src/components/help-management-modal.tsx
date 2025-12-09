import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { helpContentSchema } from "@shared/schema";
import { Loader2, Eye, EyeOff } from "lucide-react";
import MDEditor from '@uiw/react-md-editor';

interface HelpManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  helpContent?: any;
}

type HelpContentForm = {
  title: string;
  content: string;
  isActive: boolean;
};

export default function HelpManagementModal({ isOpen, onClose, helpContent }: HelpManagementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [markdownValue, setMarkdownValue] = useState("");

  const form = useForm<HelpContentForm>({
    resolver: zodResolver(helpContentSchema),
    defaultValues: {
      title: "",
      content: "",
      isActive: true,
    },
  });

  // Reset form when modal opens/closes or helpContent changes
  useEffect(() => {
    if (isOpen && helpContent) {
      form.reset({
        title: helpContent.title || "",
        content: helpContent.content || "",
        isActive: helpContent.isActive ?? true,
      });
      setMarkdownValue(helpContent.content || "");
    }
  }, [isOpen, helpContent, form]);

  const updateMutation = useMutation({
    mutationFn: (data: HelpContentForm) =>
      apiRequest("PUT", `/api/help-content/${helpContent?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/help-content/admin"] });
      toast({
        title: "Success",
        description: "Help content updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update help content",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HelpContentForm) => {
    updateMutation.mutate(data);
  };

  const watchedValues = form.watch();

  const previewContent = (
    <div className="prose prose-sm sm:prose max-w-none p-4 border rounded-lg bg-gray-50">
      <h1 className="text-xl font-bold mb-4">{watchedValues.title || "Help & Support"}</h1>
      <div dangerouslySetInnerHTML={{ __html: markdownValue }} />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto mx-4 modal-scrollbar">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
            <span>Edit Help Content</span>
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
            Update the help content that appears in the help modal.
          </p>
        </DialogHeader>

        {showPreview && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Preview:</h3>
            {previewContent}
          </div>
        )}
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
            <Input
              id="title"
              placeholder="Help & Support"
              {...form.register("title")}
              className="h-9"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-600">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">Content *</Label>
            <div className="border rounded-lg overflow-hidden">
              <MDEditor
                value={markdownValue}
                onChange={(val) => {
                  setMarkdownValue(val || "");
                  form.setValue("content", val || "");
                }}
                height={400}
                data-color-mode="light"
              />
            </div>
            {form.formState.errors.content && (
              <p className="text-xs text-red-600">
                {form.formState.errors.content.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Use Markdown syntax to format your content. You can use headings, lists, links, and more.
            </p>
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
              Only one help content can be active at a time.
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
                "Update Help Content"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
