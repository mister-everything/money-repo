export enum Role {
  USER = "user",
  ADMIN = "admin",
}

export type Owner = {
  // id: string; 사용자 아이디는 보안상 노출하지 않음
  name: string;
  profile?: string;
};
