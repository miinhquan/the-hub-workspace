# Effects Studio guide

Open `/ai/admin/effects` and sign in with the preview administrator password. Opening `/ai` never asks for microphone or camera permissions.

## Create a look

Choose **Welcome button**, **Transition**, **AI orb**, **Tour cards**, or **Global motion**. Every slider has an exact numeric input. Color pickers, effect switches, and the easing selector update the Draft canvas immediately. The operating system's reduced-motion preference always takes priority.

Welcome settings change the glass button's size, corners, opacity, blur, reflection, glow, shadow, hover/press response and idle movement. Transition settings change the expansion duration, scale endpoints, fade/blur timing, background and easing. Spring stiffness and damping apply when the **spring** easing is selected.

Orb settings control its size/vertical offset, colors, halo, shader deformation/noise, speed, amplitude sensitivity, rotation, blur/opacity and per-state animation. Show **Listening**, **Thinking**, or **Speaking** in the Simulation Lab to compare the effect. Tour settings control card layout, image scale, blur/stagger, spring entrance, focus scale, opacity and mouse-drag sensitivity. Touch uses native momentum scrolling and snapping.

## Preview a sequence

Select Ha Long Bay, Ha Giang Loop, Laundry help, or Switch languages. **Play** runs the predefined scenario; **Pause** retains the remaining delay, **Replay scenario** starts again, and **Next simulation step** advances without autoplay. Changing scenarios clears the previous paused sequence.

Use state shortcuts to inspect individual moments. **Tour details** opens a sample detail dialog. **Return to orb** dismisses tour content. **Visitor present/left** simulates departure and ends the current session. **Full sequence** resets to Welcome, opens Home, then runs the selected scenario. To review the actual glass expansion itself, choose **Welcome** and press **Tap to Start** in the canvas. These controls never access a microphone, create a real inquiry, or send a message.

The event timeline distinguishes states, customer lines, agent lines, simulated function calls and system controls. Draft animations use the same components as the visitor experience.

## Save and publish

- **Save draft** stores the draft and preset library on the preview server. It does not change visitor settings.
- A browser recovery draft is also retained locally as you work. Use **Save draft** before changing devices.
- Name a look, then use the disk icon to **Save preset**. The copy icon **duplicates** it. Choose a saved or built-in preset to apply it to Draft. Up to 30 custom presets are supported.
- The **•••** menu exports/imports versioned JSON or restores Published into Draft. Imports are validated in the browser and again on the server.
- **Compare published** previews the current published configuration without changing Draft.
- **Reset to default** resets Draft. Save or Publish explicitly to persist that choice.
- **Publish configuration** requires the server's authenticated admin session and updates only this preview's visitor configuration. Reload `/ai` after publishing. Cross-edge KV propagation can delay visibility.

Desktop, portrait and mobile buttons resize the canvas. The visitor fullscreen control enters/exits kiosk fullscreen when the browser allows it; Escape also exits fullscreen. All main controls support touch and keyboard. Native tour dialogs trap focus and close with Escape.

No production website, production data, price, seat availability, real booking, or external message is changed by this Studio.
