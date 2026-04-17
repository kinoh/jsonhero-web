import { HomeHeader } from "~/components/Home/HomeHeader";
import { DragAndDropForm } from "~/components/DragAndDropForm";
import { Title } from "~/components/Primitives/Title";
import { UrlForm } from "~/components/UrlForm";
import {
  commitSession,
  getSession,
  ToastMessage,
} from "../services/toast.server";
import { json, useLoaderData } from "remix";
import ToastPopover from "../components/UI/ToastPopover";
import { HomeTriggerDevBanner } from "~/components/Home/HomeTriggerDevBanner";

type LoaderData = { toastMessage?: ToastMessage };

export async function loader({ request }: { request: Request }) {
  const cookie = request.headers.get("cookie");
  const session = await getSession(cookie);
  const toastMessage = session.get("toastMessage") as ToastMessage;

  return json(
    { toastMessage },
    {
      headers: { "Set-Cookie": await commitSession(session) },
    }
  );
}
export default function Index() {
  const { toastMessage } = useLoaderData<LoaderData>();

  return (
    <div className="overflow-x-hidden">
      {toastMessage && (
        <ToastPopover
          message={toastMessage.message}
          title={toastMessage.title}
          type={toastMessage.type}
          key={toastMessage.id}
        />
      )}

      <HomeHeader fixed={true} />
      <main className="min-h-screen bg-slate-950 px-4 pt-24 text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="space-y-2">
            <Title className="text-3xl text-slate-100">
              Paste JSON or drop a file
            </Title>
            <p className="text-slate-400">
              Enter a JSON URL, paste raw JSON, or drop a `.json` file
            </p>
          </div>
          <UrlForm />
          <DragAndDropForm />
        </div>
      </main>
    </div>
  );
}
