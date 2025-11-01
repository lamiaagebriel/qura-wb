"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/ui/icons";

export interface TimelineItem {
  id?: string;
  title: string;
  description?: React.ReactNode;
  timestamp?: Date | string;
  icon?: React.ReactNode;
  actor?: {
    id: string;
    name: string | null;
    image: string | null;
    email?: string;
  };
  data?: Record<string, any>;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative space-y-6", className)}>
      {items.map((item, index) => (
        <div key={item.id || index} className="relative flex gap-4">
          {/* Timeline line */}
          {index < items.length - 1 && (
            <div className="bg-border absolute top-10 left-[15px] h-full w-0.5" />
          )}

          {/* Icon/Avatar */}
          <div className="relative z-10 flex shrink-0">
            {item.actor ? (
              <Avatar className="border-background size-8 border-2">
                {item.actor.image && (
                  <AvatarImage
                    src={item.actor.image}
                    alt={item.actor.name || ""}
                  />
                )}
                <AvatarFallback>
                  {item.actor.name
                    ? item.actor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : item.actor.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="border-background bg-muted flex size-8 items-center justify-center rounded-full border-2">
                {item.icon || <Icons.dot className="size-4" />}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1 pb-6">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h4 className="text-sm leading-none font-semibold">
                  {item.title}
                </h4>
                {item.actor && (
                  <p className="text-muted-foreground text-xs">
                    {item.actor.name || item.actor.email || "Unknown"}
                  </p>
                )}
              </div>
              {item.timestamp && (
                <time className="text-muted-foreground text-xs">
                  {typeof item.timestamp === "string"
                    ? new Date(item.timestamp).toLocaleString()
                    : item.timestamp.toLocaleString()}
                </time>
              )}
            </div>
            {item.description && (
              <div className="text-muted-foreground text-sm">
                {item.description}
              </div>
            )}
            {item.data && Object.keys(item.data).length > 0 && (
              <div className="bg-muted/50 mt-2 space-y-1 rounded-md border p-2 text-xs">
                {Object.entries(item.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="text-muted-foreground capitalize">
                      {key}:
                    </span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
