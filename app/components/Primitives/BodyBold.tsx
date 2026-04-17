import type { FunctionComponent, PropsWithChildren } from "react";

export const BodyBold: FunctionComponent<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <p className={`font-sans text-base font-bold ${className}`}>{children}</p>
  );
};
