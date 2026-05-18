export type DashboardProfile = {
  username: string;
  displayName: string;
  bio: string;
  image: string | null;
};

export type DashboardLink = {
  id: string;
  title: string;
  url: string;
  icon: string;
  clickCount: number;
};
