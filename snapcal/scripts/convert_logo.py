import os
try:
    import cairosvg
    cairosvg.svg2png(url='../assets/logo.svg', write_to='../assets/logo.png', output_width=144, output_height=144)
    print("Successfully converted logo.svg to logo.png")
except ImportError:
    print("Error: cairosvg module not found. Please install it with: pip install cairosvg")
except Exception as e:
    print(f"Conversion failed: {e}")
