"use client";

import { Eye } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PolicyDialog } from "./policy-dialog";

export interface PolicyVersion {
  id: string;
  type: string;
  version: string;
  title: string;
  content: string;
  isRequired: boolean;
  effectiveAt: Date;
  createdAt: Date;
}

interface PolicyTableProps {
  policies: PolicyVersion[];
}

const policyTypeLabels: Record<string, string> = {
  privacy: "개인정보",
  terms: "이용약관",
  community: "커뮤니티",
  marketing: "마케팅",
};

const policyTypeColors: Record<string, "default" | "secondary" | "outline"> = {
  privacy: "default",
  terms: "secondary",
  community: "outline",
  marketing: "outline",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function PolicyTable({ policies }: PolicyTableProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyVersion | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleView = (policy: PolicyVersion) => {
    setSelectedPolicy(policy);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>타입</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>버전</TableHead>
              <TableHead className="text-center">필수</TableHead>
              <TableHead>시행일</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-center">상세</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">
                    등록된 정책이 없습니다.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <Badge variant={policyTypeColors[policy.type] || "outline"}>
                      {policyTypeLabels[policy.type] || policy.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{policy.title}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                      v{policy.version}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={policy.isRequired ? "default" : "secondary"}>
                      {policy.isRequired ? "필수" : "선택"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(policy.effectiveAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(policy.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(policy)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedPolicy && (
        <PolicyDialog
          policy={selectedPolicy}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </>
  );
}






