const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Path to the images directory in the react-app
const imagesDir = path.join(__dirname, 'softhe.io', 'react-app', 'public', 'images');

console.log(`Scanning for images in: ${imagesDir}`);

if (!fs.existsSync(imagesDir)) {
	console.error(`Directory not found: ${imagesDir}`);
	process.exit(1);
}

fs.readdir(imagesDir, (err, files) => {
	if (err) {
		console.error('Error reading directory:', err);
		return;
	}

	let convertedCount = 0;

	files.forEach(file => {
		const ext = path.extname(file).toLowerCase();
		// Target PNG and JPEG files
		if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
			const inputPath = path.join(imagesDir, file);
			const outputPath = path.join(imagesDir, path.basename(file, ext) + '.webp');

			sharp(inputPath)
				.webp({ quality: 80 }) // 80% quality usually gives good balance
				.toFile(outputPath)
				.then(info => {
					console.log(`✅ Converted ${file} -> ${path.basename(outputPath)} (Size: ${(info.size / 1024).toFixed(2)} KB)`);
				})
				.catch(err => {
					console.error(`❌ Error converting ${file}:`, err);
				});

			convertedCount++;
		}
	});

	if (convertedCount === 0) {
		console.log('No PNG or JPG images found to convert.');
	} else {
		console.log(`Found ${convertedCount} images to convert...`);
	}
});
