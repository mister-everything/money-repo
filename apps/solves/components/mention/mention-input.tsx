"use client";

import Mention from "@tiptap/extension-mention";
import {
  Editor,
  EditorContent,
  Range,
  UseEditorOptions,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "lib/utils";

import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { MentionInputItem } from "./mention-item";
import { MentionSuggestion } from "./mention-suggestion-popup";
import { SolvesMentionItem, TipTapMentionJsonContent } from "./types";
import { serializeMention } from "./util";

interface MentionInputProps {
  disabled?: boolean;
  defaultContent?: TipTapMentionJsonContent | string;
  onChange?: (content: {
    json: TipTapMentionJsonContent;
    text: string;
    mentions: SolvesMentionItem[];
  }) => void;
  onEnter?: () => void;
  placeholder?: string;
  suggestionChar?: string;
  className?: string;
  editorRef?: RefObject<Editor | null>;
  onFocus?: () => void;
  onBlur?: () => void;
  fullWidthSuggestion?: boolean;
  items?: (searchValue: string) => SolvesMentionItem[];
}

export default function MentionInput({
  defaultContent,
  onChange,
  disabled,
  onEnter,
  placeholder = "",
  suggestionChar = "@",
  items,
  className,
  editorRef,
  onFocus,
  onBlur,
  fullWidthSuggestion = false,
}: MentionInputProps) {
  const [open, setOpen] = useState(false);
  const position = useRef<{
    top: number;
    left: number;
    range: Range;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined,
  );
  const latestContent = useRef<{
    json: TipTapMentionJsonContent;
    text: string;
  } | null>(null);

  // Memoize editor configuration
  const editorConfig = useMemo<UseEditorOptions>(() => {
    return {
      editable: !disabled,
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          // We only want "mention + plain text". Disable all markdown-like input rules / formatting.
          blockquote: false,
          bold: false,
          bulletList: false,
          code: false,
          codeBlock: false,
          heading: false,
          italic: false,
          listItem: false,
          orderedList: false,
          strike: false,
        }),
        Mention.configure({
          HTMLAttributes: {
            class: "mention",
          },
          renderHTML: (props) => {
            const el = document.createElement("div");
            el.className = "inline-flex";
            const root = createRoot(el);
            root.render(
              <MentionInputItem
                item={props.node.attrs.id as SolvesMentionItem}
              />,
            );

            return el;
          },
          suggestion: {
            char: suggestionChar,
            render: () => {
              return {
                onStart: (props) => {
                  if (fullWidthSuggestion) {
                    const containerRect =
                      containerRef.current?.getBoundingClientRect();
                    if (containerRect) {
                      position.current = {
                        top: containerRect.top,
                        left: containerRect.left,
                        range: props.range,
                      };
                      setContainerWidth(containerRect.width);
                      setOpen(true);
                    }
                  } else {
                    const rect = props.clientRect?.();
                    if (rect) {
                      position.current = {
                        top: rect.top,
                        left: rect.left,
                        range: props.range,
                      };
                      setContainerWidth(undefined);
                      setOpen(true);
                    }
                  }
                },
                onExit: () => setOpen(false),
              };
            },
          },
        }),
      ],
      autofocus: true,
      onUpdate: ({ editor }) => {
        const json = editor.getJSON() as TipTapMentionJsonContent;
        const text = editor.getText();
        const mentions = json?.content
          ?.flatMap(({ content }) => {
            return content
              ?.filter((v) => v.type == "mention")
              .map((v) => (v as any).attrs.id);
          })
          .filter(Boolean) as SolvesMentionItem[];

        latestContent.current = {
          json,
          text,
        };
        onChange?.({
          json,
          text: text?.trim(),
          mentions,
        });
      },
      onFocus: () => {
        onFocus?.();
      },
      onBlur: () => {
        onBlur?.();
      },
      editorProps: {
        // Always paste as plain text to avoid HTML/markdown-like transformations.
        handlePaste: (view, event) => {
          const text = event.clipboardData?.getData("text/plain");
          if (text == null) return false;
          event.preventDefault();
          const normalized = text.replace(/\r\n/g, "\n");
          view.dispatch(view.state.tr.insertText(normalized));
          return true;
        },
        attributes: {
          class:
            "w-full max-h-80 min-h-[2rem] break-words overflow-y-auto resize-none focus:outline-none px-2 py-1 prose prose-sm dark:prose-invert ",
        },
        content: defaultContent ?? "",
      },
    };
  }, [
    disabled,
    suggestionChar,
    defaultContent,
    onChange,
    onFocus,
    onBlur,
    fullWidthSuggestion,
  ]);

  const editor = useEditor(editorConfig);

  // Expose editor through ref
  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled]);

  // Memoize handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isSubmit =
        !open && e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing;
      if (isSubmit) {
        e.preventDefault();
        onEnter?.();
      }
    },
    [editor, onEnter, open],
  );

  const onSelectMention = useCallback(
    (item: SolvesMentionItem) => {
      editor
        ?.chain()
        .focus()
        .insertContentAt(position.current!.range, [
          {
            type: "mention",
            attrs: {
              id: item,
              label: serializeMention(item),
            },
          },
        ])
        .run();
      setOpen(false);
    },
    [editor],
  );

  const placeholderElement = useMemo(() => {
    if (!editor?.isEmpty) return null;

    return (
      <div className="absolute top-1 left-2 text-muted-foreground pointer-events-none">
        {placeholder}
      </div>
    );
  }, [editor?.isEmpty, placeholder]);

  useEffect(() => {
    if (open) {
      return () => {
        editor?.commands.focus();
      };
    }
    position.current = null;
    editor?.commands.focus();
  }, [open]);

  const focus = useCallback(() => {
    editor?.commands.focus();
  }, [editor]);
  const showSuggestion = useMemo(() => {
    return open && Boolean(items);
  }, [open, Boolean(items)]);

  return (
    <div
      ref={containerRef}
      onClick={focus}
      className={cn("relative w-full", className)}
    >
      <EditorContent editor={editor} onKeyDown={handleKeyDown} />
      {showSuggestion &&
        createPortal(
          <MentionSuggestion
            onSelectMention={onSelectMention}
            width={
              fullWidthSuggestion && containerWidth ? containerWidth : undefined
            }
            onClose={() => setOpen(false)}
            top={position.current?.top ?? 0}
            left={position.current?.left ?? 0}
            items={items as (searchValue: string) => SolvesMentionItem[]}
          />,
          document.body,
        )}
      {placeholderElement}
    </div>
  );
}
