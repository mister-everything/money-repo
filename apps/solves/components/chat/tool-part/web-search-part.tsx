"use client";

import { equal, toAny, truncateString } from "@workspace/util";
import { ToolUIPart } from "ai";
import { motion } from "framer-motion";
import { AlertTriangleIcon, SearchIcon } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { notify } from "@/components/ui/notify";
import { Skeleton } from "@/components/ui/skeleton";
import { TextShimmer } from "@/components/ui/text-shimmer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExaSearchResponse,
  ExaSearchSimpleInput,
} from "@/lib/ai/tools/web-search/types";

interface WebSearchToolInvocationProps {
  part: ToolUIPart;
}

function PureWebSearchToolPart({ part }: WebSearchToolInvocationProps) {
  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as ExaSearchResponse;
  }, [part.state]);
  const [errorSrc, setErrorSrc] = useState<string[]>([]);

  const query = useMemo(() => {
    return (part.input as ExaSearchSimpleInput)?.query;
  }, [part.input]);

  const onError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (errorSrc.includes(target.src)) return;
    setErrorSrc([...errorSrc, target.src]);
  };

  const images = useMemo(() => {
    // Exa doesn't provide separate images array, but individual results may have image property
    return (
      result?.results
        ?.filter((r) => r.image && !errorSrc.includes(r.image))
        .map((r) => ({ url: r.image!, description: r.title })) ?? []
    );
  }, [result?.results, errorSrc]);

  if (!part.state.startsWith("output"))
    return (
      <div className="flex flex-col gap-3 min-w-[300px] w-full fade-300">
        <div className="flex items-center text-muted-foreground gap-2 text-sm">
          <SearchIcon className="size-3 wiggle" />
          <TextShimmer>
            {query?.length
              ? `"${truncateString(query, 30)}" 에 관련 검색`
              : "웹 검색 중..."}
          </TextShimmer>
        </div>
        <div className="relative overflow-hidden rounded-xl border bg-background/50 mx-12">
          {/* Browser Header Simulation */}
          <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
            <div className="flex gap-1.5">
              <div className="size-2 rounded-full bg-muted-foreground/20" />
              <div className="size-2 rounded-full bg-muted-foreground/20" />
              <div className="size-2 rounded-full bg-muted-foreground/20" />
            </div>
          </div>

          {/* Search Results Simulation */}
          <div className="relative h-[160px] overflow-hidden p-3">
            <div className="absolute inset-x-0 top-0 z-10 h-4 bg-linear-to-b from-background/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-10 h-12 bg-linear-to-t from-background/50 to-transparent" />

            <motion.div
              initial={{ y: 0 }}
              animate={{ y: "-50%" }}
              transition={{
                duration: 5, // Slower duration since we scroll more content now
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
              className="flex flex-col"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex gap-3 mb-4">
                  <Skeleton className="size-10 rounded-lg shrink-0" />
                  <div className="flex flex-col gap-2 flex-1 pt-1">
                    <Skeleton className="h-3 w-3/4 rounded-full" />
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-2 w-5/6 rounded-full" />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    );
  return (
    <div className="flex flex-col gap-3 min-w-[300px] w-full fade-300">
      <div className="flex items-center text-muted-foreground gap-2 text-sm">
        <SearchIcon className="size-3" />
        <span className="text-muted-foreground">
          {query?.length
            ? `"${truncateString(query, 30)}" 검색 완료`
            : "검색 완료"}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-background/50 mx-12">
        {/* Browser Header Simulation */}
        <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
          <div className="flex gap-1.5">
            <div className="size-2 rounded-full bg-muted-foreground/20" />
            <div className="size-2 rounded-full bg-muted-foreground/20" />
            <div className="size-2 rounded-full bg-muted-foreground/20" />
          </div>
        </div>

        <div className="p-3 flex flex-col gap-4 max-h-[400px] overflow-y-auto scrollbar-hide">
          {Boolean(images?.length) && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((image, i) => {
                if (!image.url) return null;
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div
                        key={image.url}
                        onClick={() => {
                          notify.component({
                            className: "max-w-[90vw]! max-h-[90vh]! p-6!",
                            renderer: () => (
                              <div className="flex flex-col h-full gap-4">
                                <div className="flex-1 flex items-center justify-center min-h-0 py-6">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={image.url}
                                    className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg"
                                    alt={image.description}
                                    onError={onError}
                                  />
                                </div>
                              </div>
                            ),
                          });
                        }}
                        className="block rounded-lg overflow-hidden ring-1 ring-border/50 cursor-pointer group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          loading="lazy"
                          src={image.url}
                          alt={image.description}
                          className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={onError}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-2 max-w-xs text-xs">
                      {image.description || image.url}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {part.errorText ? (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangleIcon className="size-3.5" />
                {"웹 검색 오류가 발생했습니다."}
              </p>
            ) : (
              (result as ExaSearchResponse)?.results?.map((result, i) => {
                return (
                  <a
                    href={result.url}
                    key={i}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                  >
                    <div className="size-9 rounded-md bg-muted/50 border border-border/50 flex items-center justify-center shrink-0">
                      <Avatar className="size-5 rounded-sm">
                        <AvatarImage src={result.favicon} />
                        <AvatarFallback className="text-[10px]">
                          {result.title?.slice(0, 1).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {result.title || result.url}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 shrink-0">
                          {new URL(result.url).hostname.replace("www.", "")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.url}
                      </p>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function areEqual(
  { part: prevPart }: WebSearchToolInvocationProps,
  { part: nextPart }: WebSearchToolInvocationProps,
) {
  if (prevPart.state != nextPart.state) return false;
  if (!equal(prevPart.input, nextPart.input)) return false;
  if (
    prevPart.state.startsWith("output") &&
    !equal(prevPart.output, toAny(nextPart).output)
  )
    return false;
  return true;
}

export const WebSearchToolPart = memo(PureWebSearchToolPart, areEqual);
