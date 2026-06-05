// @ts-nocheck
import { createClient } from "@/lib/datasource/supabase/client";
import {
  cropAndConvertToWebp,
  type CropArea,
} from "@/lib/utils/image-crop";

export async function uploadProfilePicture(
  imageSrc: string,
  crop: CropArea,
  organizationId: string,
  orgUserId: string
): Promise<string> {
  const blob = await cropAndConvertToWebp(imageSrc, crop);

  const supabase = createClient();
  const filePath = `${organizationId}/${orgUserId}/${orgUserId}_profile_pic.webp`;

  const { error: uploadError } = await supabase.storage
    .from("user-media")
    .upload(filePath, blob, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage
    .from("user-media")
    .getPublicUrl(filePath);

  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("app_organization_users")
    .update({ profile_picture_url: publicUrl })
    .eq("id", orgUserId);

  if (updateError) throw new Error(updateError.message);

  return publicUrl;
}
