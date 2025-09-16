import { openai } from "@ai-sdk/openai";
import { createAgent } from "../create-agent";
import { addCommitTool } from "./tools/add-commit";
import { getCommitLogTool } from "./tools/get-commit-log";
import { gitDiffTool } from "./tools/git-diff";
import { saveChangelogTool } from "./tools/save-changelog";
import { searchChangelogTool } from "./tools/search-changelog";

/**
 * @description CHANGE_LOG 에이전트
 * CHANGE_LOG 파일을 관리하는 에이전트입니다.
 *
 * @tools
 * - getCommitLog: 현재 브랜치와 main 브랜치의 차이점을 확인하고 커밋 로그를 반환합니다.
 * - saveChangelog: CHANGELOG.md 파일에 일관된 형식으로 주요 변경 사항을 기록하고 업데이트합니다.
 * - searchChangelog: CHANGELOG.md 파일을 조회합니다.
 * - addCommit: 변경 사항을 커밋합니다.
 */
export const changelogAgent = createAgent({
  model: openai("gpt-4.1"),
  name: "CHANGE_LOG",
  systemPrompt: `
    당신은 CHANGE_LOG 관리 에이전트입니다. 다음의 작업을 수행합니다:

    - Git 명령어를 실행하여 현재 브랜치와 main 브랜치의 차이점을 확인하고 변경 내역을 가져옵니다.
    - 변경된 파일들의 내용을 분석하여 주요 변경 사항(기능 추가, 수정, 버그 수정 등)을 파악합니다.
    - CHANGELOG 파일에 일관된 형식으로 주요 변경 사항을 기록하고 업데이트합니다.
    - 업데이트된 CHANGELOG 파일을 커밋합니다.
    - 사용자의 답변이 필요한 경우 사용자에게 답변을 요청합니다.

    주의사항:
    - 변경 사항 분석 시 실제 코드 변경 내용과 커밋 메시지를 함께 이용합니다.
    - 명확하지 않은 변경 사항은 '확실하지 않음'으로 표기하거나 별도로 표시할 수 있습니다.
    - git 명령어 실행 시 결과가 없거나 오류가 발생하면 적절한 안내 메시지를 제공합니다.
    - commit-number는 앞 5자리 숫자로 작성합니다.
    - 버전은 주요 버전 번호만 작성합니다. (ex: 1.0.0)
    
    CHANGELOG.md TEMPLATE
    ## [{version}] - {date}
    ### {type}
    - {description} ({#commit-number}) (by {author})
    `.trim(),
  tools: {
    getCommitLog: getCommitLogTool,
    saveChangelog: saveChangelogTool,
    searchChangelog: searchChangelogTool,
    addCommit: addCommitTool,
    gitDiff: gitDiffTool,
  },
});
