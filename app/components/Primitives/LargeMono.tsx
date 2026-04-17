import type { FunctionComponent, PropsWithChildren } from "react";

export const LargeMono: FunctionComponent<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return <p className={`font-mono text-md ${className}`}>{children}</p>;
};
