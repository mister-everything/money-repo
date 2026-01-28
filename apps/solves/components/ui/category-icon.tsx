import {
  BookTextIcon,
  BotIcon,
  BriefcaseBusinessIcon,
  ClapperboardIcon,
  FlaskConicalIcon,
  GraduationCapIcon,
  HatGlassesIcon,
  HouseHeartIcon,
  LightbulbIcon,
  UserRoundIcon,
} from "lucide-react";
import { ComponentProps } from "react";

export function CategoryIcon({
  categoryName,
  ...props
}: { categoryName?: string } & ComponentProps<typeof LightbulbIcon>) {
  // 학교 교과목
  if (categoryName?.startsWith("학교")) return <GraduationCapIcon {...props} />;

  // 시사
  if (categoryName?.startsWith("시사")) return <BookTextIcon {...props} />;

  // 역사 문화 예술
  if (categoryName?.startsWith("역사")) return <HatGlassesIcon {...props} />;

  // 영화 음악
  if (categoryName?.startsWith("영화")) return <ClapperboardIcon {...props} />;

  // 업무 직무
  if (categoryName?.startsWith("업무"))
    return <BriefcaseBusinessIcon {...props} />;
  // MBTI 성향
  if (categoryName?.startsWith("심리")) return <UserRoundIcon {...props} />;

  // 취미 라이프 스타일
  if (categoryName?.startsWith("취미")) return <HouseHeartIcon {...props} />;
  // 과학 기술 IT
  if (categoryName?.startsWith("과학")) return <BotIcon {...props} />;

  // 기타
  if (categoryName?.startsWith("기타")) return <FlaskConicalIcon {...props} />;

  return <LightbulbIcon {...props} />;
}
