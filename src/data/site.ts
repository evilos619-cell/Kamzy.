export interface Category {
  id: number;
  name: string;
  slug: string;
}

export const categories: Category[] = [
  { id: 1, name: "TikTok", slug: "tiktok" },
  { id: 2, name: "Facebook", slug: "facebook" },
  { id: 3, name: "Instagram", slug: "instagram" },
  { id: 4, name: "Telegram", slug: "telegram" },
  { id: 5, name: "YouTube", slug: "youtube" },
  { id: 6, name: "Twitter / X", slug: "twitter-x" },
  { id: 7, name: "LinkedIn", slug: "linkedin" },
];

export const navLinks = [
  { name: "Home", to: "/" as const },
  { name: "About", to: "/about" as const },
  { name: "Products", to: "/products" as const },
  { name: "Blog", to: "/blog" as const },
  { name: "Contact", to: "/contact" as const },
];

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  avatar: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "John D.",
    role: "Social Media Manager",
    content:
      "Kamzybot's Media made it incredibly easy for us to enhance our social media presence. Their digital solutions and creative services truly transformed our brand visibility. Professional, reliable, and always available to support us.",
    avatar: "/images/avatar-1.jpg",
  },
  {
    id: 2,
    name: "Emily S.",
    role: "Entrepreneur",
    content:
      "As a startup, managing social media growth was overwhelming. Kamzybot's Media provided exactly what we needed. Their services are tailored, transparent, and deliver real results with authentic engagement.",
    avatar: "/images/avatar-2.jpg",
  },
  {
    id: 3,
    name: "Alex R.",
    role: "Influencer",
    content:
      "I needed expert digital solutions for my social media strategy, and Kamzybot's Media exceeded expectations. Their creative services and growth strategies are top-notch. Highly recommended for serious content creators.",
    avatar: "/images/avatar-3.jpg",
  },
];

export interface Blog {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  slug: string;
}

export const blogs: Blog[] = [
  {
    id: 1,
    title: "But why do people buy social media accounts?",
    excerpt:
      "Instant credibility: purchasing a social media account with an established following instantly boosts your authority and saves months of slow organic growth.",
    date: "06 Sep, 2023",
    image: "/images/blog-1.jpg",
    slug: "but-why-do-people-buy-social-media-accounts",
  },
];

export const contactInfo = {
  email: "contact@kamzybotsmedia.com",
  phone: "+234 815 969 6814",
  phoneRaw: "+2348159696814",
  whatsappSupport: "https://wa.me/2348159696814",
  whatsappGroup: "https://chat.whatsapp.com/EvXxgtIsxPiDsEGFQcMP9v",
  telegramSupport: "https://t.me/Kamzybotsmedia",
  telegramChannel: "https://t.me/kamzybotsmedia01",
  location: "Nigeria",
};

export const ADMIN_OWNER_EMAIL = "contact@kamzybotsmedia.com";
