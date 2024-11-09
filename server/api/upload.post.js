import { writeFile, mkdir, readFile, unlink, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import formidable from 'formidable'

export default defineEventHandler(async (event) => {
  // Disable body parsing since we're handling multipart form data
  const form = formidable({
    uploadDir: join(process.cwd(), 'public/uploads'),
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    filter: function ({ name, originalFilename, mimetype }) {
      // Accept only images
      return mimetype && mimetype.includes("image");
    },
  });

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file[0];
    const userId = fields.userId[0];

    if (!file || !userId) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      });
    }

    // Create user directory
    const userDir = join('public/uploads', userId);
    await mkdir(userDir, { recursive: true });

    // Generate filename (keeping the original name to maintain consistency)
    const fileName = file.originalFilename;
    const newPath = join(userDir, fileName);

    // Check for and remove existing file with the same name
    try {
      const files = await readdir(userDir);
      const existingFile = files.find(f => f === fileName);
      if (existingFile) {
        await unlink(join(userDir, existingFile));
      }
    } catch (error) {
      // Directory might not exist yet, which is fine
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Move file to final destination
    await writeFile(newPath, await readFile(file.filepath));

    // Clean up temp file
    await unlink(file.filepath);

    // Return the public URL
    return {
      fileUrl: `/uploads/${userId}/${fileName}`
    };

  } catch (error) {
    console.error('Upload error:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Error uploading file'
    });
  }
})