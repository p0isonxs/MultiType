import { Github } from "lucide-react";

export default function Footer() {
    return (
        <footer className="mt-10 text-center text-sm text-gray-500 px-4 w-full max-w-4xl mx-auto">
            <p className="mb-1">
                Synq Type is powered by{" "}
                <a
                    href="https://multisynq.io"
                    className="underline hover:text-white inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Multisynq
                </a>
                , an open-source engine for real-time multiplayer collaboration.
            </p>
            <p className="inline-flex items-center justify-center gap-1 text-gray-500">
                View the source on{" "}
                <a
                    href="https://github.com/multisynq"
                    className="underline hover:text-white"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GitHub
                </a>
            </p>
        </footer>
    );
}
