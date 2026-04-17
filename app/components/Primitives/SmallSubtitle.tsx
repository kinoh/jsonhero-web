import type { FunctionComponent, PropsWithChildren } from "react";

export const SmallSubtitle: FunctionComponent<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <h3 className={`font-sans text-xl text-slate-300 ${className}`}>{children}</h3>
  );
};
