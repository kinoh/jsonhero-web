import { TemplateIcon, CodeIcon, DownloadIcon } from "@heroicons/react/outline";
import { TreeIcon } from "~/components/Icons/TreeIcon";
import { useHotkeys } from "react-hotkeys-hook";
import { Link, useLocation, useNavigate } from "react-router";
import { useJsonDoc } from "~/hooks/useJsonDoc";
import { ToolTip } from "./ToolTip";
import { Body } from "./Primitives/Body";
import { ShortcutIcon } from "./Icons/ShortcutIcon";
import { useTheme } from "./ThemeProvider";

export function SideBar() {
  const { doc } = useJsonDoc();

  return (
    <div className="side-bar flex flex-col align-center justify-between h-full p-1 bg-slate-200 transition dark:bg-slate-800">
      <ol className="relative">
        <SidebarLink
          to={`/j/${doc.id}`}
          hotKey="option+1,alt+1"
          label="Column view"
        >
          <ToolTip arrow="left">
            <Body>Column view</Body>
            <ShortcutIcon className="w-[26px] h-[26px] ml-1 text-slate-700 bg-slate-200 dark:text-slate-300 dark:bg-slate-800">
              ⌥
            </ShortcutIcon>
            <ShortcutIcon className="w-[26px] h-[26px] ml-1 text-slate-700 bg-slate-200 dark:text-slate-300 dark:bg-slate-800">
              1
            </ShortcutIcon>
          </ToolTip>
          <TemplateIcon className="m-2 w-6 h-6" />
        </SidebarLink>
        <SidebarLink
          to={`/j/${doc.id}/editor`}
          hotKey="option+2,alt+2"
          label="JSON view"
        >
          <ToolTip arrow="left">
            <Body>JSON view</Body>
            <ShortcutIcon className="w-[26px] h-[26px] ml-1 text-slate-700 bg-slate-200 dark:text-slate-300 dark:bg-slate-800">
              ⌥
            </ShortcutIcon>
            <ShortcutIcon className="w-[26px] h-[26px] ml-1 text-slate-700 bg-slate-200 dark:text-slate-300 dark:bg-slate-800">
              2
            </ShortcutIcon>
          </ToolTip>
          <CodeIcon className="m-2 w-6 h-6" />
        </SidebarLink>
        <SidebarLink
          to={`/j/${doc.id}/tree`}
          hotKey="option+3,alt+3"
          label="Tree view"
        >
          <ToolTip arrow="left">
            <Body>Tree view</Body>
            <ShortcutIcon className="w-[26px] h-[26px] ml-1 text-slate-700 bg-slate-200 dark:text-slate-300 dark:bg-slate-800">
              ⌥
            </ShortcutIcon>
            <ShortcutIcon className="w-[26px] h-[26px] ml-1 text-slate-700 bg-slate-200 dark:text-slate-300 dark:bg-slate-800">
              3
            </ShortcutIcon>
          </ToolTip>
          <TreeIcon className="m-2 w-6 h-6" />
        </SidebarLink>
      </ol>
      <ol>
        <SidebarLink label="Download JSON">
          <a href={`/j/${doc.id}.json`} target="_blank" aria-label="Download JSON">
            <ToolTip arrow="left">
              <Body>Download</Body>
            </ToolTip>
            <DownloadIcon className="m-2 w-6 h-6" />
          </a>
        </SidebarLink>
      </ol>
    </div>
  );
}

function SidebarLink({
  children,
  to,
  hotKey,
  label,
}: {
  children: React.ReactNode;
  to?: string;
  hotKey?: string;
  label?: string;
}) {
  const location = useLocation();

  const isActive = location.pathname === to;

  const { minimal } = useJsonDoc();
  const [theme] = useTheme();

  const queryParams = new URLSearchParams();

  if (typeof minimal === "boolean") {
    queryParams.set("minimal", String(minimal));

    if (theme) {
      queryParams.set("theme", theme);
    }
  }

  const href = `${to}${queryParams.toString().length > 0 ? `?${queryParams.toString()}` : ""
    }`;

  if (hotKey) {
    const navigate = useNavigate();
    useHotkeys(
      hotKey,
      (e) => {
        e.preventDefault();
        if (!isActive && to) {
          navigate(href);
        }
      },
      [navigate, isActive, to]
    );
  }

  const classes = isActive
    ? "relative flex h-10 w-10 items-center justify-center mb-1 rounded-sm bg-indigo-700 text-white transition cursor-pointer"
    : "relative flex h-10 w-10 items-center justify-center mb-1 rounded-sm text-slate-700 transition hover:bg-slate-300 cursor-pointer dark:text-white dark:hover:bg-slate-700";

  return !!to ? (
    <li>
      <Link
        to={href}
        prefetch={isActive ? "none" : "render"}
        aria-label={label}
        className={classes}
      >
        {children}
      </Link>
    </li>
  ) : (
    <li className={classes} aria-label={label}>
      {children}
    </li>
  );
}
