import { type BlockContent, isContent } from "@service/solves/types";

interface ContentRendererProps {
  content: BlockContent;
  question?: string;
  className?: string;
}

const QuestionText: React.FC<{ text?: string }> = ({ text }) => {
  if (!text) {
    return null;
  }
  return (
    <p className="text-foreground leading-relaxed whitespace-pre-line">
      {text}
    </p>
  );
};

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  question,
  className = "",
}) => {
  const baseClasses = "space-y-4";
  const questionText = question;

  if (isContent.default(content)) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <QuestionText text={questionText} />
      </div>
    );
  }

  if (isContent.mcq(content)) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <QuestionText text={questionText} />
      </div>
    );
  }

  if (isContent.ox(content)) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <QuestionText text={questionText} />
      </div>
    );
  }

  if (isContent.ranking(content)) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <QuestionText text={questionText} />
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      <QuestionText text={questionText} />
      <p className="text-sm text-muted-foreground">표시할 콘텐츠가 없습니다.</p>
    </div>
  );
};
