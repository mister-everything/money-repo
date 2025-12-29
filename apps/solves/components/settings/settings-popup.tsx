"use client";

import { User2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Account } from "./account";

const defaultTapClassName =
  "w-full shadow-none! py-2 hover:bg-secondary data-[state=active]:bg-secondary justify-start gap-2";

const DEFAULT_TAB_VALUE = "account";
export function SettingsPopup({
  children,
  open,
  onOpenChange,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [tabValue, setTabValue] = useState(DEFAULT_TAB_VALUE);

  const _onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setTabValue(DEFAULT_TAB_VALUE);
      }
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={_onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent
        style={{
          userSelect: "text",
        }}
        className="w-full h-[80vh] max-w-3xl! overflow-hidden p-0!"
      >
        <DialogTitle className="sr-only">설정</DialogTitle>
        <DialogDescription className="sr-only" />
        <Tabs
          value={tabValue}
          onValueChange={setTabValue}
          className="flex w-full flex-row gap-0"
        >
          <div className="w-1/4 p-2 ">
            <p className="px-2  py-2 text-sm font-medium text-muted-foreground">
              설정
            </p>
            <TabsList className="flex bg-background flex-col w-full h-fit gap-1 ">
              <TabsTrigger className={defaultTapClassName} value="account">
                <User2Icon />
                계정
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 border-l h-full overflow-y-auto">
            <p className="border-b px-6 py-4">
              {tabValue === "account" ? "계정" : ""}
            </p>
            <div className="p-6">
              <TabsContent value="account">
                <Account />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
