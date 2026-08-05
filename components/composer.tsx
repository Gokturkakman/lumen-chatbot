"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  CloseIcon,
  PaperclipIcon,
  SendIcon,
  StopIcon,
} from "@/components/icons";
import type { ChatModel } from "@/lib/ai/models";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Attachment = {
  id: string;
  name: string;
  mediaType: string;
  dataUrl: string;
};

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 1568;
const MAX_TEXTAREA_HEIGHT = 224;

/**
 * Downscales an image in the browser before it ever reaches the server.
 * Models cap useful resolution around 1568px anyway, and this keeps the data
 * URL small enough to live in the message row.
 */
async function toAttachment(file: File): Promise<Attachment> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
  );

  // Already small enough and not a format worth re-encoding.
  if (scale === 1 && file.size < 900_000) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    bitmap.close();
    return {
      id: crypto.randomUUID(),
      name: file.name,
      mediaType: file.type,
      dataUrl,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // PNGs may carry transparency that JPEG would flatten to black.
  const mediaType = file.type === "image/png" ? "image/png" : "image/jpeg";

  return {
    id: crypto.randomUUID(),
    name: file.name,
    mediaType,
    dataUrl: canvas.toDataURL(mediaType, 0.85),
  };
}

export function Composer({
  text,
  onTextChange,
  attachments,
  onAttachmentsChange,
  onSubmit,
  onStop,
  busy,
  centred,
  model,
}: {
  text: string;
  onTextChange: (value: string) => void;
  attachments: Attachment[];
  onAttachmentsChange: (next: Attachment[]) => void;
  onSubmit: (text: string) => void;
  onStop: () => void;
  busy: boolean;
  centred: boolean;
  model: ChatModel | undefined;
}) {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [roomy, setRoomy] = useState(true);

  /* The descriptive placeholder wraps to two lines on a phone, which doubles
     the height of the closed composer — fall back to the short one there. */
  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const sync = () => setRoomy(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /* Auto-grow the textarea up to a cap, then scroll.
     Measured on the next frame: on first mount the web font may still be
     swapping, which yields a bogus scrollHeight and locks the box open. */
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;

    function resize() {
      if (!node) return;
      node.style.height = "0px";
      node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }

    resize();
    const frame = requestAnimationFrame(resize);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  /* Re-measure once the real font lands, so the closed height is exact. */
  useEffect(() => {
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      const node = textareaRef.current;
      if (cancelled || !node) return;
      node.style.height = "0px";
      node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const images = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (images.length === 0) {
        toast.error(t("composer.imageOnly"));
        return;
      }

      if (model && !model.vision) {
        toast.error(t("composer.noVision", { model: model.name }));
        return;
      }

      const accepted: Attachment[] = [];
      for (const file of images) {
        if (file.size > MAX_BYTES) {
          toast.error(t("composer.imageTooBig"));
          continue;
        }
        try {
          accepted.push(await toAttachment(file));
        } catch {
          toast.error(t("error.title"));
        }
      }

      if (accepted.length > 0) {
        onAttachmentsChange([...attachments, ...accepted]);
      }
    },
    [attachments, model, onAttachmentsChange, t]
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!busy) onSubmit(text);
    }
  }

  const canSend = Boolean(text.trim()) || attachments.length > 0;

  return (
    <div
      className={cn(
        "relative z-10 w-full shrink-0 px-4 sm:px-6",
        centred ? "pb-4 pt-4" : "pb-5 pt-2"
      )}
    >
      {/* Fade so text scrolls out under the composer rather than colliding. */}
      {!centred && (
        <div className="pointer-events-none absolute inset-x-0 bottom-full h-16 bg-gradient-to-t from-paper to-transparent" />
      )}

      <div className="mx-auto w-full max-w-[720px]">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "rounded-2xl border bg-raised transition-all duration-200",
            dragging
              ? "border-accent shadow-pop ring-4 ring-accent-wash"
              : "border-rule shadow-card focus-within:border-rule-strong focus-within:shadow-pop"
          )}
        >
          {/* Attachment strip */}
          <AnimatePresence initial={false}>
            {attachments.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 border-b border-rule p-3">
                  {attachments.map((attachment) => (
                    <motion.div
                      key={attachment.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative h-16 w-16 overflow-hidden rounded-lg border border-rule"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label={t("composer.remove")}
                        onClick={() =>
                          onAttachmentsChange(
                            attachments.filter((item) => item.id !== attachment.id)
                          )
                        }
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/75 text-paper opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                      >
                        <CloseIcon size={11} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-1.5 p-2 pl-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={t("composer.attach")}
              title={t("composer.attach")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-faint transition-colors hover:bg-sunken hover:text-ink"
            >
              <PaperclipIcon size={17} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                if (event.target.files) void addFiles(event.target.files);
                event.target.value = "";
              }}
            />

            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={(event) => {
                const files = Array.from(event.clipboardData.files);
                if (files.length > 0) {
                  event.preventDefault();
                  void addFiles(files);
                }
              }}
              placeholder={
                centred && roomy
                  ? t("composer.placeholderEmpty")
                  : t("composer.placeholder")
              }
              className="scroll-slim field-sizing-content max-h-56 min-h-9 flex-1 resize-none bg-transparent py-[9px] text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint"
            />

            <button
              type="button"
              onClick={() => (busy ? onStop() : onSubmit(text))}
              disabled={!busy && !canSend}
              aria-label={busy ? t("composer.stop") : t("composer.send")}
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-200",
                busy
                  ? "bg-ink text-paper hover:opacity-85"
                  : canSend
                    ? "bg-accent text-accent-ink hover:bg-accent-hover"
                    : "cursor-not-allowed bg-inset text-faint"
              )}
            >
              {busy ? <StopIcon size={16} /> : <SendIcon size={16} />}
            </button>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-faint">
          {t("composer.hint")} · {t("composer.disclaimer")}
        </p>
      </div>
    </div>
  );
}
