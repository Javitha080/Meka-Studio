import type { SiteSettings } from "@/lib/validation";

/** Starter content — taken from the original Meka Studio HTML. Everything is editable in the CMS. */

export const DEFAULT_SETTINGS: SiteSettings = {
  studioName: "Meka Studio",
  tagline: "Videography & Photography",
  heroHeadline: "We capture the feeling of the room.",
  heroSub:
    "Wedding films, events and brand stories — shot and edited with a cinematic finish by Meka Studio.",
  heroVideoUrl: "https://videos.pexels.com/video-files/2512877/2512877-hd_1920_1080_30fps.mp4",
  heroPosterUrl:
    "https://images.pexels.com/videos/2512877/free-video-2512877.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
  bioQuote: "I don't just record video; I capture the feeling of the room.",
  depositRule: "The 50% Rule: A 50% non-refundable deposit is required to lock in your date.",
  phonePrimary: "0704115474",
  phoneSecondary: "0750475842",
  whatsapp: "94752984125",
  email: "",
  location: "Sri Lanka",
  instagram: "",
  facebook: "",
  youtube: "",
  tiktok: "",
  notifyEmail: "",
  ogImageUrl: "",
  announcement: "",
  seoDescription:
    "Meka Studio — cinematic wedding films, event videography and photography. Book your shoot today.",
};

export interface PackageView {
  id: string;
  name: string;
  description: string;
  price: string;
}
export interface GroupView {
  id: string;
  title: string;
  packages: PackageView[];
}
export interface ServiceView {
  id: string;
  number: string;
  title: string;
  description: string;
  groups: GroupView[];
}

type Seed = [name: string, description: string, price: string];
const g = (title: string, rows: Seed[]) => ({ title, rows });

const SEED_SERVICES: Array<{
  number: string;
  title: string;
  description: string;
  groups: Array<{ title: string; rows: Seed[] }>;
}> = [
  {
    number: "01",
    title: "Videography",
    description: "Films, highlight reels and promos shot and edited with a cinematic finish.",
    groups: [
      g("Weddings", [
        ["Home / Engagement / Pre-shoot", "Includes a 2–3 minute cinematic highlight film.", "LKR 50,000 – 85,000"],
        ["Full Wedding Coverage (Single Day)", "Includes a cinematic trailer (3–5 mins) and a full edited film.", "LKR 150,000 – 250,000"],
        ["Premium Multi-day Package", "2+ cinematographers, drone footage and high-end grading.", "LKR 350,000 – 600,000+"],
      ]),
      g("Events (Corporate & Public)", [
        ["Hourly Rate", "Minimum 2–3 hours.", "LKR 15,000 – 25,000 / hr"],
        ["Half-Day (4 hours)", "", "LKR 65,000 – 90,000"],
        ["Full-Day (8 hours)", "", "LKR 120,000 – 180,000"],
      ]),
      g("Birthdays & Private Parties", [
        ["Standard Birthday Party (3–4 hours)", "Includes a 1–2 minute highlights reel, perfect for Instagram/TikTok.", "LKR 35,000 – 60,000"],
        ["Kids' Birthdays (Short / Casual)", "", "LKR 25,000 – 40,000"],
      ]),
    ],
  },
  {
    number: "02",
    title: "Photography",
    description: "Portraits, events and brand imagery, sharp, natural and timeless.",
    groups: [
      g("Weddings (Candid & Traditional)", [
        ["Engagement / Pre-wedding Shoot", "2–4 hours at 1–2 locations, with 20–30 edited high-res photos.", "LKR 35,000 – 50,000"],
        ["Wedding Day Coverage (Full Day)", "10–12 hours of coverage, a mix of candid and traditional shots, and a high-end digital gallery.", "LKR 75,000 – 120,000"],
      ]),
      g("Birthdays & Private Parties", [
        ["Standard Birthday (2–3 hours)", "Coverage of the decor, guests and cake cutting. 50+ edited photos.", "LKR 15,000 – 25,000"],
        ["Premium / First Birthday", "More decor and family portraits, with a higher level of detail.", "LKR 25,000 – 40,000"],
      ]),
      g("Corporate & Public Events", [
        ["Hourly Rate", "Minimum 2 hours.", "LKR 6,000 – 10,000 / hr"],
        ["Full Day (Corporate Conference)", "", "LKR 50,000 – 75,000"],
      ]),
    ],
  },
  {
    number: "03",
    title: "Photo + Video",
    description: "One studio for both, so your story looks and feels consistent.",
    groups: [
      g("Photo + Video Bundles", [
        ["Event Bundle", "Photo + 1 Cinematic Reel (Vertical)", "LKR 45,000 – 60,000"],
        ["Wedding Bundle", "Full Photography + Cinematic Film", "LKR 180,000 – 275,000"],
        ["Pre-Shoot Bundle", "Photos + 2-min Save the Date Video", "LKR 65,000 – 85,000"],
      ]),
    ],
  },
];

export const SEED_SERVICE_DATA = SEED_SERVICES;

export const DEFAULT_SERVICES: ServiceView[] = SEED_SERVICES.map((s, si) => ({
  id: `svc-${si}`,
  number: s.number,
  title: s.title,
  description: s.description,
  groups: s.groups.map((grp, gi) => ({
    id: `svc-${si}-g${gi}`,
    title: grp.title,
    packages: grp.rows.map(([name, description, price], pi) => ({
      id: `svc-${si}-g${gi}-p${pi}`,
      name,
      description,
      price,
    })),
  })),
}));

export interface ProjectView {
  id: string;
  slug: string;
  title: string;
  category: string;
  client: string;
  year: number | null;
  description: string;
  previewVideoUrl: string;
  posterUrl: string;
  fullVideoUrl: string;
  gallery: string[];
  featured: boolean;
}

const px = (id: number, file: string, thumb?: string) => ({
  video: `https://videos.pexels.com/video-files/${id}/${file}`,
  poster: thumb ?? `https://images.pexels.com/videos/${id}/free-video-${id}.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200`,
});

const SAMPLE = "Sample footage — replace with your own film in the CMS.";
const year = new Date().getFullYear();

export const SEED_PROJECTS: Omit<ProjectView, "id">[] = [
  {
    slug: "wedding-highlights",
    title: "Wedding Highlights",
    category: "Wedding",
    client: "Private client",
    year,
    description: `A cinematic highlight film that keeps every glance, laugh and tear. ${SAMPLE}`,
    previewVideoUrl: px(40475292, "17296462_1920_1080_60fps.mp4").video,
    posterUrl: "https://images.pexels.com/videos/40475292/4k-wedding-video-asian-wedding-bangladesh-bangladeshi-wedding-40475292.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    fullVideoUrl: "",
    gallery: [],
    featured: true,
  },
  {
    slug: "the-first-kiss",
    title: "The First Kiss",
    category: "Wedding",
    client: "Private client",
    year,
    description: `Quiet, intimate moments from the wedding day. ${SAMPLE}`,
    previewVideoUrl: px(12597486, "12597486-hd_1920_1080_25fps.mp4").video,
    posterUrl: "https://images.pexels.com/videos/12597486/indian-indian-wedding-kiss-12597486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    fullVideoUrl: "",
    gallery: [],
    featured: false,
  },
  {
    slug: "pre-shoot-story",
    title: "Pre-Shoot Story",
    category: "Pre-shoot",
    client: "Private client",
    year,
    description: `A save-the-date story shot on the move. ${SAMPLE}`,
    previewVideoUrl: px(40475139, "17296537_1920_1080_60fps.mp4").video,
    posterUrl: "https://images.pexels.com/videos/40475139/4k-wedding-video-asian-wedding-bangladesh-bangladeshi-wedding-40475139.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    fullVideoUrl: "",
    gallery: [],
    featured: false,
  },
  {
    slug: "event-coverage",
    title: "Event Coverage",
    category: "Event",
    client: "Corporate client",
    year,
    description: `Handheld, fast and unobtrusive coverage for public and corporate events. ${SAMPLE}`,
    previewVideoUrl: px(1996374, "1996374-hd_1920_1080_24fps.mp4").video,
    posterUrl: px(1996374, "").poster,
    fullVideoUrl: "",
    gallery: [],
    featured: false,
  },
  {
    slug: "stabilised-motion",
    title: "Stabilised Motion",
    category: "Commercial",
    client: "Brand promo",
    year,
    description: `Gimbal-smooth promo footage for brands and launches. ${SAMPLE}`,
    previewVideoUrl: px(33940099, "14403993_1920_1080_25fps.mp4").video,
    posterUrl: "https://images.pexels.com/videos/33940099/pexels-photo-33940099.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    fullVideoUrl: "",
    gallery: [],
    featured: false,
  },
  {
    slug: "studio-sessions",
    title: "Studio Sessions",
    category: "Commercial",
    client: "In-studio",
    year,
    description: `Controlled light, clean sound and a polished finish. ${SAMPLE}`,
    previewVideoUrl: px(36604690, "15520309_1920_1080_25fps.mp4").video,
    posterUrl: "https://images.pexels.com/videos/36604690/pexels-photo-36604690.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    fullVideoUrl: "",
    gallery: [],
    featured: false,
  },
];

export const DEFAULT_PROJECTS: ProjectView[] = SEED_PROJECTS.map((p, i) => ({ id: `proj-${i}`, ...p }));

export interface TestimonialView {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export interface FaqView {
  id: string;
  question: string;
  answer: string;
}

export const SEED_FAQS: Array<Omit<FaqView, "id">> = [
  {
    question: "How do I lock in my date?",
    answer: "A 50% non-refundable deposit secures your date. The balance is due on or before the shoot day.",
  },
  {
    question: "How long until I receive my film or photos?",
    answer: "Highlight films are typically delivered within 3–5 weeks, full wedding films within 6–8 weeks. Photo galleries usually take 2–3 weeks. Rush delivery is available on request.",
  },
  {
    question: "Do you travel outside your base city?",
    answer: "Yes — we shoot across the island and abroad. Travel and accommodation are quoted transparently with your package.",
  },
  {
    question: "Can I choose between video, photography or both?",
    answer: "Absolutely. Pick Videography, Photography, or a combined Photo + Video package when you book and we will tailor the crew and timeline.",
  },
  {
    question: "Do you use drones?",
    answer: "Drone footage is included in our Premium packages and can be added to others, subject to venue permission and local regulations.",
  },
  {
    question: "How quickly do you reply to enquiries?",
    answer: "Usually the same day. You will receive an automatic confirmation e-mail as soon as you submit the booking form.",
  },
];

export const DEFAULT_FAQS: FaqView[] = SEED_FAQS.map((f, i) => ({ id: `faq-${i}`, ...f }));
