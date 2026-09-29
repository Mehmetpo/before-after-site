"use client";

import {
  CropIcon,
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

const transformTools = [
  { icon: CropIcon, label: "Crop" },
  { icon: RotateCcwIcon, label: "Rotate left" },
  { icon: RotateCwIcon, label: "Rotate right" },
] as const;

const zoomTools = [
  { icon: ZoomOutIcon, label: "Zoom out" },
  { icon: ZoomInIcon, label: "Zoom in" },
  { icon: Maximize2Icon, label: "Fit to screen" },
] as const;

export function Pattern() {
  return (
    <TooltipProvider>
      <Toolbar>
        <ToolbarGroup>
          {transformTools.map(({ icon: Icon, label }) => (
            <Tooltip key={label}>
              <TooltipTrigger
                render={
                  <ToolbarButton
                    aria-label={label}
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
          {zoomTools.map(({ icon: Icon, label }) => (
            <Tooltip key={label}>
              <TooltipTrigger
                render={
                  <ToolbarButton
                    aria-label={label}
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
                  render={<Button size="icon" variant="ghost" />}
                >
                  <SlidersHorizontalIcon />
                </ToolbarButton>
              }
            />
            <TooltipContent>Adjustments</TooltipContent>
          </Tooltip>
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <ToolbarButton render={<Button size="sm" />}>
            <DownloadIcon />
            Export
          </ToolbarButton>
        </ToolbarGroup>
      </Toolbar>
    </TooltipProvider>
  );
}

export default Pattern;
