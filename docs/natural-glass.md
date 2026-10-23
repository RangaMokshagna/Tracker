# Natural Glass redesign

The existing Expo SDK 58 / React Native app retains Today, History, Run, Coach, Profile, saved runs, goals, coaching, and badge data.

## Visual changes

- A shared nature palette in `src/theme/natural.ts`: mist, ink, sage, sky and sand; warm charcoal dark mode. Small muted text uses a darker semantic grey for contrast; white action labels use pressed sage.
- Instrument Serif titles and large metrics, Inter interface text, labels at least 11px.
- Blurred forest photography behind screens, translucent cards, bright gradient edges, faint grain and softer shadows. Reusable `GlassSurface`, `GlassMaterial` and `NaturalScene` support scene blur targets and Android fallbacks.
- Airier Today header, photographic movement card, sage action, themed charts, history summaries, coach conversation, profile and session summaries.
- A compact sage glass dock in Today / History / Run / Coach / Profile order, retaining its sliding lens, drag interaction and accessibility. `GlassDock` aliases the reusable component. Setup and live tracking hide the dock.
- Run landing uses a real forest photograph, slow zoom/parallax, serif title, frosted card and sage slider with a release label and wave chevrons.
- Run setup uses icon chips, a photographic-style transparent runner asset, outlined RUN backdrop, soft mode tints, arc indicator and centered distance selector with edge fades. Both 3K and 42K can center completely.
- Time steppers accelerate on long press and cancel when released or backgrounded. Calories roll between values. Mode, distance and time continue into the existing run tracker.
- Frosted countdown, themed live metrics and controls, plus themed post-run summary.
- Sand/sage achievement folder artwork and a warmer card deck, retaining swipe, flip, progress, earned shine, sharing and filtering.
- Shared press feedback, light haptics, reduced-motion handling, loading placeholders and safe-area spacing. The offline banner now occupies layout space instead of covering content.

## Imagery and generation record

Outdoor photographs are downloaded from Unsplash:

- `assets/natural-forest.jpg`: Vinu T, [forest path](https://unsplash.com/photos/a-path-through-a-dense-forest-on-a-foggy-day-KUdBy3f2RYk).
- `assets/natural-trail.jpg`: Florian Glawogger, [forest trail](https://unsplash.com/de/fotos/leerer-weg-durch-den-wald-3mmmfrZ3S80).

The runner and folder are generated assets, produced with the built-in image-generation tool in generate mode, transparent background, and copied into the project. The runner is a photorealistic generated cutout, not a photograph of an identified athlete.

`assets/natural-runner.png` prompt:

> Photographic full-body cut-out of an adult male trail runner in natural mid-stride running pose, facing right, athletic but realistic build, sage green technical running shirt, warm charcoal shorts and ivory trail shoes. Realistic sports editorial photography, natural skin texture and anatomy, softly lit with warm morning rim light, calm expression, no neon or exaggerated muscles. Whole body and both shoes fully visible, centered with small transparent margins. Genuine transparent alpha background, no landscape, no words, no logo. Premium fitness mobile app asset, photographic rather than illustration or 3D render.

`assets/natural-achievements.png` prompt:

> Small premium frosted glass file-folder UI icon isolated on genuine transparent alpha background. Two layered softly rounded folder panes tilted in subtle perspective, front pane pale forest sage #DCE8DC with restrained #5E8F62 edges, back pane warm sand #F4D8A8, simple ivory embossed trophy medallion on lower front. Soft tactile translucent glass with fine grain, gentle daylight highlights, delicate contact shadow. Calm natural iOS interface asset, no neon, no cyan, no luminous glow, no pure-black material. No text, no logos, no background scene. Whole object visible, centered with small transparent margins. Photorealistic material render, refined quiet design.

## Validation and practical limits

- Focused achievement, dock, run setup and notification tests: 15 passed.
- Expo Android, iOS and web export succeeded.
- Mobile web preview checked in both light and dark themes; setup checked through the centered 42K endpoint.
- Full lint and typecheck retain pre-existing issues in older code/tests. These are reported separately from the visual implementation.
- Device GPS, physical haptics and 60fps performance require testing on a phone. Android devices without supported backdrop blur use translucent material fallbacks. The folder transition morphs the raster artwork rather than articulating an independent hinged lid.
