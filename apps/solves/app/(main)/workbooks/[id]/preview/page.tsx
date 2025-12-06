import { workBookService } from "@service/solves";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkbookPublicPreview } from "@/components/workbook/workbook-public-preview";

// 30분(1800초) 동안 캐싱 후 revalidate
export const revalidate = 1800;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const book = await workBookService.getWorkBookWithoutAnswer(id, {
    isPublished: true,
  });

  if (!book) {
    return {
      title: "문제집을 찾을 수 없습니다",
    };
  }

  const title = `${book.title} - Solves 문제집`;
  const description =
    book.description || `${book.ownerName}님이 만든 문제집입니다.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      authors: [book.ownerName],
      publishedTime: book.publishedAt?.toISOString(),
      tags: book.tags.map((tag) => tag.name),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function WorkbookPreviewPage({ params }: PageProps) {
  const { id } = await params;

  const book = await workBookService.getWorkBookWithoutAnswer(id, {
    isPublished: true,
  });
  if (!book) notFound();

  return (
    <div className="flex w-full h-screen px-4 gap-4">
      <div className="flex-1">
        <WorkbookPublicPreview book={book} />
      </div>
    </div>
  );
}
