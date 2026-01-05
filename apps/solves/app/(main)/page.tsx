import { workBookService } from "@service/solves";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import PromptInput from "@/components/chat/prompt-input";
import { PolicyFooter } from "@/components/layouts/policy-footer";
import { Button } from "@/components/ui/button";
import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { WorkbookCarousel } from "@/components/workbook/workbook-carousel";

export default async function Page() {
  const workBooks = await workBookService.searchWorkBooks({
    isPublished: true,
    limit: 5,
  });

  return (
    <div className="p-6 lg:p-10 w-full flex flex-col gap-8">
      <header className="font-semibold text-foreground flex flex-col items-center w-full mt-20">
        <h1 className="mb-4 text-4xl">
          <GradualSpacingText
            duration={1}
            delayMultiple={0.08}
            text="호기심이 문제가 되는 순간,"
          />
        </h1>
        <h2 className="text-3xl font-bold fade-5000">
          Solves<span className="text-4xl text-primary">.</span>
        </h2>
      </header>

      <div className="max-w-4xl w-full mx-auto fade-3000">
        <div className="flex items-center justify-end">
          <Link href="/workbooks">
            <Button variant="ghost">
              더 많은 문제집
              <ChevronRightIcon />
            </Button>
          </Link>
        </div>

        <WorkbookCarousel workBooks={workBooks} />
      </div>
      <div className="w-2xl mx-auto">
        <PromptInput autofocus={false} />
      </div>

      <div className="py-12">
        <PolicyFooter />
      </div>
    </div>
  );
}
