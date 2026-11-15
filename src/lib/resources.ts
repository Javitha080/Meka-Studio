import type { FieldDef } from "@/lib/validation";

/** Declarative CMS resource definitions — drives the admin UI + validation. */

export type ResourceKey = "projects" | "services" | "package_groups" | "packages" | "testimonials" | "faqs";

export interface ResourceDef {
  key: ResourceKey;
  label: string;
  plural: string;
  fields: FieldDef[];
  /** field shown as the row title / secondary text */
  titleField: string;
  subtitleField?: string;
  hasSlug?: boolean;
}

export const PROJECT_CATEGORIES = [
  "Wedding",
  "Pre-shoot",
  "Event",
  "Corporate",
  "Birthday",
  "Commercial",
  "Photography",
];

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  projects: {
    key: "projects",
    label: "Project",
    plural: "Portfolio",
    titleField: "title",
    subtitleField: "category",
    hasSlug: true,
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", help: "Leave blank to generate from the title." },
      { name: "category", label: "Category", type: "select", options: PROJECT_CATEGORIES },
      { name: "client", label: "Client", type: "text" },
      { name: "year", label: "Year", type: "number", nullable: true },
      { name: "description", label: "Description", type: "textarea", wide: true },
      {
        name: "previewVideoUrl",
        label: "Preview loop (MP4)",
        type: "media",
        accept: "video",
        help: "Short (3–8 s), muted, under ~4 MB. Plays on hover and in view.",
        wide: true,
      },
      { name: "posterUrl", label: "Poster image", type: "media", accept: "image", help: "Shown instantly before the video loads.", wide: true },
      {
        name: "fullVideoUrl",
        label: "Full film URL",
        type: "media",
        accept: "video",
        help: "YouTube, Vimeo or a direct MP4 link.",
        wide: true,
      },
      {
        name: "gallery",
        label: "Gallery (photos & clips)",
        type: "gallery",
        help: "Upload several images or videos — they appear as a bento gallery on the project page.",
        wide: true,
      },
      { name: "sortOrder", label: "Order", type: "number" },
      { name: "featured", label: "Featured (large tile)", type: "checkbox" },
      { name: "published", label: "Published", type: "checkbox" },
    ],
  },
  services: {
    key: "services",
    label: "Service",
    plural: "Services",
    titleField: "title",
    subtitleField: "number",
    fields: [
      { name: "number", label: "Number", type: "text", max: 8 },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "sortOrder", label: "Order", type: "number" },
      { name: "published", label: "Published", type: "checkbox" },
    ],
  },
  package_groups: {
    key: "package_groups",
    label: "Package group",
    plural: "Package groups",
    titleField: "title",
    fields: [
      { name: "serviceId", label: "Service", type: "select", optionsFrom: "services" },
      { name: "title", label: "Group title", type: "text", required: true },
      { name: "sortOrder", label: "Order", type: "number" },
    ],
  },
  packages: {
    key: "packages",
    label: "Package",
    plural: "Packages & prices",
    titleField: "name",
    subtitleField: "price",
    fields: [
      { name: "groupId", label: "Group", type: "select", optionsFrom: "package_groups" },
      { name: "name", label: "Package name", type: "text", required: true },
      { name: "price", label: "Price label", type: "text", help: "e.g. LKR 50,000 – 85,000" },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "sortOrder", label: "Order", type: "number" },
    ],
  },
  testimonials: {
    key: "testimonials",
    label: "Testimonial",
    plural: "Testimonials",
    titleField: "name",
    subtitleField: "role",
    fields: [
      { name: "name", label: "Client name", type: "text", required: true },
      { name: "role", label: "Role / event", type: "text" },
      { name: "quote", label: "Quote", type: "textarea", required: true, wide: true },
      { name: "sortOrder", label: "Order", type: "number" },
      { name: "published", label: "Published", type: "checkbox" },
    ],
  },
  faqs: {
    key: "faqs",
    label: "FAQ",
    plural: "FAQ",
    titleField: "question",
    fields: [
      { name: "question", label: "Question", type: "text", required: true, max: 300 },
      { name: "answer", label: "Answer", type: "textarea", required: true, wide: true },
      { name: "sortOrder", label: "Order", type: "number" },
      { name: "published", label: "Published", type: "checkbox" },
    ],
  },
};
