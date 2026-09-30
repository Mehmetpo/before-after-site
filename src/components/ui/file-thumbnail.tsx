import { cn } from "@/lib/utils";

/**
 * Minimal helper written locally: the 21st.dev file-upload-2 registry entry
 * imports `@/components/ui/file-thumbnail` but does not ship it.
 * Shows the image preview when available, otherwise the file extension.
 */
type FileThumbnailProps = {
  file: { name: string; type: string };
  previewImageUrl?: string | null;
  className?: string;
};

export function FileThumbnail({
  file,
  previewImageUrl,
  className,
}: FileThumbnailProps) {
  const extension = file.name.includes(".")
    ? (file.name.split(".").pop() ?? "").slice(0, 4).toUpperCase()
    : "FILE";

  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden border bg-muted text-[10px] font-medium text-muted-foreground",
        className,
      )}
    >
      {previewImageUrl ? (
        <img
          src={previewImageUrl}
          alt={file.name}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span>{extension}</span>
      )}
    </div>
  );
}

export default FileThumbnail;
