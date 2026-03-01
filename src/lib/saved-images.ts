const STORAGE_KEY = "myangel_saved_images";

export interface SavedImage {
  id: string;
  prompt: string;
  style: string | null;
  image: string; // base64 data URI
  style_tags: string[];
  created_at: string;
}

export function getSavedImages(): SavedImage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedImage[];
  } catch {
    return [];
  }
}

export function saveImage(data: Omit<SavedImage, "id" | "created_at">): SavedImage {
  const images = getSavedImages();
  const newImage: SavedImage = {
    ...data,
    id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
  };
  images.unshift(newImage);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  return newImage;
}

export function deleteImage(id: string): void {
  const images = getSavedImages();
  const filtered = images.filter((img) => img.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
