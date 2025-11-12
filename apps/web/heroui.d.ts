// Type declarations for HeroUI v3 Alpha
// These extend the incomplete type definitions in the alpha release

declare module "@heroui/react" {
  import { ComponentProps, ReactNode } from "react";

  // Card compound component types
  export interface CardComponent {
    (props: CardProps): JSX.Element;
    Header: (props: {
      className?: string;
      children?: ReactNode;
    }) => JSX.Element;
    Title: (props: { className?: string; children?: ReactNode }) => JSX.Element;
    Description: (props: {
      className?: string;
      children?: ReactNode;
    }) => JSX.Element;
    Content: (props: {
      className?: string;
      children?: ReactNode;
    }) => JSX.Element;
    Footer: (props: {
      className?: string;
      children?: ReactNode;
    }) => JSX.Element;
  }

  export interface CardProps {
    className?: string;
    children?: ReactNode;
    variant?:
      | "transparent"
      | "default"
      | "secondary"
      | "tertiary"
      | "quaternary";
  }

  export const Card: CardComponent;

  // Chip extended color types
  export interface ChipProps {
    className?: string;
    children?: ReactNode;
    color?: "default" | "accent" | "success" | "warning" | "danger";
    variant?: "primary" | "secondary" | "tertiary" | "soft";
    size?: "sm" | "md" | "lg";
  }

  export const Chip: (props: ChipProps) => JSX.Element;

  // Button extended types
  export interface ButtonProps {
    className?: string;
    children?: ReactNode;
    variant?:
      | "primary"
      | "secondary"
      | "tertiary"
      | "ghost"
      | "danger"
      | "danger-soft";
    size?: "sm" | "md" | "lg";
    as?: any;
    href?: string;
    isDisabled?: boolean;
    isPending?: boolean;
    isIconOnly?: boolean;
    onPress?: (e: any) => void;
  }

  export const Button: (props: ButtonProps) => JSX.Element;

  // Separator
  export interface SeparatorProps {
    className?: string;
    orientation?: "horizontal" | "vertical";
  }

  export const Separator: (props: SeparatorProps) => JSX.Element;

  // Link
  export interface LinkProps {
    className?: string;
    children?: ReactNode;
    href?: string;
    asChild?: boolean;
  }

  export const Link: (props: LinkProps) => JSX.Element;
}
