# Alchymisti Video Synthesizer

## Building from source

You need NodeJS v22 or above and PNPM v10 or above.

Download the source code and install dependencies by running `pnpm install`
in the project root.

You need to download the Ffmpeg binaries for the target platform
and place them in the appropriate locations:

```
For Windows:
 - lib/win/bin/ffmpeg.exe
 - lib/win/bin/ffprobe.exe
For macOS:
 - lib/mac/bin/ffmpeg
 - lib/mac/bin/ffprobe
```

Then build the app using `pnpm build:win` or `pnpm build:mac`.

To preview the app before building, you can use `pnpm dev`.
