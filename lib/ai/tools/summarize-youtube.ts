import { generateObject, tool } from "ai";
import { z } from "zod";

import { getVideoModel } from "../providers";

const VIDEO_ID = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/;

const summarySchema = z.object({
  title: z
    .string()
    .describe("The video's actual title, as shown in the video or its intro."),
  channel: z
    .string()
    .nullable()
    .describe("The channel name, if it can be determined. Otherwise null."),
  language: z
    .string()
    .describe("Language the video is spoken in, e.g. 'Turkish', 'English'."),
  tldr: z.string().describe("One or two sentences capturing the whole video."),
  // Deliberately loose lower bounds: a 19-second clip genuinely has one point
  // and no chapters, and a `.min()` the video can't satisfy makes the model
  // fail schema validation rather than answer.
  keyPoints: z
    .array(z.string())
    .min(1)
    .max(8)
    .describe(
      "The main substantive points made in the video. Aim for 3-6 on a " +
        "normal-length video; give fewer if the video is very short."
    ),
  chapters: z
    .array(
      z.object({
        timestamp: z
          .string()
          .describe("Start time as mm:ss or h:mm:ss, e.g. '04:12'."),
        title: z.string().describe("Short label for this section."),
        detail: z.string().describe("One sentence on what happens here."),
      })
    )
    .max(10)
    .describe(
      "A timeline of the video's sections, in chronological order. Return an " +
        "empty array for clips too short to have sections."
    ),
  notableQuote: z
    .string()
    .nullable()
    .describe("A short, genuinely notable verbatim quote, or null if none."),
});

export type YouTubeSummary = z.infer<typeof summarySchema>;

export type YouTubeResult =
  | (YouTubeSummary & {
      videoId: string;
      videoUrl: string;
      thumbnailUrl: string;
    })
  | { error: string };

function extractVideoId(input: string): string | null {
  const match = input.match(VIDEO_ID);
  if (match) return match[1];
  // Bare ids are valid input too.
  if (/^[\w-]{11}$/.test(input.trim())) return input.trim();
  return null;
}

export const summarizeYouTube = tool({
  description:
    "Watch a YouTube video and produce an accurate, structured summary with a " +
    "chapter timeline. Use whenever the user shares a YouTube link or asks " +
    "what a video is about. The video is genuinely analysed — not guessed " +
    "from the title.",
  inputSchema: z.object({
    url: z.string().describe("A YouTube video URL or bare 11-character id."),
    focus: z
      .string()
      .optional()
      .describe(
        "Optional angle the user cares about, e.g. 'only the pricing section'."
      ),
  }),
  execute: async ({ url, focus }): Promise<YouTubeResult> => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      return { error: "That doesn't look like a valid YouTube video URL." };
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return {
        error:
          "Video summarisation needs a Gemini API key (GOOGLE_GENERATIVE_AI_API_KEY).",
      };
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    async function watch() {
      const { object } = await generateObject({
        model: getVideoModel(),
        schema: summarySchema,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Watch this video and summarise it accurately. Write every " +
                  "field in the same language the video is spoken in. Be " +
                  "specific to what is actually said — no generic filler. " +
                  (focus ? `The viewer especially cares about: ${focus}.` : ""),
              },
              { type: "file", data: videoUrl, mediaType: "video/mp4" },
            ],
          },
        ],
      });
      return object;
    }

    try {
      // Structured output occasionally comes back malformed on the first pass;
      // one retry is far cheaper than telling the user we couldn't watch a
      // video we can in fact watch.
      let object: YouTubeSummary;
      try {
        object = await watch();
      } catch {
        object = await watch();
      }

      return {
        ...object,
        videoId,
        videoUrl,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      };
    } catch (error) {
      const wrapped = error as {
        message?: string;
        statusCode?: number;
        data?: { error?: { message?: string } };
      };
      console.error(
        `[summarizeYouTube] ${videoId} status=${wrapped?.statusCode ?? "-"} ${
          wrapped?.data?.error?.message ?? wrapped?.message ?? String(error)
        }`
      );

      return {
        error:
          "Couldn't watch that video. It may be private, age-restricted, " +
          "region-locked, or too long to process.",
      };
    }
  },
});
