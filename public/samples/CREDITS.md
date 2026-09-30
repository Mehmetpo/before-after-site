# Sample image credits

The hero samples are built from six photos published on Unsplash under the
[Unsplash License](https://unsplash.com/license) (free for commercial and non-commercial use, no permission needed).

| Source file (`raw/`) | Photographer | Photo page | License | Used for |
|---|---|---|---|---|
| `_joB4Z4XScU.jpg` | Natalie Sierra | https://unsplash.com/photos/_joB4Z4XScU | Unsplash License | colorize |
| `EKIyHUrUHWU.jpg` | Adriel Kloppenburg | https://unsplash.com/photos/EKIyHUrUHWU | Unsplash License | mood |
| `5wDq-27_zKI.jpg` | Uran Wang | https://unsplash.com/photos/5wDq-27_zKI | Unsplash License | upscale, denoise |
| `Dmhjy9fDTKw.jpg` | Metin Ozer | https://unsplash.com/photos/Dmhjy9fDTKw | Unsplash License | grade |
| `VrKCuFTGOBI.jpg` | Luca Iaconelli | https://unsplash.com/photos/VrKCuFTGOBI | Unsplash License | sharpen, exposure |
| `N4C2DMEpWxo.jpg` | Eric Carlson | https://unsplash.com/photos/N4C2DMEpWxo | Unsplash License | hdr |

## How the pairs are made

Each `<slug>-before.webp` / `<slug>-after.webp` pair is generated from a single original photo by
`scripts/make-samples.mjs` (sharp): the photo is cropped to 1600x1200 and the "before" and "after"
variants are produced with synthetic edits (grayscale, flat grade, blur, pixelation, overexposure,
added noise, color grading, local contrast). The "before" images are artificially degraded for
demonstration; they do not represent the photographers' work.

To regenerate: download each photo from its page (`https://unsplash.com/photos/<id>/download`)
into `raw/<id>.jpg`, then run `node scripts/make-samples.mjs`.
