# 3D Models

This directory is served at `/models/` by Vercel. Place GLB assets
here to populate the 3D scenes on the marketing pages.

## Expected files

| Path                              | Used on             | Recommended source              |
| --------------------------------- | ------------------- | ------------------------------- |
| `waste-industrial-plant.glb`      | `/waste-to-energy.html` | Sketchfab (CC0 / CC-BY industrial plant) |
| `data-center-hall.glb`            | `/data-centers.html`    | Sketchfab (CC0 / CC-BY server room) |

If a file is missing, the page renders a clean fallback panel
indicating the expected asset path.

## Guidelines for source models

- Format: glTF binary (`.glb`) — embedded textures preferred.
- Scale: real-world units. The scene auto-fits the camera to the
  model's bounding box.
- Origin: at the base of the structure (the model's lowest point
  should sit on y = 0).
- Triangle count: under ~500k for smooth performance on mid-range
  hardware.
- License: CC0 or CC BY with attribution recorded in a separate
  CREDITS.md.

## How to swap in a real model

1. Download a `.glb` from Sketchfab (free CC models exist for
   refineries, power plants, server rooms).
2. Rename it to match the expected path above.
3. Drop it into this directory and push.
4. Vercel deploys; the page swaps the fallback panel for the
   live model on next load.
