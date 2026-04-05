# Why pretext matters

@chenglou's pretext: text measurement without DOM. Pure arithmetic.

prepare(text, font) → cached analysis
layout(prepared, maxWidth, lineHeight) → height in ~0.0002ms

This is what makes 60fps continuous layout possible. The engine needs to know "does this text fit here?" on every frame. With DOM measurement that's impossible. With pretext it's free.

The entire visual system — what appears, what disappears, what size — is decided by math, not by rendering and checking.Hellooo