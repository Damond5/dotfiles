# Convert image formats
magick image.heic image.png

# Plot CSV data
xan plot '"X NAME"' '"Y NAME"' FILE-NAME.csv --cols 0.6 --rows 27 --y-min 61690

# Reduce video size
ffmpeg -i input.mp4 -vcodec libx265 -crf 28 output.mp4
