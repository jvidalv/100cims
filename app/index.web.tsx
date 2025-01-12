import { FormattedMessage } from "react-intl";

export default function IndexScreen() {
  return (
    <section className="mx-auto overflow-y-auto py-12 sm:py-0">
      <div className="grid items-center justify-center gap-12 px-6 sm:min-h-screen sm:max-w-7xl sm:grid-cols-5">
        <div className="grid gap-8 sm:col-span-2">
          <div className="text-center sm:text-left">
            <h1 className="mb-4 text-7xl font-black">
              <FormattedMessage defaultMessage="Join" />{" "}
              <span className="text-primary">100cims</span>{" "}
              <FormattedMessage defaultMessage="today" />
            </h1>
            <p className="text-xl font-medium text-muted-foreground">
              <FormattedMessage defaultMessage="Track your progress in the 100 cims challenge by FEEC." />
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <button
              autoFocus
              className="w-fit cursor-pointer rounded-lg bg-foreground px-6 py-3 text-2xl font-semibold text-background transition-all hover:scale-105"
            >
              <FormattedMessage defaultMessage="Download now" /> ⬇️
            </button>
            <div className="text-muted-foreground/70">
              <FormattedMessage defaultMessage="Available for iOS and Android" />
            </div>
          </div>
        </div>
        <div className="max-w-screen relative hidden items-center justify-center sm:col-span-3 sm:flex sm:max-w-full sm:justify-start">
          <img
            alt=""
            src="app-mountains.png"
            className="peer absolute top-0 z-10 max-h-[calc(100vh-30vh)] rotate-12 rounded-2xl border-2 border-white transition-all hover:rotate-0  peer-hover:opacity-0 sm:left-80 dark:border-border"
          />
          <img
            alt=""
            src="app-mountain.png"
            className="peer absolute top-0 z-20 max-h-[calc(100vh-30vh)] rotate-6 rounded-2xl border-2 border-white  transition-all hover:rotate-0  peer-hover:opacity-0 sm:left-60 dark:border-border"
          />
          <img
            alt=""
            src="app-landing.png"
            className="relative z-30 max-h-[calc(100vh-30vh)] -rotate-2 rounded-2xl border-2 border-white transition-all hover:rotate-0 peer-hover:opacity-0 dark:border-border"
          />
        </div>
      </div>
      <div className="mt-12 flex gap-4 overflow-x-auto px-6 sm:hidden">
        <img
          alt=""
          src="app-landing.png"
          className="h-[500px] rounded-2xl border-2 border-white dark:border-border"
        />
        <img
          alt=""
          src="app-mountains.png"
          className="h-[500px] rounded-2xl border-2 border-white dark:border-border"
        />
        <img
          alt=""
          src="app-mountain.png"
          className="h-[500px] rounded-2xl border-2 border-white dark:border-border"
        />
      </div>
    </section>
  );
}
