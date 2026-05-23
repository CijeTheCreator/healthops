import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getClassificationColor = (classification: string) => {
  switch (classification) {
    case "TOP SECRET":
      return "bg-red-500/20 text-red-500";
    case "SECRET":
      return "bg-orange-500/20 text-orange-500";
    case "CONFIDENTIAL":
      return "bg-neutral-500/20 text-neutral-300";
    default:
      return "bg-white/20 text-white";
  }
};

export const SAMPLE_REPORT = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur id venenatis elit, ac efficitur sapien. Suspendisse accumsan, erat luctus egestas volutpat, arcu arcu semper nisi, nec laoreet sem sem at metus. Aliquam eu mi pharetra, iaculis ligula at, hendrerit tortor. Duis ornare suscipit est vitae consectetur. Nam id mollis sapien. Nunc vel ipsum eleifend leo semper congue. Nunc finibus eget lectus sit amet sollicitudin. Ut lacus tortor, ultrices sit amet vehicula sed, vestibulum vitae dui. Nullam orci tellus, accumsan in enim vitae, tempus scelerisque nulla. Ut sed est sed arcu iaculis facilisis vel at tortor. Aenean tempor, quam eu egestas molestie, sapien lorem consectetur nisi, ut commodo justo justo nec risus.

Sed pharetra, elit sit amet vulputate maximus, sapien massa finibus sapien, in egestas odio ligula vel libero. Integer ac tellus risus. Proin euismod scelerisque eros a sollicitudin. Vivamus sit amet pretium massa, eget interdum lectus. Maecenas ornare nibh lacus, eu hendrerit mauris congue ac. Duis porta consectetur massa sed lobortis. Sed quis aliquam mauris. Morbi vulputate elit sit amet vehicula finibus. Quisque placerat, ipsum sit amet ornare lacinia, odio risus interdum urna, in tristique felis quam non odio. Quisque eget vehicula dolor. Fusce semper ligula lectus, condimentum sodales neque aliquet quis. Aliquam metus mauris, tristique vel hendrerit nec, pellentesque a ante.

Etiam quis porta nisl, eu tincidunt nunc. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Fusce finibus ligula ac est hendrerit elementum. Duis vestibulum aliquet tortor id venenatis. Nulla faucibus aliquet eros ut congue. Quisque elementum accumsan nulla ut porta. Nullam dui lacus, pellentesque ac tristique facilisis, mattis in mi. Cras metus purus, vulputate eget erat in, sodales vehicula ligula. Maecenas et leo nisi. Fusce semper ex nec nisl tincidunt tincidunt.

Cras porttitor leo vel est aliquam, non auctor diam tristique. Fusce eu imperdiet nunc, et consequat lectus. Aliquam erat volutpat. Cras auctor tellus a felis blandit, non hendrerit dui semper. Quisque commodo arcu sed odio suscipit euismod. Vivamus non felis neque. Sed eget nisi quam. Aliquam sed diam non odio rhoncus sodales facilisis et quam. Proin arcu massa, pretium ut aliquet et, facilisis in erat. Morbi non neque lorem. Sed sed est non sapien commodo condimentum. Pellentesque pretium sem sed feugiat posuere. Ut sollicitudin ligula justo, sit amet pretium arcu varius sed. Pellentesque at velit nulla. Proin aliquet tempor purus, convallis eleifend turpis dignissim quis. Proin dictum ultrices posuere.

Etiam consectetur ornare diam non interdum. Cras accumsan augue vehicula, tempor lectus et, venenatis diam. Vivamus euismod libero quam, at rutrum tellus tristique eu. Quisque scelerisque elit non augue faucibus facilisis. Morbi tristique arcu ligula, vel hendrerit tellus eleifend vitae. Nunc nec lacus vel lacus interdum mattis. Maecenas eu blandit mauris. Pellentesque accumsan non turpis placerat molestie. Phasellus pellentesque tortor eu elit tincidunt auctor.`;

export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
