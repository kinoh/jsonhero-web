import type { FunctionComponent, PropsWithChildren } from "react";

export const Body: FunctionComponent<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return <p className={`font-sans text-base ${className}`}>{children}</p>;
};
