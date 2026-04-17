import type { FunctionComponent, PropsWithChildren } from "react";

export const Mono: FunctionComponent<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return <p className={`font-mono text-sm ${className}`}>{children}</p>;
};
