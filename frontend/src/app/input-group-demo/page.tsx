import MicrophoneInputGroup from "@/components/ui/c-input-group-6";

export default function InputGroupDemoPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-950 p-8">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <h2 className="mb-4 text-sm font-medium text-slate-300">Microphone Input Group Demo</h2>
        <MicrophoneInputGroup />
      </div>
    </main>
  );
}

