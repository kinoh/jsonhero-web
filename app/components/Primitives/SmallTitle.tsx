import type { FunctionComponent, PropsWithChildren } from "react";

export const SmallTitle: FunctionComponent<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <h3 className={`font-sans font-bold text-lg ${className}`}>{children}</h3>
  );
};
