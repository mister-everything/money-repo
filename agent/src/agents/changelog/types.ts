export type Changelog = {
  type: ChangelogType;
  contents: {
    description: string;
    commitNumber: string;
    author: string;
  }[];
};

export enum ChangelogType {
  Added = "Added",
  Changed = "Changed",
  Fixed = "Fixed",
  Removed = "Removed",
  Security = "Security",
}
