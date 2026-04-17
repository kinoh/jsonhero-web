import type { FunctionComponent, PropsWithChildren } from "react";

export const LargeTitle: FunctionComponent<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <h1 className={`font-sans font-bold text-2xl ${className}`}>{children}</h1>
  );
};
