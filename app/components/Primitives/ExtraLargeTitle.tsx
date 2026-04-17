import type { FunctionComponent, PropsWithChildren } from "react";

export const ExtraLargeTitle: FunctionComponent<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <h1 className={`font-sans font-bold text-6xl ${className}`}>{children}</h1>
  );
};
