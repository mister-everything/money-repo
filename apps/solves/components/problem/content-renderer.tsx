import { ProbContentType } from "@/type";

interface ContentRendererProps {
  content: ProbContentType;
  className?: string;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  className = "",
}) => {
  const baseClasses = "mb-4";

  switch (content.type) {
    case "text":
      return (
        <div className={`${baseClasses} ${className}`}>
          <p className="text-foreground leading-relaxed">
            {content.data.content}
          </p>
        </div>
      );

    case "image":
      return (
        <div className={`${baseClasses} ${className}`}>
          <p className="text-foreground mb-3">{content.data.content}</p>
          {content.data.url && (
            <div className="relative w-full max-w-md mx-auto">
              <img
                src={content.data.url}
                alt="문제 이미지"
                width={400}
                height={300}
                className="rounded-lg border shadow-sm"
              />
            </div>
          )}
        </div>
      );

    case "video":
      return (
        <div className={`${baseClasses} ${className}`}>
          <p className="text-foreground mb-3">{content.data.content}</p>
          {content.data.url && (
            <div className="relative w-full max-w-md mx-auto">
              <video
                controls
                className="w-full rounded-lg border shadow-sm"
                preload="metadata"
              >
                <source src={content.data.url} type="video/mp4" />
                브라우저가 비디오를 지원하지 않습니다.
              </video>
              {content.data.duration && (
                <p className="text-sm text-muted-foreground mt-1">
                  재생 시간: {content.data.duration}초
                </p>
              )}
            </div>
          )}
        </div>
      );

    case "audio":
      return (
        <div className={`${baseClasses} ${className}`}>
          <p className="text-foreground mb-3">{content.data.content}</p>
          {content.data.url && (
            <div className="w-full max-w-md mx-auto">
              <audio controls className="w-full" preload="metadata">
                <source src={content.data.url} type="audio/mpeg" />
                브라우저가 오디오를 지원하지 않습니다.
              </audio>
              {content.data.duration && (
                <p className="text-sm text-muted-foreground mt-1">
                  재생 시간: {content.data.duration}초
                </p>
              )}
            </div>
          )}
        </div>
      );

    case "mixed":
      return (
        <div className={`${baseClasses} ${className}`}>
          <p className="text-foreground mb-3">
            {content.data.map((item) => item.content).join(", ")}
          </p>
          <div className="space-y-3">
            {content.data.map((item, index) => (
              <div key={index} className="border rounded-lg p-3 bg-secondary">
                {item.url && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>리소스 {index + 1}</span>
                    {item.duration && <span>({item.duration}초)</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className={`${baseClasses} ${className}`}>
          <p className="text-destructive">지원하지 않는 콘텐츠 타입입니다.</p>
        </div>
      );
  }
};
