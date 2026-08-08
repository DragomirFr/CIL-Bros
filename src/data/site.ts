import heroImg from "@/assets/power-floating-real.jpg";
import groundworksFoundation from "@/assets/groundworks-foundation.jpg";
import concreteFlooringFinish from "@/assets/concrete-flooring-finish.jpg";
import powerFloatingReal from "@/assets/power-floating-real.jpg";
import siteGroundworksPhoto from "@/assets/att.pnB22cdPkFWaczbE7-26nvDTp0iMMtBO6LQ1uT4n1jI.jpg";
import siteVideoOne from "@/assets/att.jNpxFusAELkZNrHRMU08eq3HRpS-Q7o6iepe6w22RqQ.mp4";
import siteVideoTwo from "@/assets/att.doOE4iqsHqd8oW9d_aNhkSc_QMRrGy17CSICuoL2Zjo.mp4";
import siteVideoThree from "@/assets/att.7rfcVRnlu6lLY5zuMUUGBOszDFhCbdrznVKPihPvM-4.mp4";
import siteVideoFour from "@/assets/att.U8PF3uejMWXDX61lmjwLsFGPnekzeCkl8YNpfwb-0jw.mp4";
import siteVideoFive from "@/assets/att.-Uer7IrDT4p-ytbJ6VpgKBnB4_iUzyb1qLyKyy5N7rE.mp4";
import beams from "@/assets/beams.jpg";
import insulation from "@/assets/insulation.jpg";
import powerfloating from "@/assets/power-floating.png";

export const COMPANY = "CIL Bros Construction";
export const PHONE = "07510 585001";
export const PHONE_HREF = "tel:+447510585001";
/** E.164 form. Google wants the country code for a local business listing. */
export const PHONE_E164 = "+44 7510 585001";
export const EMAIL = "contact@cilbrosconstruction.com";
export const BASE_LOCATION = "Northampton, Northamptonshire";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61589360498625";

export const images = { heroImg };

/**
 * A photo or video in the gallery.
 *
 * To add one: import the file at the top of this file and drop an entry in
 * `galleryItems` below. Videos are detected from the file extension, so there
 * is nothing else to configure.
 */
export interface GalleryItem {
  /** Imported image, or a path under `public/` for video. */
  src: string;
  /** Describes the item for screen readers and search engines. Keep it short. */
  alt: string;
  /** Optional line shown under the item when opened. */
  caption?: string;
  /** Videos only: still frame shown before playback. */
  poster?: string;
}

/** Matches the video file types the gallery knows how to play. */
export const VIDEO_FILE = /\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i;

export function isVideo(src: string) {
  return VIDEO_FILE.test(src);
}

export const galleryItems: GalleryItem[] = [
  {
    src: siteGroundworksPhoto,
    alt: "Groundworks slab and foundation works on site",
    caption: "Groundworks on site - Northamptonshire",
  },
  {
    src: groundworksFoundation,
    alt: "Fresh concrete foundation with blockwork and site preparation",
    caption: "Groundworks and foundations - Northamptonshire",
  },
  {
    src: siteVideoOne,
    alt: "Construction site video",
    caption: "Site video 1",
  },
  {
    src: siteVideoTwo,
    alt: "Construction site video",
    caption: "Site video 2",
  },
  {
    src: siteVideoThree,
    alt: "Construction site video",
    caption: "Site video 3",
  },
  {
    src: siteVideoFour,
    alt: "Construction site video",
    caption: "Site video 4",
  },
  {
    src: siteVideoFive,
    alt: "Construction site video",
    caption: "Site video 5",
  },
  {
    src: powerFloatingReal,
    alt: "Concrete slab being power floated on a construction site",
    caption: "Northamptonshire",
  },
  {
    src: concreteFlooringFinish,
    alt: "Finished concrete floor with a smooth, even surface",
    caption: "Concrete flooring - Northamptonshire",
  },
];

export interface SiteVideo {
  title: string;
  src?: string;
}

export const siteVideos: SiteVideo[] = [
  { title: "Site video 1", src: siteVideoOne },
  { title: "Site video 2", src: siteVideoTwo },
  { title: "Site video 3", src: siteVideoThree },
  { title: "Site video 4", src: siteVideoFour },
  { title: "Site video 5", src: siteVideoFive },
];

export interface Service {
  n: string;
  slug: string;
  title: string;
  text: string;
  image?: string;
}

export const services: Service[] = [
  {
    n: "01",
    slug: "blocks",
    title: "Blocks",
    text: "Infill blocks laid between the beams to form a solid, level floor, set cleanly and to specification.",
    image: groundworksFoundation,
  },
  {
    n: "02",
    slug: "beams",
    title: "Beams",
    text: "Beams supplied, set and levelled to specification for solid structural support.",
    image: beams,
  },
  {
    n: "03",
    slug: "insulation",
    title: "Insulation",
    text: "Practical insulation solutions fitted to help improve comfort, efficiency and compliance.",
    image: insulation,
  },
  {
    n: "04",
    slug: "concrete-flooring",
    title: "Concrete Flooring",
    text: "Level, durable concrete floors prepared, poured and finished for homes and commercial spaces.",
    image: concreteFlooringFinish,
  },
  {
    n: "05",
    slug: "power-floating",
    title: "Power Floating",
    text: "Machine-finished concrete surfaces for a smooth, hard-wearing result built to last.",
    image: powerfloating,
  },
];

export interface Area {
  slug: string;
  name: string;
  blurb: string;
  detail: string;
  nearby: string[];
}

export const areas: Area[] = [
  {
    slug: "northampton",
    name: "Northampton",
    blurb: "Our home patch — extensions, renovations and groundworks across the town.",
    detail:
      "Northampton is where we are based, so we are on site quickly and can pop back for snags without fuss. We work on Victorian terraces in Abington and Kingsthorpe, 1930s semis in Duston, and newer builds out towards Upton and Hardingstone.",
    nearby: ["Abington", "Kingsthorpe", "Duston", "Upton", "Hardingstone"],
  },
  {
    slug: "wellingborough",
    name: "Wellingborough",
    blurb: "Rear extensions, loft conversions and full refurbishments in Wellingborough.",
    detail:
      "Fifteen minutes from our yard, Wellingborough is a regular stop for us. Plenty of stone and brick properties here that need sympathetic work, plus modern estates where we handle extensions, driveways and garden rooms.",
    nearby: ["Finedon", "Irchester", "Earls Barton", "Great Doddington"],
  },
  {
    slug: "kettering",
    name: "Kettering",
    blurb: "Groundworks, brickwork and kitchen and bathroom fit-outs around Kettering.",
    detail:
      "We take on both domestic and small commercial work in Kettering — foundations and drainage for new builds, structural openings, and full internal refurbishments finished to a high standard.",
    nearby: ["Burton Latimer", "Barton Seagrave", "Desborough", "Rothwell"],
  },
  {
    slug: "daventry",
    name: "Daventry",
    blurb: "Extensions, garages and hard landscaping in Daventry and the villages.",
    detail:
      "Daventry and the surrounding villages have a lot of stone and rural properties. We handle extensions, garage conversions, driveways and patios, with careful attention to matching existing materials.",
    nearby: ["Long Buckby", "Weedon", "Braunston", "Badby"],
  },
  {
    slug: "towcester",
    name: "Towcester",
    blurb: "Period property renovation and quality brickwork in Towcester.",
    detail:
      "Towcester work is often period property: repointing, structural repairs, sympathetic extensions and full renovations. We take our time getting the details right and keep the site tidy throughout.",
    nearby: ["Silverstone", "Blakesley", "Roade", "Greens Norton"],
  },
  {
    slug: "milton-keynes",
    name: "Milton Keynes",
    blurb: "Extensions, groundworks and refurbishments across Milton Keynes.",
    detail:
      "We travel out to Milton Keynes for larger extensions, groundworks packages and full house refurbishments. Straight pricing, clear programme dates and a tidy site every day.",
    nearby: ["Newport Pagnell", "Olney", "Stony Stratford", "Wolverton"],
  },
];
