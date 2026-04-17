import { DiscordIconTransparent } from "../Icons/DiscordIconTransparent";
import { EmailIconTransparent } from "../Icons/EmailIconTransparent";
import { TwitterIcon } from "../Icons/TwitterIcon";
import { Logo } from "../Icons/Logo";
import { GithubStar } from "../UI/GithubStar";
import { LogoTriggerdotdev } from "../Icons/LogoTriggerdotdev";

export function HomeHeader({ fixed }: { fixed?: boolean }) {
  return (
    <header
      className={`${
        fixed ? "fixed" : ""
      } z-20 flex h-12 justify-center bg-indigo-900 flex-col`}
    >
      <div className="flex items-center justify-between w-screen px-4">
        <div className="flex gap-1 sm:gap-1.5 h-8 justify-center items-center">
          <div className="w-24 sm:w-32">
            <Logo />
          </div>
          <p className="text-slate-300 text-sm sm:text-base font-sans">by</p>
          <LogoTriggerdotdev className="pt-0.5 w-16 sm:w-24 opacity-80 hover:opacity-100 transition duration-300" />
        </div>
        <ol className="flex items-center gap-2 sm:pr-4">
          <li className="hover:cursor-pointer hidden sm:block">
            <GithubStar />
          </li>
          <li className="hover:cursor-pointer opacity-90 hover:opacity-100 transition hidden sm:block">
            <a href="mailto:hello@jsonhero.io">
              <EmailIconTransparent />
            </a>
          </li>
          <li className="hover:cursor-pointer opacity-90 hover:opacity-100 transition hidden sm:block">
            <a href="https://discord.gg/JtBAxBr2m3" target="_blank">
              <DiscordIconTransparent />
            </a>
          </li>
          <li className="hover:cursor-pointer opacity-90 hover:opacity-100 transition hidden sm:block">
            <a href="https://twitter.com/triggerdotdev" target="_blank">
              <TwitterIcon />
            </a>
          </li>
        </ol>
      </div>
    </header>
  );
}
