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

const SourcePreview: React.FC<{
  label: string;
  mimeType?: string;
  url?: string;
}> = ({ label, mimeType, url }) => {
  if (!url) {
    return <span>{label}</span>;
  }

  if (mimeType && mimeType.startsWith("image/")) {
    return (
      <div className="flex flex-col items-start gap-2">
        <img
          src={url}
          alt={label}
          width={320}
          height={200}
          className="max-h-52 w-full rounded-lg border object-cover"
        />
        <span className="text-xs text-muted-foreground">{mimeType}</span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-sm text-primary underline"
    >
      {label} {mimeType ? `(${mimeType})` : "리소스 열기"}
    </a>
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
        <ul className="space-y-2 text-sm text-foreground">
          {content.options.map((option, index) => (
            <li
              key={option.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <span className="font-semibold text-muted-foreground">
                {index + 1}.
              </span>
              <div className="flex-1">
                {option.type === "text" ? (
                  <span>{option.text}</span>
                ) : (
                  <SourcePreview
                    label="외부 리소스"
                    mimeType={option.mimeType}
                    url={option.url}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (isContent.ox(content)) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <QuestionText text={questionText} />
        <div className="grid grid-cols-2 gap-4 text-sm text-foreground">
          {[content.oOption, content.xOption].map((option, index) => (
            <div
              key={option.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="mb-2 font-semibold text-muted-foreground">
                {index === 0 ? "O" : "X"}
              </p>
              {option.type === "text" ? (
                <span>{option.text}</span>
              ) : (
                <SourcePreview
                  label="외부 리소스"
                  mimeType={option.mimeType}
                  url={option.url}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isContent.ranking(content)) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <QuestionText text={questionText} />
        <ol className="space-y-2 text-sm text-foreground">
          {content.items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <span className="font-semibold text-muted-foreground">
                {index + 1}.
              </span>
              <div className="flex-1">
                {item.type === "text" ? (
                  <span>{item.text}</span>
                ) : (
                  <SourcePreview
                    label="외부 리소스"
                    mimeType={item.mimeType}
                    url={item.url}
                  />
                )}
              </div>
            </li>
          ))}
        </ol>
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
