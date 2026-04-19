import { HomeHeader } from "~/components/Home/HomeHeader";
import { Title } from "~/components/Primitives/Title";

export const meta = () => {
  return [
    { title: "JSON Hero - Privacy" },
    { property: "og:title", content: "JSON Hero - Privacy" },
  ];
};

export default function PrivacyRoute() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <HomeHeader fixed={true} />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-24">
        <div className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="space-y-2">
            <Title className="text-3xl text-slate-100">Privacy Notice</Title>
            <p className="text-slate-400">Last updated June 01, 2022</p>
          </div>

          <div className="space-y-4 text-slate-300">
            <p>
              Stack Hero Limited may collect and process information that is
              necessary to operate JSON Hero, protect the service, and comply
              with legal obligations.
            </p>
            <p>
              Information may include device, browser, and usage details such as
              IP address, language preferences, referring URLs, viewed pages,
              searches, and related diagnostic data.
            </p>
            <p>
              The service may use cookies and similar technologies to store
              preferences and improve the experience. Information may be shared
              during business transfers or when required by law.
            </p>
            <p>
              Personal information is retained only as long as needed for the
              stated purposes unless a longer retention period is required by
              law.
            </p>
            <p>
              Questions about this notice can be sent to
              {" "}
              <a
                className="text-lime-300 underline underline-offset-2"
                href="mailto:hello@jsonhero.io"
              >
                hello@jsonhero.io
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
