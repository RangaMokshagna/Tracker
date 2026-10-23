# Start Your Run

The Run tab shows `RunHero` while idle. Its slide control opens `/run-setup` above the tab navigator, so the dock is absent on setup. Confirmation writes mode, distance in meters and target time in minutes to the run store, starts the existing 3–2–1 countdown, and opens the tracker. The dock remains hidden while tracking.

`StartRunFlow.tsx` exports the reusable `SlideButton`, `ModeSwatches`, `DistanceRuler` and `Stepper`. It uses the existing `GlassCard`. Sliders spring back below 80% travel and also support button activation for accessibility. Returning to the screen resets the slider. Reduced motion disables the photo zoom, entry movement, pulsing chevrons and animated snap scrolling. Distance and time feed the existing calorie estimator using the runner's profile weight. Treadmill mode runs the timer without requesting GPS; indoor distance measurement needs a treadmill/sensor integration.

Validation: check returning from setup, partial and completed swipes, distance snapping, time bounds, countdown, pause/resume and saving a run on a physical device. Platform exports cannot verify GPS permissions or haptics.

## Artwork

Asset: `assets/run-adventure-hero.png`. Created with the built-in image generation tool.

Prompt: Photorealistic cinematic editorial photograph for a premium running app mobile landing screen, portrait 9:16. Athletic adult runner in motion sprinting on an alpine forest trail at golden hour, full body centered upper two thirds, natural anatomy, charcoal sportswear with subtle sea-glass mint details, warm rim lighting, dark teal forest and misty distant ridges. Dynamic movement, sophisticated quiet adventure mood. Bottom third extremely dark calm ground for app UI text card. Palette dark charcoal #101B21, muted sea-glass teal and small apricot highlights. No text, no logos, no interface, no borders.
