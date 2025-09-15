export type Changelog = {
  type: ChangelogType;
  description: string;
  prNumber: string;
  author: string;
};

export enum ChangelogType {
  Added,
  Changed,
  Fixed,
  Removed,
  Security,
}
