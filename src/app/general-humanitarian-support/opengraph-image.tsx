import { renderBrandOgImage } from '@/lib/brandOgImage';
import { OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE } from '@/lib/seo';
import { SOCIAL_CARDS } from '@/lib/socialCards';

export const alt = SOCIAL_CARDS.humanitarian.alt;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function OpengraphImage() {
  return renderBrandOgImage('humanitarian');
}
