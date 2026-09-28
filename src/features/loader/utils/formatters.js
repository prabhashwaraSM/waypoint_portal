export const BRAND_SHORT = {
  "Waypoint Fresh": "Fresh",
  "Waypoint Style": "Style",
  "Waypoint Tech": "Tech"
};

export function statusClass(status) {
  return String(status).toLowerCase().replaceAll(" ", "-");
}
