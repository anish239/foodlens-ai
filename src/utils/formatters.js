export const formatScoreCategory = (score) => {
  if (score >= 85) return { label: "Excellent", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (score >= 70) return { label: "Good", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (score >= 50) return { label: "Moderate", color: "text-amber-600 bg-amber-50 border-amber-200" };
  if (score >= 30) return { label: "Poor", color: "text-orange-600 bg-orange-50 border-orange-200" };
  return { label: "Avoid Frequently", color: "text-red-600 bg-red-50 border-red-200" };
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};
