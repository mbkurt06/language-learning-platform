# ZDF Subtitle Lab Extension

Independent Chrome extension used to validate ZDF subtitle acquisition before integrating the approach into the main Language Learning extension.

## Scope

This lab intentionally does **not** include:

- German Engine analysis
- translation
- saved/known learning state
- the main shared panel
- YouTube support

It only tests whether ZDF subtitle sources can be discovered and synchronized reliably.

## Current targets

### ZDF VOD

The lab looks for direct ZDF WebVTT subtitle URLs and maps their cue timestamps to the video's `currentTime`.

### ZDF Live

The lab listens to ZDF player network activity in MAIN world, discovers HLS subtitle playlists, parses `#EXT-X-PROGRAM-DATE-TIME` and `#EXTINF`, downloads recent WebVTT segments, maps them to epoch time, and renders the cue corresponding to the current live playback position.

Live playlists are refreshed every 6 seconds.

## Debug panel

A small panel in the upper-right corner shows:

- acquisition mode
- whether a video was found
- number of direct VTT sources
- number of HLS subtitle playlists
- loaded cue count
- last live refresh age
- captured source URL
- current cue
- latest error

## Local install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Choose **Load unpacked**
4. Select `apps/zdf-subtitle-lab-extension`
5. Open a ZDF Mediathek video or ZDF Live page
6. Start playback and, when available, enable ZDF subtitles in the native player so the player requests the subtitle source

## First validation

Test these separately:

1. ZDF normal Mediathek video with subtitles
2. ZDF Live stream with subtitles

Expected modes:

- VOD: `vod-direct-vtt`
- Live: `live-hls-webvtt`

The lab draws only the German cue. Translation will be added only after subtitle acquisition is proven stable.

## Why this is separate

The lab is isolated from the production extension so experiments with ZDF HLS, WebVTT and time synchronization cannot break the Language Learning extension.
