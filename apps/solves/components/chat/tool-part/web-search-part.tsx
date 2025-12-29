"use client";

import { equal, toAny, truncateString } from "@workspace/util";
import { ToolUIPart } from "ai";
import { AlertTriangleIcon, SearchIcon } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { notify } from "@/components/ui/notify";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";

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
      <div className="flex items-center text-muted-foreground gap-2 text-sm">
        <SearchIcon className="size-3 wiggle" />
        <TextShimmer>
          {query?.length
            ? `"${truncateString(query, 30)}" 에 관련 검색`
            : "웹 검색 중..."}
        </TextShimmer>
      </div>
    );
  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground fade-300">
      <div className="flex items-center gap-2">
        {result?.results?.length && (
          <p className="text-xs ml-1 flex items-center gap-1">
            {query?.length ? (
              <span className="font-semibold">{`${truncateString(query, 40)}`}</span>
            ) : (
              ""
            )}

            <span>{`${result?.results?.length}개의 검색 결과`}</span>
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <div className="px-2.5">
          <Separator
            orientation="vertical"
            className="bg-linear-to-b from-border to-transparent from-80%"
          />
        </div>
        <div className="flex flex-col gap-2 pb-2">
          {Boolean(images?.length) && (
            <div className="grid grid-cols-3 gap-3 max-w-2xl">
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
                        className="block shadow rounded-lg overflow-hidden ring ring-input cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          loading="lazy"
                          src={image.url}
                          alt={image.description}
                          className="w-full h-36 object-cover hover:scale-120 transition-transform duration-300"
                          onError={onError}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-4 max-w-xs whitespace-pre-wrap wrap-break-word">
                      <p className="text-xs text-muted-foreground">
                        {image.description || image.url}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {part.errorText ? (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangleIcon className="size-3.5" />
                {"웹 검색 오류가 발생했습니다."}
              </p>
            ) : (
              (result as ExaSearchResponse)?.results?.map((result, i) => {
                return (
                  <HoverCard key={i} openDelay={200} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-full bg-secondary pl-1.5 pr-2 py-1.5 text-xs flex items-center gap-1 hover:bg-primary/5 hover:ring hover:ring-primary transition-all cursor-pointer"
                      >
                        <div className="rounded-full bg-input ring ring-input">
                          <Avatar className="size-3 rounded-full">
                            <AvatarImage src={result.favicon} />
                            <AvatarFallback>
                              {result.title?.slice(0, 1).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="truncate max-w-44">{result.url}</span>
                      </a>
                    </HoverCardTrigger>

                    <HoverCardContent className="flex flex-col gap-1 p-6">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full ring ring-input">
                          <Avatar className="size-6 rounded-full">
                            <AvatarImage src={result.favicon} />
                            <AvatarFallback>
                              {result.title?.slice(0, 1).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span
                          className={cn(
                            "font-medium",
                            !result.title && "truncate",
                          )}
                        >
                          {result.title || result.url}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 mt-4">
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-card from-80% " />
                          <p className="text-xs text-muted-foreground max-h-60 overflow-y-auto">
                            {result.text}
                          </p>
                        </div>
                        {result.author && (
                          <div className="text-xs text-muted-foreground mt-2">
                            <span className="font-medium">Author:</span>{" "}
                            {result.author}
                          </div>
                        )}
                        {result.publishedDate && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Published:</span>{" "}
                            {new Date(
                              result.publishedDate,
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
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
