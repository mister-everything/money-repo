"use client";

import { generateUUID } from "@workspace/util";
import { ReactNode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Alert = {
  title?: ReactNode;
  description?: ReactNode;
};

const createContainer = () => {
  const container = document.createElement("div");
  container.id = generateUUID();
  document.body.appendChild(container);
  return container;
};

export const notify = {
  component({
    renderer,
    className,
  }: {
    renderer: ({ close }: { close: () => void }) => ReactNode;
    className?: string;
  }) {
    return new Promise<void>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);
      const close = () => {
        root.unmount();
        container.remove();
        resolve();
      };
      root.render(
        <Dialog open onOpenChange={close}>
          <DialogContent className={className}>
            <DialogHeader className="hidden">
              <DialogTitle></DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            {renderer({ close })}
          </DialogContent>
        </Dialog>,
      );
    });
  },
  alert(alert: Alert & { okText?: ReactNode }) {
    return new Promise<void>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);
      const close = () => {
        root.unmount();
        container.remove();
        resolve();
      };
      root.render(
        <Dialog open onOpenChange={close}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{alert.title}</DialogTitle>
              <DialogDescription>{alert.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant={"ghost"} onClick={close}>
                {alert.okText || "확인"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );
    });
  },
  confirm: (
    confirm: Alert & { okText?: ReactNode; cancelText?: ReactNode },
  ) => {
    return new Promise<boolean>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);
      const close = () => {
        root.unmount();
        container.remove();
      };
      const ok = () => {
        resolve(true);
        close();
      };
      const cancel = () => {
        resolve(false);
        close();
      };

      function Component() {
        return (
          <Dialog open onOpenChange={cancel}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{confirm.title}</DialogTitle>
                <DialogDescription>{confirm.description}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant={"ghost"} onClick={cancel}>
                  {confirm.cancelText || "취소"}
                </Button>
                <Button variant={"secondary"} onClick={ok}>
                  {confirm.okText || "확인"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      }

      root.render(<Component />);
    });
  },
  prompt: (
    prompt: Alert & {
      multiline?: boolean;
      placeholder?: string;
      okText?: ReactNode;
      cancelText?: ReactNode;
    },
  ) => {
    return new Promise<string>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);

      const close = (text: string = "") => {
        root.unmount();
        container.remove();
        resolve(text);
      };
      const Component = () => {
        const [text, setText] = useState("");
        const handleKeyDown = (
          e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
        ) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            close(text);
          }
        };

        return (
          <Dialog open onOpenChange={() => close()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{prompt.title}</DialogTitle>
                <DialogDescription>{prompt.description}</DialogDescription>
                {prompt.multiline ? (
                  <Textarea
                    className="resize-none max-h-[200px]"
                    placeholder={prompt.placeholder}
                    autoFocus
                    value={text}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setText(e.target.value)}
                  />
                ) : (
                  <Input
                    placeholder={prompt.placeholder}
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                )}
              </DialogHeader>
              <DialogFooter>
                <Button variant={"ghost"} onClick={() => close()}>
                  {prompt.cancelText || "취소"}
                </Button>
                <Button
                  disabled={!text.trim()}
                  variant={"secondary"}
                  onClick={() => close(text)}
                >
                  {prompt.okText || "확인"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      };

      root.render(<Component />);
    });
  },
};
