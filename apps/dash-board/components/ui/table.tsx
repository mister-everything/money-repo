import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  variant?: "default" | "added" | "modified" | "deleted";
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default:
        "border-b border-b-gray-400 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      added:
        "border-2 border-green-500 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      modified:
        "border-2 border-yellow-500 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      deleted:
        "border-2 border-red-500 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted line-through opacity-75",
    };

    return (
      <tr
        ref={ref}
        className={cn(variantStyles[variant], className)}
        {...props}
      />
    );
  }
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-center align-middle font-medium text-[#00256C] bg-gray-100 border-t-2 border-t-sky-200 border-b border-b-gray-400 [&:has([role=checkbox])]:pr-0 border-r border-r-gray-400 last:border-r-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle text-center [&:has([role=checkbox])]:pr-0 border-r border-r-gray-400 last:border-r-0",
      className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
