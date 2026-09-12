# AgWorld — real-time commander production brief

**Direction confirmed: 12 September 2026.** Six original, fully three-dimensional animated assistants, rendered live in the game. The visual benchmark is the convincing material detail, expressive acting and polished lighting of a feature-length animated film. The small procedural prototype was rejected. Pre-rendered sprites and videos are not the chosen solution.

## What the player should experience

The System Administrator walks onto the map after entry, looks towards the player and welcomes them in his own warm voice. Boots make subtle contact sounds. Weight shifts, planted feet, eye contact, breathing, blinking, facial expressions and natural gestures make him feel present on the screen. The screen edge behaves like a floor; he does not float over it.

Clicking the character opens or closes the dialogue without restarting or stopping his voice. The player can pause speech, ask a spoken or typed question, and dismiss him. Selecting another advisor first completes the outgoing character’s exit, then brings in the selected advisor. Rapid clicks should resolve to the most recently selected advisor, with only one active speaker and microphone.

## Art direction and likeness

- Original adult characters with appealing oversized-head proportions: initial target around 3.5–4 heads tall. Keep hands, feet, facial structure and clothing convincingly modelled. Avoid toy block bodies and sphere-based faces.
- Preserve each approved advisor portrait’s identity, age, hair, facial hair and clothing cues. The Administrator represents the owner. Final likeness must be reviewed against the owner’s supplied reference photographs; the existing portrait is only a starting reference.
- AgWorld field uniforms: deep charcoal and dark teal, lime brand accents, embroidered patches, stitched seams, layered fabric, believable fastenings and boots. Give each specialist a distinct silhouette without obscuring their face.
- Skin with subtle pore/roughness variation and warm shading; layered eyes with corneal highlights; textured eyebrows and groomed hair/beards; fabric normals; worn leather and restrained metal highlights. Avoid waxy skin, plastic clothing, flat eyes and helmet-like hair.
- Use the current AgWorld reference image for game palette and lighting. Existing source portraits are in the repository under `AG WORLD/assets/advisors/`.

| Character | Performance direction | Voice direction already configured |
|---|---|---|
| System Administrator | Mature male host; relaxed authority, personable humour; grounded gestures | Cedar: warm mature male, relaxed South African English |
| Product Commander | Curious female specialist; clear demonstrations, engaged expression | Marin: approachable, confident and practical |
| Technical Commander | Experienced male troubleshooter; measured and observant | Onyx: calm lower register, precise and patient |
| Sales Commander | Energetic male strategist; expressive without exaggerated hype | Ash: upbeat, encouraging and assured |
| Operations Commander | Practical male organiser; economical, purposeful movements | Verse: steady, decisive and friendly |
| Compliance Commander | Composed female advisor; supportive rather than stern | Coral: clear, reassuring and deliberate |

These are directed synthetic voices, not voice clones of the people represented. Personalities can be refined after the first Administrator is approved.

## Model and rig delivery

Deliver the Administrator first as a complete vertical slice. Approve his appearance and performance in the actual browser before producing the other five.

1. Editable source scene with clean naming, textures and licences; a self-contained glTF 2.0 binary (`.glb`) for the browser; an FBX interchange copy if used by the animation team.
2. Y-up, forward +Z, one metre scale convention documented, feet on Y=0, root at the ground origin. Apply modelling transforms before export. No camera or lighting baked into the character mesh.
3. Deforming humanoid skeleton with hips, spine, neck, head, shoulders, arms, wrists, fingers, legs, ankles and toes. Provide foot IK controls in the source rig. Export baked joint animations; no engine-specific rig constraints required at runtime.
4. Facial morph targets for jaw open, mouth close, smile/frown, lips funnel/pucker, wide and rounded vowels, lip seal, upper-teeth/lower-lip contact, eye blinks, squints and brow expression. Supply a mapping table to the exported morph names.
5. Eyes must look towards the dialogue/player; mouth shapes must support speech. Body clips must not overwrite the face controls. Avoid a simple repeated jaw-open loop as the final speaking performance.
6. PBR metallic/roughness materials. Embedded base colour, normal, roughness/metallic and occlusion textures. Inspect colour-space settings, transparency, normals, skin weights and tangent seams in the browser.
7. Hair should use a browser-friendly groom approximation or hair cards. No live strand simulation dependency. Avoid expensive overlapping transparent layers.

## Required animation clips

Clip names below are the proposed integration contract. Deliver in-place locomotion with a documented stride length; the game moves the actor across the viewport. Source files may additionally contain root-motion versions. Do not export both into the active runtime controller.

| Clip | Expected behaviour |
|---|---|
| `idle` | Seamless 5–8 second breathing/weight-shift loop; restrained motion |
| `walk` | Seamless walk loop with left/right foot-contact event times |
| `arrive` | Slow down, plant feet, turn towards the player and settle |
| `greet` | Warm greeting/wave with facial expression |
| `listen` | Attentive listening loop, eye contact and small head responses |
| `think` | Brief natural consideration; no exaggerated looping confusion |
| `talk_neutral` | Conversational body gestures; face driven separately |
| `talk_explain` | More expressive explanation, suitable for panel introductions |
| `point_left`, `point_right`, `point_up`, `point_down` | Clear directional gestures without covering the target panel |
| `react_surprise`, `recover` | Short readable reactions and return to neutral |
| Five exit clips below | Distinct staged departures with matching effect event times |

Supply animation event metadata for footsteps, effect start, character disappearance and completion. The exported clips must not depend on a fixed speech duration; gestures blend while audio plays. Specify safe crossfade points and looping flags.

## Five departures

Play one variation per dismissal, avoiding an immediate repeat. All are playful game effects with no injury detail. Effects should normally finish in 1.2–2.2 seconds. Closing speech stops it immediately; departure does not wait for another audio API request.

| Exit / clip | Character acting | Runtime effect and sound |
|---|---|---|
| Sinkhole — `exit_sinkhole` | Glance down, lose footing, briefly reach upwards, disappear below the floor | A circular crack opens under the feet, with dust and a descending whoosh; floor closes cleanly |
| Laser zap — `exit_laser` | Notice a targeting point, startled pose, dissolve | A brief controlled beam, emissive silhouette and dispersing particles; short electronic zap, no strobing |
| Teleport — `exit_teleport` | Tap wrist device, acknowledge player, stand in the beam | Ring rises from feet to head, character resolves into light; soft rising electronic tone |
| Tractor beam — `exit_tractor_beam` | Look upwards, float, feet lift, give a last small wave | Focused overhead beam lifts character out of frame; playful rising whoosh |
| Floor hatch — `exit_hatch` | Open an imagined hatch, climb/step down, pull it closed | A small dimensional hatch and closing rim on the screen floor; hinge and soft latch sounds |

The model artist supplies the acting clips. The game integration supplies masking, particles, beams, floor effects and audio scheduling. Do not encode particle effects as thousands of animated mesh objects in the character GLB.

## Sound and speech integration

- At least four short boot-footstep variations plus clothing movement; randomise subtly and schedule from actual foot-contact events. No footstep sound during idle or while sliding to a new screen position.
- Deliver separate effect stems for each departure, with event offsets. WAV source plus compact browser formats. Avoid bundling long music tracks.
- Mix effects below spoken dialogue. Provide separate speech/effects controls. Respect mute, reduced motion and tab visibility. Browsers may require a user gesture before sound can start.
- Existing OpenAI speech generation supplies the dialogue audio. Do not assume that API supplies facial-animation/viseme timestamps. Build and validate the facial timing layer separately; use an audio envelope only as an initial fallback.

## Browser performance targets

These are initial production budgets, subject to measurement on the intended devices—not promises of measured performance.

- One visible character, one active animation controller. Target 60 fps on the primary desktop, minimum sustained 30 fps on the agreed lower-spec device while the map is interactive.
- Starting mesh budget: 40,000–80,000 triangles for the hero, lower-detail version around 15,000–25,000. Target 6–10 materials, maximum 12 draw calls before effects.
- Start with 2K hero face/body textures and 1K accessories. Target 8 MB or less transferred per character, with a hard review before exceeding 12 MB. Include measured GPU texture memory in the delivery report.
- Load the selected character after the game is usable. Do not add all six models to the login/game readiness gate. Cache only the active character and, if memory allows, the next requested character. Cancel stale loads and release unused geometry, textures, mixers and audio resources.
- Adaptive pixel ratio, bounded shadows and particles, offscreen/tab pause. Reduced-motion mode uses a short arrival/fade and disables roaming and dramatic exits.
- The map remains clickable outside the visible character and dialogue. A transparent full-screen rendering canvas must not intercept all pointer events.

## Approval checks

1. **Look:** front/side/three-quarter renders and a turntable, compared to the approved photographs and AgWorld reference. Review the face at the actual on-screen size as well as close-up.
2. **Movement:** continuous walk → settle → greet → listen → speak sequence in the actual game. Feet must plant; clothing, hair and limbs must not intersect visibly. Inspect contact shadow and floor alignment.
3. **Speech:** natural eye and mouth performance, understandable voice at normal volume, and dialogue open/close without audio restart. Include a South African place name and a product model number in the test sentence.
4. **Departures:** all five individually reviewed; sound/effect/animation events align; repeated rapid advisor changes leave only the last requested character active.
5. **Resilience:** poor network, missing model, WebGL context loss, tab hide, mute, reduced motion, resize, narrow screen, open drawers and microphone cancellation. A model failure must leave the map and text/voice assistant usable.
6. **Delivery:** glTF validation without errors; original source files, texture sources, licence/likeness permissions, clip and face mapping, event timings, asset-size report and browser performance capture.

## Current delivery boundary

The conversation service, directed synthetic voices, panel tour and map improvements are implemented separately. The existing portraits remain available. The rejected procedural 3D prototype is excluded from the production release. Production character meshes, rigs, facial animation, final footsteps and the five realised departures are still asset/animation work to commission or supply; this brief defines that work and its acceptance criteria.

Technical references: [glTF specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html), [Three.js animation system](https://threejs.org/manual/en/animation-system.html), [OpenAI speech guide](https://developers.openai.com/api/docs/guides/text-to-speech).
