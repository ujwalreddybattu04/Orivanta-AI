"use client";

interface AnswerStreamProps {
    content: string;
    isStreaming: boolean;
}

export default function AnswerStream({ content, isStreaming }: AnswerStreamProps) {
    return (
        <div className="answer-stream" id="answer-stream">
            <div className="answer-stream-content">
                {/* Render streamed markdown content token-by-token */}
                {content}
                {isStreaming && <span className="answer-cursor" />}
            </div>
        </div>
    );
}
