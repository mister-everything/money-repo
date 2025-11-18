import { probService } from "@service/solves";
import { getSession } from "@/lib/auth/server";

export default async function InProgressWorkbooksPage() {
  const session = await getSession();
  const inProgressWorkbooks = await probService.getProbBookInProgress(
    session.user.id,
  );
  return (
    <div className="flex h-screen flex-col relative">
      <div className="flex flex-1 overflow-hidden">
        <div className="overflow-y-auto w-full ml-10 mr-10">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground">
              풀고 있는 문제집을 확인해보세요.
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressWorkbooks.map((workbook) => (
                <div key={workbook.id}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
