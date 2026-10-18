# Planedle

A daily guess-the-aircraft game. You see a close-up of a photo of a plane or helicopter. Each skip or wrong guess zooms out a bit more, over six steps, until you see the whole photo. Six tries. Stats and streaks are kept in your browser.

Play it: https://maysentg.github.io/planedle/

Practice mode, as many rounds as you like with no stats saved: https://maysentg.github.io/planedle/?practice=1

## Photos

All photos come from Wikimedia Commons under free licences. The app only stores the Commons file name and the answer for each aircraft. The image, author and licence are loaded from the Commons API when you play, and nothing is copied or hosted here. Credits are shown at the end of every round.

## Run it

    npm install
    npm run dev

## Notes

This is a fan project inspired by Heardle and Wordle. The Ko-fi support button and the unused ad setup both live in `src/ads.js`.
