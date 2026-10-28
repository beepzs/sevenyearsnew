export interface BrandColors {
  navy: string;
  mint: string;
  cream: string;
  peach: string;
  butter: string;
  lilac: string;
  soft_green: string;
  sky: string;
}

export interface SecuritySettings {
  session_timeout: string;
  two_factor_enabled: boolean;
  last_password_change: string;
  current_user_password_hash: string;
}

export interface OrganizationSettings {
  support_phone: string;
  office_location: string;
  copyright_notice: string;
  social_twitter: string;
  social_instagram: string;
  social_linkedin: string;
}

export interface NotificationSettings {
  recipient_emails: string;
  emergency_sms: string;
  frequency: string;
  sound_alarm: boolean;
  browser_push: boolean;
  email_new_submissions: boolean;
  email_red_flags: boolean;
  email_clinical_reminders: boolean;
  video_updates: boolean;
  security_logins: boolean;
}

export interface PromoBannerSettings {
  enabled: boolean;
  bold_text?: string;
  text?: string;
  link_text?: string;
  link_url?: string;
  bg_color?: string;
  text_color?: string;
  show_close?: boolean;
}

export interface SearchChipItem {
  label: string;
  url: string;
}

export interface WelcomeCardSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  url: string;
  image: string;
}

export interface HeroBannerSettings {
  pill_text: string;
  title: string;
  highlight_text?: string;
  subtitle: string;
  search_prompts?: string[];
  chips?: SearchChipItem[];
  trio_text?: string;
  welcome_card?: WelcomeCardSettings;
}

export interface AdminSettings {
  site_title: string;
  site_tagline: string;
  canonical_domain: string;
  youtube_channel: string;
  contact_email: string;
  medical_disclaimer: string;
  brand_colors: BrandColors;
  security: SecuritySettings;
  organization: OrganizationSettings;
  notifications: NotificationSettings;
  promo_banner?: PromoBannerSettings;
  hero_banner?: HeroBannerSettings;
}


export interface AlertItem {
  id: string;
  type: 'red_flag' | 'submission' | 'clinical' | 'security';
  title: string;
  meta: string;
  time: string;
  unread: boolean;
  actionTab: string;
}

export interface TopicItem {
  slug: string;
  name: string;
  short: string;
  swatch?: string;
  intro: string;
  published: boolean;
  order?: number;
  answers?: string[];
  episodes?: string[];
  experts?: string[];
  main_video?: string;
  main_video_url?: string;
  ages?: number[];
  seo_title?: string;
  meta_desc?: string;
  focus_keyword?: string;
  canonical_url?: string;
  robots_index?: string;
}

export interface AnswerItem {
  slug: string;
  q?: string;
  question?: string;
  quick?: string;
  short_answer?: string;
  body?: string | string[];
  topic: string;
  topics?: string[];
  also?: string[];
  video?: string;
  ages: number[];
  expert?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  reviewed?: string;
  clinical_status?: string;
  published: boolean;
  order?: number;
  tags?: string[];
  seo_title?: string;
  meta_desc?: string;
  focus_keyword?: string;
  schema_type?: string;
  canonical_url?: string;
  robots_index?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
  order: number;
}

export interface VideoItem {
  id: string;
  youtube_id?: string;
  youtube_full_url?: string;
  youtube_short_url?: string;
  title: string;
  type?: 'episode' | 'clip' | 'short';
  kind?: string;
  ep?: number | string;
  duration?: string;
  topic?: string;
  expert?: string;
  guest?: string;
  caption?: string;
  description?: string;
  transcript?: string;
  youtube_disclaimer?: string;
  answers?: string[];
  tags?: string[];
  slug?: string;
  seo_title?: string;
  meta_desc?: string;
  focus_keyword?: string;
  canonical_url?: string;
  robots_index?: string;
  og_image?: string;
  published: boolean;
  views?: number;
  likes?: number;
  published_date?: string;
}

export interface SubmissionItem {
  id: string;
  parent_name: string;
  child_age: string;
  email: string;
  topic: string;
  topics?: string[];
  question: string;
  date: string;
  status: 'New' | 'In Review' | 'Answered' | 'Red Flag Triaged';
  red_flag: boolean;
  notes: string;
}

export interface ExpertItem {
  slug: string;
  name: string;
  role: string;
  img: string | null;
  swatch?: string;
  short: string;
  bio?: string[] | string;
  creds?: string[] | string;
  same?: string[];
  answers?: string[];
  episodes?: string[];
  seo_title?: string;
  meta_desc?: string;
  focus_keyword?: string;
  keywords?: string;
  canonical_url?: string;
  robots_index?: string;
  og_image?: string;
  published: boolean;
}

export interface PageItem {
  id: string;
  title: string;
  slug: string;
  url: string;
  template: string;
  seo_title: string;
  meta_desc: string;
  focus_keyword: string;
  keywords: string;
  canonical_url: string;
  robots_index: string;
  robots_follow: string;
  og_title: string;
  og_type: string;
  og_desc: string;
  og_image: string;
  schema_type: string;
  twitter_card: string;
  excerpt: string;
  body: string;
  updated: string;
  published: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  target?: string;
  order: number;
  published: boolean;
  badge?: string;
  col?: string;
}

export interface MenuStructure {
  header: MenuItem[];
  footer: MenuItem[];
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'editor' | 'clinical_reviewer' | 'author';
  status: string;
  last_active: string;
  permissions: Record<string, 'edit' | 'view' | 'hide'>;
  username?: string;
  password?: string;
}

export interface RoleDef {
  name: string;
  desc: string;
  permissions: string[];
}

export interface BannerItem {
  id: string;
  type: string;
  title?: string | null;
  content?: string | null;
  badge?: string | null;
  highlight?: string | null;
  link_text?: string | null;
  link_url?: string | null;
  bg_color?: string | null;
  text_color?: string | null;
  image?: string | null;
  secondary_text?: string | null;
  data?: any;
  published: boolean;
  order: number;
}

export interface AdminData {
  settings: AdminSettings;
  alerts: AlertItem[];
  topics: TopicItem[];
  answers: Record<string, AnswerItem> | AnswerItem[];
  faqs: FaqItem[];
  videos: Record<string, VideoItem> | VideoItem[];
  experts: Record<string, ExpertItem> | ExpertItem[];
  users: UserItem[];
  roles: Record<string, RoleDef>;
  ask_submissions: SubmissionItem[];
  menus: MenuStructure;
  pages: PageItem[];
  banners?: BannerItem[];
}
