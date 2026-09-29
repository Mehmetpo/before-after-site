"use client";

import {
  DownloadIcon,
  Maximize2Icon,
  RotateCcwIcon,
  RotateCwIcon,
  SlidersHorizontalIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { Button } from "@/components/ui/v-toolbar-3-utils/button";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/ui/v-toolbar-3-utils/toolbar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/v-toolbar-3-utils/tooltip";

// Wiring: the demo's hardcoded buttons now call these handlers. Crop was removed
// (out of scope); Export renders only when a handler is passed.
export interface PatternProps {
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onZoomOut?: () => void;
  onZoomIn?: () => void;
  onFit?: () => void;
  onAdjustments?: () => void;
  adjustmentsOpen?: boolean;
  onExport?: () => void;
  "aria-label"?: string;
}

export function Pattern({
  onRotateLeft,
  onRotateRight,
  onZoomOut,
  onZoomIn,
  onFit,
  onAdjustments,
  adjustmentsOpen,
  onExport,
  "aria-label": ariaLabel,
}: PatternProps = {}) {
  const transformTools = [
    { icon: RotateCcwIcon, label: "Rotate left", onClick: onRotateLeft },
    { icon: RotateCwIcon, label: "Rotate right", onClick: onRotateRight },
  ] as const;

  const zoomTools = [
    { icon: ZoomOutIcon, label: "Zoom out", onClick: onZoomOut },
    { icon: ZoomInIcon, label: "Zoom in", onClick: onZoomIn },
    { icon: Maximize2Icon, label: "Fit to screen", onClick: onFit },
  ] as const;

  return (
    <TooltipProvider>
      <Toolbar aria-label={ariaLabel}>
        <ToolbarGroup>
          {transformTools.map(({ icon: Icon, label, onClick }) => (
            <Tooltip key={label}>
              <TooltipTrigger
                render={
                  <ToolbarButton
                    aria-label={label}
                    onClick={onClick}
                    render={<Button size="icon" variant="ghost" />}
                  >
                    <Icon />
                  </ToolbarButton>
                }
              />
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          {zoomTools.map(({ icon: Icon, label, onClick }) => (
            <Tooltip key={label}>
              <TooltipTrigger
                render={
                  <ToolbarButton
                    aria-label={label}
                    onClick={onClick}
                    render={<Button size="icon" variant="ghost" />}
                  >
                    <Icon />
                  </ToolbarButton>
                }
              />
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToolbarButton
                  aria-label="Adjustments"
                  aria-pressed={adjustmentsOpen}
                  onClick={onAdjustments}
                  render={<Button size="icon" variant="ghost" />}
                >
                  <SlidersHorizontalIcon />
                </ToolbarButton>
              }
            />
            <TooltipContent>Adjustments</TooltipContent>
          </Tooltip>
        </ToolbarGroup>

        {onExport && (
          <>
            <ToolbarSeparator />

            <ToolbarGroup>
              <ToolbarButton onClick={onExport} render={<Button size="sm" />}>
                <DownloadIcon />
                Export
              </ToolbarButton>
            </ToolbarGroup>
          </>
        )}
      </Toolbar>
    </TooltipProvider>
  );
}

export default Pattern;
