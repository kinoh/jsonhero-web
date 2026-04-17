import type { FunctionComponent, PropsWithChildren } from "react";

export const SmallBody: FunctionComponent<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return <p className={`font-sans text-sm ${className}`}>{children}</p>;
};
