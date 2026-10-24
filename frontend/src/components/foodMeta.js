// Display metadata for enum values shared by forms, listings and the dashboard.
export const FOOD_TYPES = [
  { value: "rice", label: "Rice & grains", icon: "fa-bowl-rice" },
  { value: "vegetables", label: "Vegetables", icon: "fa-carrot" },
  { value: "fruits", label: "Fruits", icon: "fa-apple-whole" },
  { value: "bread", label: "Bread & bakery", icon: "fa-bread-slice" },
  { value: "other", label: "Other / cooked", icon: "fa-box-open" },
];

export const DIET_TYPES = [
  { value: "veg", label: "Vegetarian", icon: "fa-leaf" },
  { value: "vegan", label: "Vegan", icon: "fa-seedling" },
  { value: "nonveg", label: "Non-veg", icon: "fa-drumstick-bite" },
];

export const VOLUNTEER_INTERESTS = [
  { value: "pickup", label: "Food pickup", icon: "fa-truck-pickup" },
  { value: "delivery", label: "Delivery", icon: "fa-person-biking" },
  { value: "sorting", label: "Sorting & packing", icon: "fa-boxes-stacked" },
  { value: "events", label: "Drives & events", icon: "fa-calendar-check" },
  { value: "outreach", label: "Community outreach", icon: "fa-bullhorn" },
];

export const AVAILABILITY = [
  { value: "weekdays", label: "Weekdays", icon: "fa-briefcase" },
  { value: "weekends", label: "Weekends", icon: "fa-sun" },
  { value: "flexible", label: "Flexible", icon: "fa-shuffle" },
];

const find = (list, value) => list.find((x) => x.value === value);
export const foodMeta = (v) => find(FOOD_TYPES, v) || { value: v, label: v || "Food", icon: "fa-box-open" };
export const dietMeta = (v) => find(DIET_TYPES, v);

// "in 3 days", "today", "tomorrow" for listing expiry.
export const relativeDay = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(d) - startOf(new Date())) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
};

// YYYY-MM-DD in local time, for <input type="date"> min/max.
export const isoDay = (offsetDays = 0) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
