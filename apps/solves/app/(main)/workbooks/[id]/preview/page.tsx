import { workBookService } from "@service/solves";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BaseContainer } from "@/components/layouts/base-container";
import { GoBackLayout } from "@/components/layouts/go-back-layout";
import { WorkbookPublicPreview } from "@/components/workbook/workbook-public-preview";
import { WorkbookSolveNavigateButton } from "@/components/workbook/workbook-solve-navigate-button";
import { BASE_URL } from "@/lib/const";

// 30분(1800초) 동안 캐싱 후 revalidate
export const revalidate = 30;
// // 30분(1800초) 동안 캐싱 후 revalidate
// export const revalidate = 1800;

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
    book.description ||
    `${book.ownerName ?? "알수없는사용자"}님이 만든 문제집입니다.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Solves - AI와 함께 만드는 나만의 문제집",
        },
      ],
      type: "article",
      url: `${BASE_URL}/workbooks/${id}/preview`,
      authors: [book.ownerName ?? "알수없는사용자"],
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
    <GoBackLayout className="h-full overflow-hidden">
      <div className="h-2/3 pointer-events-none absolute left-0 bottom-0 w-full bg-linear-to-b from-transparent via-background/60 to-background z-10 flex flex-col items-center justify-end gap-4">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-primary/10" />
        <div className="pointer-events-auto">
          <WorkbookSolveNavigateButton workBookId={id} />
        </div>
      </div>
      <BaseContainer className="h-full overflow-y-auto">
        <WorkbookPublicPreview book={book} />
      </BaseContainer>
    </GoBackLayout>
  );
}
