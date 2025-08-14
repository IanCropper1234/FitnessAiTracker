/**
 * Utility functions for Special Training Methods
 * Provides consistent styling and labeling across the application
 */

export interface SpecialMethodStyle {
  label: string;
  colorClass: string;
}

/**
 * Get the display style for a special training method
 */
export function getSpecialMethodStyle(method: string | null | undefined): SpecialMethodStyle {
  if (!method || method === 'null') {
    return {
      label: 'Standard',
      colorClass: 'bg-gray-500 text-white'
    };
  }

  switch (method.toLowerCase()) {
    case 'myorep_match':
      return {
        label: 'MyoRep Match',
        colorClass: 'bg-purple-600 text-white'
      };
    case 'myorep_no_match':
      return {
        label: 'MyoRep No Match', 
        colorClass: 'bg-purple-500 text-white'
      };
    case 'drop_set':
    case 'dropset':
      return {
        label: 'Drop Set',
        colorClass: 'bg-orange-600 text-white'
      };
    case 'giant_set':
      return {
        label: 'Giant Set',
        colorClass: 'bg-red-600 text-white'
      };
    case 'rest_pause':
      return {
        label: 'Rest Pause',
        colorClass: 'bg-blue-600 text-white'
      };
    case 'lengthened_partials':
      return {
        label: 'Lengthened Partials',
        colorClass: 'bg-green-600 text-white'
      };
    case 'superset':
      return {
        label: 'Superset',
        colorClass: 'bg-indigo-600 text-white'
      };
    case 'cluster_set':
      return {
        label: 'Cluster Set',
        colorClass: 'bg-teal-600 text-white'
      };
    case 'tempo':
      return {
        label: 'Tempo',
        colorClass: 'bg-pink-600 text-white'
      };
    default:
      return {
        label: method,
        colorClass: 'bg-gray-600 text-white'
      };
  }
}

/**
 * Get the CSS classes for a special method badge
 */
export function getSpecialMethodBadgeClasses(method: string | null | undefined, additionalClass = ""): string {
  const { colorClass } = getSpecialMethodStyle(method);
  return `px-2 py-0.5 text-xs font-medium rounded-sm ${colorClass} ${additionalClass}`;
}

/**
 * Get the display label for a special method
 */
export function getSpecialMethodLabel(method: string | null | undefined): string {
  const { label } = getSpecialMethodStyle(method);
  return label;
}