/**
 * Workflow Navigation Components
 *
 * This module exports all workflow navigation-related components:
 * - WorkflowNavigation: Main navigation component with back/next buttons
 * - WorkflowBreadcrumbs: Breadcrumb trail showing current location
 * - WorkflowHints: Contextual hints for each workflow step
 */

export { WorkflowNavigation } from "../WorkflowNavigation";
export type { WorkflowNavigationProps } from "../WorkflowNavigation";

export { WorkflowBreadcrumbs } from "../WorkflowBreadcrumbs";
export type { WorkflowBreadcrumbsProps } from "../WorkflowBreadcrumbs";

export { WorkflowHints, useResetHints } from "../WorkflowHints";
export type { WorkflowHintsProps } from "../WorkflowHints";

export {
  useNavigationGuard,
  canNavigateToStep,
} from "../../hooks/use-navigation-guard";
