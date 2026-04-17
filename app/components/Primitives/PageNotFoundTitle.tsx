import type { FunctionComponent, PropsWithChildren } from "react";

export const PageNotFoundTitle: FunctionComponent<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <h1 className={`font-sans font-bold text-8xl ${className}`}>{children}</h1>
  );
};
